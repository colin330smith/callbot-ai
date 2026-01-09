"""
PostgreSQL Database Layer for CallBotAI
Production-ready with connection pooling and proper async support
"""

import os
import asyncio
from datetime import datetime, timedelta
from typing import Optional, List, Dict, Any
from contextlib import asynccontextmanager
import json
import uuid

import asyncpg
from asyncpg.pool import Pool

# Database URL
DATABASE_URL = os.getenv(
    "DATABASE_URL",
    "postgresql://localhost/callbotai"
)

# Connection pool
_pool: Optional[Pool] = None


async def get_pool() -> Pool:
    """Get or create connection pool"""
    global _pool
    if _pool is None:
        _pool = await asyncpg.create_pool(
            DATABASE_URL,
            min_size=5,
            max_size=20,
            command_timeout=60
        )
    return _pool


async def close_pool():
    """Close connection pool"""
    global _pool
    if _pool:
        await _pool.close()
        _pool = None


@asynccontextmanager
async def get_connection():
    """Get a connection from the pool"""
    pool = await get_pool()
    async with pool.acquire() as conn:
        yield conn


async def init_db():
    """Initialize database tables"""
    async with get_connection() as conn:
        # Enable UUID extension
        await conn.execute('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"')

        # Users table
        await conn.execute("""
            CREATE TABLE IF NOT EXISTS users (
                id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
                email VARCHAR(255) UNIQUE NOT NULL,
                password_hash VARCHAR(255),
                name VARCHAR(255),
                created_at TIMESTAMPTZ DEFAULT NOW(),
                updated_at TIMESTAMPTZ DEFAULT NOW(),
                status VARCHAR(50) DEFAULT 'active',
                email_verified BOOLEAN DEFAULT FALSE,
                email_verified_at TIMESTAMPTZ,
                last_login_at TIMESTAMPTZ
            )
        """)

        # Create index on email
        await conn.execute("""
            CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)
        """)

        # Password reset tokens
        await conn.execute("""
            CREATE TABLE IF NOT EXISTS password_reset_tokens (
                id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
                user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                token VARCHAR(255) UNIQUE NOT NULL,
                expires_at TIMESTAMPTZ NOT NULL,
                used_at TIMESTAMPTZ,
                created_at TIMESTAMPTZ DEFAULT NOW()
            )
        """)

        # Businesses table
        await conn.execute("""
            CREATE TABLE IF NOT EXISTS businesses (
                id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
                user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                name VARCHAR(255) NOT NULL,
                industry VARCHAR(100),
                phone VARCHAR(50),
                address TEXT,
                website VARCHAR(255),
                service_area VARCHAR(255),
                business_hours TEXT,
                services TEXT,
                faq TEXT,
                custom_instructions TEXT,

                -- Pricing info
                pricing JSONB DEFAULT '{}',
                offers_financing BOOLEAN DEFAULT FALSE,
                offers_emergency BOOLEAN DEFAULT FALSE,
                response_time VARCHAR(50),
                appointment_types TEXT[],

                -- Vapi integration
                vapi_assistant_id VARCHAR(255),
                vapi_phone_number VARCHAR(50),

                -- Stripe
                stripe_customer_id VARCHAR(255),
                stripe_subscription_id VARCHAR(255),
                subscription_status VARCHAR(50) DEFAULT 'trial',
                trial_ends_at TIMESTAMPTZ,

                -- Settings
                notification_email VARCHAR(255),
                notification_phone VARCHAR(50),
                notification_sms_enabled BOOLEAN DEFAULT TRUE,
                notification_email_enabled BOOLEAN DEFAULT TRUE,

                -- Agent config
                agent_name VARCHAR(100) DEFAULT 'Alex',
                agent_voice VARCHAR(50) DEFAULT 'rachel',
                first_message TEXT,

                -- Timestamps
                created_at TIMESTAMPTZ DEFAULT NOW(),
                updated_at TIMESTAMPTZ DEFAULT NOW(),
                status VARCHAR(50) DEFAULT 'onboarding'
            )
        """)

        # Create indexes
        await conn.execute("""
            CREATE INDEX IF NOT EXISTS idx_businesses_user_id ON businesses(user_id)
        """)
        await conn.execute("""
            CREATE INDEX IF NOT EXISTS idx_businesses_stripe_customer ON businesses(stripe_customer_id)
        """)
        await conn.execute("""
            CREATE INDEX IF NOT EXISTS idx_businesses_vapi_assistant ON businesses(vapi_assistant_id)
        """)

        # Calls table
        await conn.execute("""
            CREATE TABLE IF NOT EXISTS calls (
                id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
                business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
                vapi_call_id VARCHAR(255),
                caller_phone VARCHAR(50),
                caller_name VARCHAR(255),
                duration INTEGER DEFAULT 0,
                transcript TEXT,
                summary TEXT,
                sentiment VARCHAR(50),
                intent VARCHAR(100),
                appointment_booked BOOLEAN DEFAULT FALSE,
                appointment_date TIMESTAMPTZ,
                appointment_type VARCHAR(100),
                recording_url TEXT,
                recording_duration INTEGER,
                cost DECIMAL(10, 4),
                metadata JSONB DEFAULT '{}',
                created_at TIMESTAMPTZ DEFAULT NOW()
            )
        """)

        # Create indexes for calls
        await conn.execute("""
            CREATE INDEX IF NOT EXISTS idx_calls_business_id ON calls(business_id)
        """)
        await conn.execute("""
            CREATE INDEX IF NOT EXISTS idx_calls_created_at ON calls(created_at DESC)
        """)
        await conn.execute("""
            CREATE INDEX IF NOT EXISTS idx_calls_vapi_call_id ON calls(vapi_call_id)
        """)

        # Appointments table (extracted from calls for better tracking)
        await conn.execute("""
            CREATE TABLE IF NOT EXISTS appointments (
                id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
                business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
                call_id UUID REFERENCES calls(id) ON DELETE SET NULL,
                customer_name VARCHAR(255) NOT NULL,
                customer_phone VARCHAR(50),
                customer_email VARCHAR(255),
                service_type VARCHAR(255),
                preferred_date DATE,
                preferred_time VARCHAR(50),
                notes TEXT,
                is_emergency BOOLEAN DEFAULT FALSE,
                status VARCHAR(50) DEFAULT 'pending',
                confirmed_at TIMESTAMPTZ,
                cancelled_at TIMESTAMPTZ,
                calendar_event_id VARCHAR(255),
                created_at TIMESTAMPTZ DEFAULT NOW(),
                updated_at TIMESTAMPTZ DEFAULT NOW()
            )
        """)

        await conn.execute("""
            CREATE INDEX IF NOT EXISTS idx_appointments_business_id ON appointments(business_id)
        """)
        await conn.execute("""
            CREATE INDEX IF NOT EXISTS idx_appointments_date ON appointments(preferred_date)
        """)

        # Onboarding sessions
        await conn.execute("""
            CREATE TABLE IF NOT EXISTS onboarding_sessions (
                id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
                user_id UUID REFERENCES users(id) ON DELETE CASCADE,
                business_id UUID REFERENCES businesses(id) ON DELETE CASCADE,
                step INTEGER DEFAULT 1,
                data JSONB DEFAULT '{}',
                completed BOOLEAN DEFAULT FALSE,
                created_at TIMESTAMPTZ DEFAULT NOW(),
                updated_at TIMESTAMPTZ DEFAULT NOW()
            )
        """)

        # Audit log for tracking changes
        await conn.execute("""
            CREATE TABLE IF NOT EXISTS audit_log (
                id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
                user_id UUID REFERENCES users(id) ON DELETE SET NULL,
                business_id UUID REFERENCES businesses(id) ON DELETE SET NULL,
                action VARCHAR(100) NOT NULL,
                entity_type VARCHAR(100),
                entity_id UUID,
                old_values JSONB,
                new_values JSONB,
                ip_address INET,
                user_agent TEXT,
                created_at TIMESTAMPTZ DEFAULT NOW()
            )
        """)

        await conn.execute("""
            CREATE INDEX IF NOT EXISTS idx_audit_log_user ON audit_log(user_id)
        """)
        await conn.execute("""
            CREATE INDEX IF NOT EXISTS idx_audit_log_business ON audit_log(business_id)
        """)

        # Create updated_at trigger function
        await conn.execute("""
            CREATE OR REPLACE FUNCTION update_updated_at_column()
            RETURNS TRIGGER AS $$
            BEGIN
                NEW.updated_at = NOW();
                RETURN NEW;
            END;
            $$ language 'plpgsql'
        """)

        # Apply trigger to relevant tables
        for table in ['users', 'businesses', 'appointments', 'onboarding_sessions']:
            await conn.execute(f"""
                DROP TRIGGER IF EXISTS update_{table}_updated_at ON {table};
                CREATE TRIGGER update_{table}_updated_at
                    BEFORE UPDATE ON {table}
                    FOR EACH ROW
                    EXECUTE FUNCTION update_updated_at_column()
            """)


# =============================================================================
# User Functions
# =============================================================================

async def create_user(email: str, name: str = None, password_hash: str = None) -> str:
    """Create a new user"""
    async with get_connection() as conn:
        row = await conn.fetchrow("""
            INSERT INTO users (email, name, password_hash)
            VALUES ($1, $2, $3)
            RETURNING id
        """, email, name, password_hash)
        return str(row['id'])


async def get_user(user_id: str) -> Optional[Dict]:
    """Get user by ID"""
    async with get_connection() as conn:
        row = await conn.fetchrow(
            "SELECT * FROM users WHERE id = $1",
            uuid.UUID(user_id)
        )
        return dict(row) if row else None


async def get_user_by_email(email: str) -> Optional[Dict]:
    """Get user by email"""
    async with get_connection() as conn:
        row = await conn.fetchrow(
            "SELECT * FROM users WHERE email = $1",
            email
        )
        if row:
            result = dict(row)
            result['id'] = str(result['id'])
            return result
        return None


async def update_user(user_id: str, **kwargs) -> bool:
    """Update user fields"""
    if not kwargs:
        return False

    fields = ", ".join([f"{k} = ${i+2}" for i, k in enumerate(kwargs.keys())])
    values = [uuid.UUID(user_id)] + list(kwargs.values())

    async with get_connection() as conn:
        result = await conn.execute(
            f"UPDATE users SET {fields} WHERE id = $1",
            *values
        )
        return result == "UPDATE 1"


# =============================================================================
# Password Reset Functions
# =============================================================================

async def create_password_reset_token(user_id: str) -> str:
    """Create a password reset token"""
    import secrets
    token = secrets.token_urlsafe(32)
    expires_at = datetime.utcnow() + timedelta(hours=1)

    async with get_connection() as conn:
        await conn.execute("""
            INSERT INTO password_reset_tokens (user_id, token, expires_at)
            VALUES ($1, $2, $3)
        """, uuid.UUID(user_id), token, expires_at)

    return token


async def verify_password_reset_token(token: str) -> Optional[str]:
    """Verify token and return user_id if valid"""
    async with get_connection() as conn:
        row = await conn.fetchrow("""
            SELECT user_id FROM password_reset_tokens
            WHERE token = $1 AND expires_at > NOW() AND used_at IS NULL
        """, token)

        if row:
            # Mark token as used
            await conn.execute("""
                UPDATE password_reset_tokens SET used_at = NOW() WHERE token = $1
            """, token)
            return str(row['user_id'])
        return None


# =============================================================================
# Business Functions
# =============================================================================

async def create_business(user_id: str, name: str, industry: str = None) -> str:
    """Create a new business"""
    trial_ends = datetime.utcnow() + timedelta(days=7)

    async with get_connection() as conn:
        row = await conn.fetchrow("""
            INSERT INTO businesses (user_id, name, industry, trial_ends_at)
            VALUES ($1, $2, $3, $4)
            RETURNING id
        """, uuid.UUID(user_id), name, industry, trial_ends)
        return str(row['id'])


async def get_business(business_id: str) -> Optional[Dict]:
    """Get business by ID"""
    async with get_connection() as conn:
        row = await conn.fetchrow(
            "SELECT * FROM businesses WHERE id = $1",
            uuid.UUID(business_id)
        )
        if row:
            result = dict(row)
            result['id'] = str(result['id'])
            result['user_id'] = str(result['user_id'])
            return result
        return None


async def get_user_businesses(user_id: str) -> List[Dict]:
    """Get all businesses for a user"""
    async with get_connection() as conn:
        rows = await conn.fetch("""
            SELECT * FROM businesses
            WHERE user_id = $1
            ORDER BY created_at DESC
        """, uuid.UUID(user_id))

        result = []
        for row in rows:
            d = dict(row)
            d['id'] = str(d['id'])
            d['user_id'] = str(d['user_id'])
            result.append(d)
        return result


async def get_business_by_stripe_customer(customer_id: str) -> Optional[Dict]:
    """Get business by Stripe customer ID"""
    async with get_connection() as conn:
        row = await conn.fetchrow(
            "SELECT * FROM businesses WHERE stripe_customer_id = $1",
            customer_id
        )
        if row:
            result = dict(row)
            result['id'] = str(result['id'])
            result['user_id'] = str(result['user_id'])
            return result
        return None


async def get_business_by_vapi_assistant(assistant_id: str) -> Optional[Dict]:
    """Get business by Vapi assistant ID"""
    async with get_connection() as conn:
        row = await conn.fetchrow(
            "SELECT * FROM businesses WHERE vapi_assistant_id = $1",
            assistant_id
        )
        if row:
            result = dict(row)
            result['id'] = str(result['id'])
            result['user_id'] = str(result['user_id'])
            return result
        return None


async def update_business(business_id: str, **kwargs) -> bool:
    """Update business fields"""
    if not kwargs:
        return False

    # Handle JSONB fields
    if 'pricing' in kwargs and isinstance(kwargs['pricing'], dict):
        kwargs['pricing'] = json.dumps(kwargs['pricing'])

    fields = ", ".join([f"{k} = ${i+2}" for i, k in enumerate(kwargs.keys())])
    values = [uuid.UUID(business_id)] + list(kwargs.values())

    async with get_connection() as conn:
        result = await conn.execute(
            f"UPDATE businesses SET {fields} WHERE id = $1",
            *values
        )
        return "UPDATE" in result


# =============================================================================
# Call Functions
# =============================================================================

async def create_call(business_id: str, vapi_call_id: str = None, caller_phone: str = None, **kwargs) -> str:
    """Create a call record"""
    fields = ["business_id", "vapi_call_id", "caller_phone"]
    values = [uuid.UUID(business_id), vapi_call_id, caller_phone]

    for k, v in kwargs.items():
        fields.append(k)
        values.append(v)

    placeholders = ", ".join([f"${i+1}" for i in range(len(fields))])
    field_names = ", ".join(fields)

    async with get_connection() as conn:
        row = await conn.fetchrow(
            f"INSERT INTO calls ({field_names}) VALUES ({placeholders}) RETURNING id",
            *values
        )
        return str(row['id'])


async def get_call(call_id: str) -> Optional[Dict]:
    """Get a single call"""
    async with get_connection() as conn:
        row = await conn.fetchrow(
            "SELECT * FROM calls WHERE id = $1",
            uuid.UUID(call_id)
        )
        if row:
            result = dict(row)
            result['id'] = str(result['id'])
            result['business_id'] = str(result['business_id'])
            return result
        return None


async def get_business_calls(business_id: str, limit: int = 50, offset: int = 0) -> List[Dict]:
    """Get calls for a business with pagination"""
    async with get_connection() as conn:
        rows = await conn.fetch("""
            SELECT * FROM calls
            WHERE business_id = $1
            ORDER BY created_at DESC
            LIMIT $2 OFFSET $3
        """, uuid.UUID(business_id), limit, offset)

        result = []
        for row in rows:
            d = dict(row)
            d['id'] = str(d['id'])
            d['business_id'] = str(d['business_id'])
            result.append(d)
        return result


async def get_call_by_vapi_id(vapi_call_id: str) -> Optional[Dict]:
    """Get call by Vapi call ID"""
    async with get_connection() as conn:
        row = await conn.fetchrow(
            "SELECT * FROM calls WHERE vapi_call_id = $1",
            vapi_call_id
        )
        if row:
            result = dict(row)
            result['id'] = str(result['id'])
            result['business_id'] = str(result['business_id'])
            return result
        return None


# =============================================================================
# Appointment Functions
# =============================================================================

async def create_appointment(
    business_id: str,
    customer_name: str,
    customer_phone: str = None,
    customer_email: str = None,
    service_type: str = None,
    preferred_date: str = None,
    preferred_time: str = None,
    notes: str = None,
    is_emergency: bool = False,
    call_id: str = None
) -> str:
    """Create an appointment record"""
    async with get_connection() as conn:
        row = await conn.fetchrow("""
            INSERT INTO appointments
            (business_id, call_id, customer_name, customer_phone, customer_email,
             service_type, preferred_date, preferred_time, notes, is_emergency)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
            RETURNING id
        """,
            uuid.UUID(business_id),
            uuid.UUID(call_id) if call_id else None,
            customer_name,
            customer_phone,
            customer_email,
            service_type,
            preferred_date,
            preferred_time,
            notes,
            is_emergency
        )
        return str(row['id'])


async def get_business_appointments(
    business_id: str,
    status: str = None,
    start_date: str = None,
    end_date: str = None,
    limit: int = 50
) -> List[Dict]:
    """Get appointments for a business"""
    query = "SELECT * FROM appointments WHERE business_id = $1"
    params = [uuid.UUID(business_id)]
    param_idx = 2

    if status:
        query += f" AND status = ${param_idx}"
        params.append(status)
        param_idx += 1

    if start_date:
        query += f" AND preferred_date >= ${param_idx}"
        params.append(start_date)
        param_idx += 1

    if end_date:
        query += f" AND preferred_date <= ${param_idx}"
        params.append(end_date)
        param_idx += 1

    query += f" ORDER BY preferred_date ASC, preferred_time ASC LIMIT ${param_idx}"
    params.append(limit)

    async with get_connection() as conn:
        rows = await conn.fetch(query, *params)
        result = []
        for row in rows:
            d = dict(row)
            d['id'] = str(d['id'])
            d['business_id'] = str(d['business_id'])
            if d.get('call_id'):
                d['call_id'] = str(d['call_id'])
            result.append(d)
        return result


async def update_appointment(appointment_id: str, **kwargs) -> bool:
    """Update appointment"""
    if not kwargs:
        return False

    fields = ", ".join([f"{k} = ${i+2}" for i, k in enumerate(kwargs.keys())])
    values = [uuid.UUID(appointment_id)] + list(kwargs.values())

    async with get_connection() as conn:
        result = await conn.execute(
            f"UPDATE appointments SET {fields} WHERE id = $1",
            *values
        )
        return "UPDATE" in result


# =============================================================================
# Stats Functions
# =============================================================================

async def get_business_stats(business_id: str, days: int = 30) -> Dict:
    """Get comprehensive stats for a business"""
    async with get_connection() as conn:
        bid = uuid.UUID(business_id)

        # Total calls
        total = await conn.fetchval(
            "SELECT COUNT(*) FROM calls WHERE business_id = $1",
            bid
        )

        # Calls today
        today = await conn.fetchval("""
            SELECT COUNT(*) FROM calls
            WHERE business_id = $1 AND created_at >= CURRENT_DATE
        """, bid)

        # Calls this week
        week = await conn.fetchval("""
            SELECT COUNT(*) FROM calls
            WHERE business_id = $1 AND created_at >= CURRENT_DATE - INTERVAL '7 days'
        """, bid)

        # Calls this month
        month = await conn.fetchval("""
            SELECT COUNT(*) FROM calls
            WHERE business_id = $1 AND created_at >= CURRENT_DATE - INTERVAL '30 days'
        """, bid)

        # Appointments booked
        appointments = await conn.fetchval("""
            SELECT COUNT(*) FROM calls
            WHERE business_id = $1 AND appointment_booked = TRUE
        """, bid)

        # Pending appointments
        pending_appointments = await conn.fetchval("""
            SELECT COUNT(*) FROM appointments
            WHERE business_id = $1 AND status = 'pending'
        """, bid)

        # Average duration
        avg_duration = await conn.fetchval("""
            SELECT AVG(duration) FROM calls
            WHERE business_id = $1 AND duration > 0
        """, bid) or 0

        # Total call time
        total_duration = await conn.fetchval("""
            SELECT SUM(duration) FROM calls WHERE business_id = $1
        """, bid) or 0

        # Calls by day (last 7 days)
        daily_calls = await conn.fetch("""
            SELECT DATE(created_at) as date, COUNT(*) as count
            FROM calls
            WHERE business_id = $1 AND created_at >= CURRENT_DATE - INTERVAL '7 days'
            GROUP BY DATE(created_at)
            ORDER BY date
        """, bid)

        # Calls by hour (for peak hours analysis)
        hourly_calls = await conn.fetch("""
            SELECT EXTRACT(HOUR FROM created_at) as hour, COUNT(*) as count
            FROM calls
            WHERE business_id = $1 AND created_at >= CURRENT_DATE - INTERVAL '30 days'
            GROUP BY EXTRACT(HOUR FROM created_at)
            ORDER BY hour
        """, bid)

        # Conversion rate
        conversion_rate = (appointments / total * 100) if total > 0 else 0

        return {
            "total_calls": total,
            "calls_today": today,
            "calls_this_week": week,
            "calls_this_month": month,
            "appointments_booked": appointments,
            "pending_appointments": pending_appointments,
            "avg_duration_seconds": round(float(avg_duration), 1),
            "total_duration_seconds": total_duration,
            "total_duration_formatted": f"{total_duration // 3600}h {(total_duration % 3600) // 60}m",
            "conversion_rate": round(conversion_rate, 1),
            "daily_calls": [{"date": str(r['date']), "count": r['count']} for r in daily_calls],
            "hourly_distribution": [{"hour": int(r['hour']), "count": r['count']} for r in hourly_calls]
        }


# =============================================================================
# Onboarding Functions
# =============================================================================

async def create_onboarding_session(user_id: str = None, business_id: str = None) -> str:
    """Create an onboarding session"""
    async with get_connection() as conn:
        row = await conn.fetchrow("""
            INSERT INTO onboarding_sessions (user_id, business_id, data)
            VALUES ($1, $2, $3)
            RETURNING id
        """,
            uuid.UUID(user_id) if user_id else None,
            uuid.UUID(business_id) if business_id else None,
            '{}'
        )
        return str(row['id'])


async def get_onboarding_session(session_id: str) -> Optional[Dict]:
    """Get onboarding session"""
    async with get_connection() as conn:
        row = await conn.fetchrow(
            "SELECT * FROM onboarding_sessions WHERE id = $1",
            uuid.UUID(session_id)
        )
        if row:
            result = dict(row)
            result['id'] = str(result['id'])
            if result.get('user_id'):
                result['user_id'] = str(result['user_id'])
            if result.get('business_id'):
                result['business_id'] = str(result['business_id'])
            return result
        return None


async def update_onboarding_session(session_id: str, step: int = None, data: Dict = None, completed: bool = None):
    """Update onboarding session"""
    updates = []
    values = [uuid.UUID(session_id)]
    idx = 2

    if step is not None:
        updates.append(f"step = ${idx}")
        values.append(step)
        idx += 1

    if data is not None:
        updates.append(f"data = ${idx}")
        values.append(json.dumps(data))
        idx += 1

    if completed is not None:
        updates.append(f"completed = ${idx}")
        values.append(completed)
        idx += 1

    if not updates:
        return

    async with get_connection() as conn:
        await conn.execute(
            f"UPDATE onboarding_sessions SET {', '.join(updates)} WHERE id = $1",
            *values
        )


# =============================================================================
# Audit Log Functions
# =============================================================================

async def log_audit(
    action: str,
    entity_type: str = None,
    entity_id: str = None,
    user_id: str = None,
    business_id: str = None,
    old_values: Dict = None,
    new_values: Dict = None,
    ip_address: str = None,
    user_agent: str = None
):
    """Log an audit entry"""
    async with get_connection() as conn:
        await conn.execute("""
            INSERT INTO audit_log
            (user_id, business_id, action, entity_type, entity_id, old_values, new_values, ip_address, user_agent)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        """,
            uuid.UUID(user_id) if user_id else None,
            uuid.UUID(business_id) if business_id else None,
            action,
            entity_type,
            uuid.UUID(entity_id) if entity_id else None,
            json.dumps(old_values) if old_values else None,
            json.dumps(new_values) if new_values else None,
            ip_address,
            user_agent
        )
