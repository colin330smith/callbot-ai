"""
Database models and setup for CallBotAI
Using SQLite for simplicity - can migrate to Postgres later
"""

import sqlite3
import json
from datetime import datetime
from typing import Optional, List, Dict, Any
from contextlib import contextmanager

DATABASE_PATH = "callbotai.db"


@contextmanager
def get_db():
    """Get database connection"""
    conn = sqlite3.connect(DATABASE_PATH)
    conn.row_factory = sqlite3.Row
    try:
        yield conn
    finally:
        conn.close()


def init_db():
    """Initialize database tables"""
    with get_db() as conn:
        cursor = conn.cursor()

        # Users table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS users (
                id TEXT PRIMARY KEY,
                email TEXT UNIQUE NOT NULL,
                password_hash TEXT,
                name TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                status TEXT DEFAULT 'active'
            )
        """)

        # Businesses table (one user can have multiple businesses)
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS businesses (
                id TEXT PRIMARY KEY,
                user_id TEXT NOT NULL,
                name TEXT NOT NULL,
                industry TEXT,
                phone TEXT,
                address TEXT,
                website TEXT,
                business_hours TEXT,
                services TEXT,
                faq TEXT,
                custom_instructions TEXT,

                -- Vapi integration
                vapi_assistant_id TEXT,
                vapi_phone_number TEXT,

                -- Stripe
                stripe_customer_id TEXT,
                stripe_subscription_id TEXT,
                subscription_status TEXT DEFAULT 'trial',
                trial_ends_at TIMESTAMP,

                -- Settings
                notification_email TEXT,
                notification_phone TEXT,
                notification_sms_enabled INTEGER DEFAULT 1,
                notification_email_enabled INTEGER DEFAULT 1,

                -- Agent config
                agent_name TEXT DEFAULT 'Alex',
                agent_voice TEXT DEFAULT 'rachel',
                first_message TEXT,

                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                status TEXT DEFAULT 'onboarding',

                FOREIGN KEY (user_id) REFERENCES users(id)
            )
        """)

        # Calls table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS calls (
                id TEXT PRIMARY KEY,
                business_id TEXT NOT NULL,
                vapi_call_id TEXT,
                caller_phone TEXT,
                caller_name TEXT,
                duration INTEGER,
                transcript TEXT,
                summary TEXT,
                sentiment TEXT,
                intent TEXT,
                appointment_booked INTEGER DEFAULT 0,
                appointment_date TEXT,
                recording_url TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

                FOREIGN KEY (business_id) REFERENCES businesses(id)
            )
        """)

        # Onboarding progress
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS onboarding_sessions (
                id TEXT PRIMARY KEY,
                user_id TEXT,
                business_id TEXT,
                step INTEGER DEFAULT 1,
                data TEXT,  -- JSON blob of collected data
                completed INTEGER DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)

        conn.commit()


# User functions
def create_user(email: str, name: str = None, password_hash: str = None) -> str:
    """Create a new user"""
    import uuid
    user_id = f"user_{uuid.uuid4().hex[:12]}"

    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute(
            "INSERT INTO users (id, email, name, password_hash) VALUES (?, ?, ?, ?)",
            (user_id, email, name, password_hash)
        )
        conn.commit()

    return user_id


def get_user_by_email(email: str) -> Optional[Dict]:
    """Get user by email"""
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM users WHERE email = ?", (email,))
        row = cursor.fetchone()
        return dict(row) if row else None


def get_user(user_id: str) -> Optional[Dict]:
    """Get user by ID"""
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM users WHERE id = ?", (user_id,))
        row = cursor.fetchone()
        return dict(row) if row else None


# Business functions
def create_business(user_id: str, name: str, industry: str = None) -> str:
    """Create a new business"""
    import uuid
    from datetime import timedelta

    business_id = f"biz_{uuid.uuid4().hex[:12]}"
    trial_ends = datetime.now() + timedelta(days=7)

    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("""
            INSERT INTO businesses (id, user_id, name, industry, trial_ends_at)
            VALUES (?, ?, ?, ?, ?)
        """, (business_id, user_id, name, industry, trial_ends))
        conn.commit()

    return business_id


def update_business(business_id: str, **kwargs) -> bool:
    """Update business fields"""
    if not kwargs:
        return False

    fields = ", ".join([f"{k} = ?" for k in kwargs.keys()])
    values = list(kwargs.values()) + [business_id]

    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute(
            f"UPDATE businesses SET {fields}, updated_at = CURRENT_TIMESTAMP WHERE id = ?",
            values
        )
        conn.commit()
        return cursor.rowcount > 0


def get_business(business_id: str) -> Optional[Dict]:
    """Get business by ID"""
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM businesses WHERE id = ?", (business_id,))
        row = cursor.fetchone()
        return dict(row) if row else None


def get_user_businesses(user_id: str) -> List[Dict]:
    """Get all businesses for a user"""
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute(
            "SELECT * FROM businesses WHERE user_id = ? ORDER BY created_at DESC",
            (user_id,)
        )
        return [dict(row) for row in cursor.fetchall()]


# Call functions
def create_call(business_id: str, vapi_call_id: str, caller_phone: str = None, **kwargs) -> str:
    """Create a call record"""
    import uuid
    call_id = f"call_{uuid.uuid4().hex[:12]}"

    fields = ["id", "business_id", "vapi_call_id", "caller_phone"]
    values = [call_id, business_id, vapi_call_id, caller_phone]

    for k, v in kwargs.items():
        fields.append(k)
        values.append(v)

    placeholders = ", ".join(["?" for _ in fields])
    field_names = ", ".join(fields)

    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute(f"INSERT INTO calls ({field_names}) VALUES ({placeholders})", values)
        conn.commit()

    return call_id


def get_business_calls(business_id: str, limit: int = 50) -> List[Dict]:
    """Get calls for a business"""
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute(
            "SELECT * FROM calls WHERE business_id = ? ORDER BY created_at DESC LIMIT ?",
            (business_id, limit)
        )
        return [dict(row) for row in cursor.fetchall()]


def get_call(call_id: str) -> Optional[Dict]:
    """Get a single call"""
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM calls WHERE id = ?", (call_id,))
        row = cursor.fetchone()
        return dict(row) if row else None


# Onboarding functions
def create_onboarding_session(user_id: str = None, business_id: str = None) -> str:
    """Create an onboarding session"""
    import uuid
    session_id = f"onb_{uuid.uuid4().hex[:12]}"

    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute(
            "INSERT INTO onboarding_sessions (id, user_id, business_id, data) VALUES (?, ?, ?, ?)",
            (session_id, user_id, business_id, "{}")
        )
        conn.commit()

    return session_id


def update_onboarding_session(session_id: str, step: int = None, data: Dict = None, completed: bool = None):
    """Update onboarding session"""
    updates = []
    values = []

    if step is not None:
        updates.append("step = ?")
        values.append(step)

    if data is not None:
        updates.append("data = ?")
        values.append(json.dumps(data))

    if completed is not None:
        updates.append("completed = ?")
        values.append(1 if completed else 0)

    if not updates:
        return

    values.append(session_id)

    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute(
            f"UPDATE onboarding_sessions SET {', '.join(updates)}, updated_at = CURRENT_TIMESTAMP WHERE id = ?",
            values
        )
        conn.commit()


def get_onboarding_session(session_id: str) -> Optional[Dict]:
    """Get onboarding session"""
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM onboarding_sessions WHERE id = ?", (session_id,))
        row = cursor.fetchone()
        if row:
            result = dict(row)
            result['data'] = json.loads(result['data']) if result['data'] else {}
            return result
        return None


# Stats functions
def get_business_stats(business_id: str) -> Dict:
    """Get stats for a business"""
    with get_db() as conn:
        cursor = conn.cursor()

        # Total calls
        cursor.execute("SELECT COUNT(*) as count FROM calls WHERE business_id = ?", (business_id,))
        total_calls = cursor.fetchone()['count']

        # Calls today
        cursor.execute(
            "SELECT COUNT(*) as count FROM calls WHERE business_id = ? AND date(created_at) = date('now')",
            (business_id,)
        )
        calls_today = cursor.fetchone()['count']

        # Calls this week
        cursor.execute(
            "SELECT COUNT(*) as count FROM calls WHERE business_id = ? AND created_at >= date('now', '-7 days')",
            (business_id,)
        )
        calls_week = cursor.fetchone()['count']

        # Appointments booked
        cursor.execute(
            "SELECT COUNT(*) as count FROM calls WHERE business_id = ? AND appointment_booked = 1",
            (business_id,)
        )
        appointments = cursor.fetchone()['count']

        # Average duration
        cursor.execute(
            "SELECT AVG(duration) as avg FROM calls WHERE business_id = ? AND duration > 0",
            (business_id,)
        )
        avg_duration = cursor.fetchone()['avg'] or 0

        return {
            "total_calls": total_calls,
            "calls_today": calls_today,
            "calls_this_week": calls_week,
            "appointments_booked": appointments,
            "avg_duration_seconds": round(avg_duration, 1),
            "conversion_rate": round(appointments / total_calls * 100, 1) if total_calls > 0 else 0
        }


# Initialize database on import
init_db()
