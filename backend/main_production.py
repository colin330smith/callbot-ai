"""
CallBot AI - Production Backend (Consolidated)
All-in-one production server for AI Phone Receptionist SaaS
"""

import os
import secrets
import hashlib
import asyncio
from datetime import datetime, timedelta
from typing import Optional, Dict, Any
from contextlib import asynccontextmanager

from fastapi import FastAPI, HTTPException, Request, Response, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import HTMLResponse, JSONResponse, RedirectResponse
from pydantic import BaseModel, EmailStr
import stripe
import httpx

# =============================================================================
# Configuration
# =============================================================================

ENVIRONMENT = os.getenv("ENVIRONMENT", "production")
PORT = int(os.getenv("PORT", 8080))
DATABASE_URL = os.getenv("DATABASE_URL", "")
REDIS_URL = os.getenv("REDIS_URL", "")
STRIPE_SECRET_KEY = os.getenv("STRIPE_SECRET_KEY", "")
STRIPE_WEBHOOK_SECRET = os.getenv("STRIPE_WEBHOOK_SECRET", "")
VAPI_API_KEY = os.getenv("VAPI_API_KEY", "")
RESEND_API_KEY = os.getenv("RESEND_API_KEY", "")
BASE_URL = os.getenv("BASE_URL", "https://callbot-backend-production.up.railway.app")

# Stripe Price IDs for tiers
PRICE_IDS = {
    "starter": os.getenv("STRIPE_PRICE_STARTER", "price_starter"),
    "professional": os.getenv("STRIPE_PRICE_PROFESSIONAL", "price_professional"),
    "enterprise": os.getenv("STRIPE_PRICE_ENTERPRISE", "price_enterprise")
}

if STRIPE_SECRET_KEY:
    stripe.api_key = STRIPE_SECRET_KEY

# =============================================================================
# Database (asyncpg)
# =============================================================================

_pool = None

async def get_pool():
    global _pool
    if _pool is None and DATABASE_URL:
        try:
            import asyncpg
            _pool = await asyncpg.create_pool(DATABASE_URL, min_size=2, max_size=10)
        except Exception as e:
            print(f"Database connection failed: {e}")
    return _pool

async def db_query(query: str, *args):
    pool = await get_pool()
    if not pool:
        return []
    async with pool.acquire() as conn:
        return await conn.fetch(query, *args)

async def db_execute(query: str, *args):
    pool = await get_pool()
    if not pool:
        return None
    async with pool.acquire() as conn:
        return await conn.execute(query, *args)

async def db_fetchrow(query: str, *args):
    pool = await get_pool()
    if not pool:
        return None
    async with pool.acquire() as conn:
        return await conn.fetchrow(query, *args)

# =============================================================================
# In-Memory Session Store (Redis fallback)
# =============================================================================

_sessions: Dict[str, Dict] = {}

async def create_session(user_id: str, email: str, business_id: str = None) -> str:
    token = secrets.token_urlsafe(32)
    _sessions[token] = {
        "user_id": user_id,
        "email": email,
        "business_id": business_id,
        "created_at": datetime.utcnow().isoformat()
    }
    return token

async def get_session(token: str) -> Optional[Dict]:
    return _sessions.get(token)

async def delete_session(token: str):
    _sessions.pop(token, None)

# =============================================================================
# Security
# =============================================================================

def hash_password(password: str) -> str:
    salt = secrets.token_hex(16)
    hashed = hashlib.pbkdf2_hmac('sha256', password.encode(), salt.encode(), 100000)
    return f"{salt}:{hashed.hex()}"

def verify_password(password: str, stored: str) -> bool:
    try:
        salt, hashed = stored.split(':')
        new_hash = hashlib.pbkdf2_hmac('sha256', password.encode(), salt.encode(), 100000)
        return new_hash.hex() == hashed
    except:
        return False

# =============================================================================
# Vapi Integration
# =============================================================================

async def create_vapi_assistant(business: Dict) -> Optional[str]:
    if not VAPI_API_KEY:
        return None

    try:
        async with httpx.AsyncClient() as client:
            response = await client.post(
                "https://api.vapi.ai/assistant",
                headers={"Authorization": f"Bearer {VAPI_API_KEY}"},
                json={
                    "name": f"{business['name']} AI Receptionist",
                    "voice": {"voiceId": "rachel", "provider": "11labs"},
                    "model": {
                        "provider": "openai",
                        "model": "gpt-4-turbo-preview",
                        "messages": [{
                            "role": "system",
                            "content": f"""You are {business.get('agent_name', 'Alex')}, a professional AI receptionist for {business['name']}.

Business Hours: {business.get('business_hours', 'Monday-Friday 9am-5pm')}
Services: {business.get('services', 'General services')}

Your job is to:
1. Answer calls professionally
2. Schedule appointments
3. Answer common questions
4. Take messages when needed

Be friendly, helpful, and efficient."""
                        }]
                    },
                    "firstMessage": f"Hello! Thank you for calling {business['name']}. This is {business.get('agent_name', 'Alex')}. How can I help you today?",
                    "serverUrl": f"{BASE_URL}/api/webhooks/vapi"
                },
                timeout=30
            )
            if response.status_code == 201:
                return response.json().get("id")
    except Exception as e:
        print(f"Vapi error: {e}")
    return None

async def create_vapi_phone(assistant_id: str) -> Optional[str]:
    if not VAPI_API_KEY:
        return None

    try:
        async with httpx.AsyncClient() as client:
            response = await client.post(
                "https://api.vapi.ai/phone-number",
                headers={"Authorization": f"Bearer {VAPI_API_KEY}"},
                json={"assistantId": assistant_id, "provider": "vapi"},
                timeout=30
            )
            if response.status_code == 201:
                return response.json().get("number")
    except Exception as e:
        print(f"Vapi phone error: {e}")
    return None

# =============================================================================
# Email Service
# =============================================================================

async def send_email(to: str, subject: str, html: str):
    if not RESEND_API_KEY:
        print(f"Email would be sent to {to}: {subject}")
        return

    try:
        async with httpx.AsyncClient() as client:
            await client.post(
                "https://api.resend.com/emails",
                headers={"Authorization": f"Bearer {RESEND_API_KEY}"},
                json={
                    "from": "CallBot AI <noreply@callbotai.com>",
                    "to": to,
                    "subject": subject,
                    "html": html
                }
            )
    except Exception as e:
        print(f"Email error: {e}")

# =============================================================================
# App Setup
# =============================================================================

@asynccontextmanager
async def lifespan(app: FastAPI):
    print(f"Starting CallBot AI on port {PORT}")
    # Initialize database in background
    asyncio.create_task(get_pool())
    yield
    print("Shutting down CallBot AI")
    if _pool:
        await _pool.close()

app = FastAPI(
    title="CallBot AI",
    version="3.0.0",
    description="AI Phone Receptionist SaaS Platform",
    lifespan=lifespan
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# =============================================================================
# Request Models
# =============================================================================

class SignupRequest(BaseModel):
    email: EmailStr
    password: str
    business_name: str
    tier: str = "starter"

class LoginRequest(BaseModel):
    email: EmailStr
    password: str

class OnboardingStep(BaseModel):
    step: int
    data: Dict[str, Any]

class BusinessUpdate(BaseModel):
    name: Optional[str] = None
    services: Optional[str] = None
    business_hours: Optional[str] = None
    agent_name: Optional[str] = None

# =============================================================================
# Auth Helpers
# =============================================================================

async def get_current_user(request: Request) -> Optional[Dict]:
    token = request.cookies.get("session") or request.headers.get("Authorization", "").replace("Bearer ", "")
    if not token:
        return None
    session = await get_session(token)
    if not session:
        return None
    user = await db_fetchrow("SELECT * FROM users WHERE id = $1", session["user_id"])
    return dict(user) if user else None

async def require_auth(request: Request) -> Dict:
    user = await get_current_user(request)
    if not user:
        raise HTTPException(status_code=401, detail="Not authenticated")
    return user

# =============================================================================
# Health & Status
# =============================================================================

@app.get("/")
async def root():
    return {
        "name": "CallBot AI",
        "version": "3.0.0",
        "status": "running",
        "timestamp": datetime.utcnow().isoformat()
    }

@app.get("/health")
async def health():
    db_status = "connected" if _pool else "disconnected"
    return {
        "status": "healthy",
        "timestamp": datetime.utcnow().isoformat(),
        "version": "3.0.0",
        "environment": ENVIRONMENT,
        "database": db_status,
        "stripe": "configured" if STRIPE_SECRET_KEY else "not_configured",
        "vapi": "configured" if VAPI_API_KEY else "not_configured"
    }

# =============================================================================
# Auth Endpoints
# =============================================================================

@app.post("/api/auth/signup")
async def signup(data: SignupRequest, response: Response, background_tasks: BackgroundTasks):
    # Check if user exists
    existing = await db_fetchrow("SELECT id FROM users WHERE email = $1", data.email)
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")

    # Create user
    user_id = f"usr_{secrets.token_hex(8)}"
    password_hash = hash_password(data.password)

    await db_execute(
        "INSERT INTO users (id, email, name, password_hash, created_at) VALUES ($1, $2, $3, $4, $5)",
        user_id, data.email, data.business_name, password_hash, datetime.utcnow()
    )

    # Create business
    business_id = f"biz_{secrets.token_hex(8)}"
    await db_execute(
        "INSERT INTO businesses (id, user_id, name, tier, status, created_at) VALUES ($1, $2, $3, $4, $5, $6)",
        business_id, user_id, data.business_name, data.tier, "onboarding", datetime.utcnow()
    )

    # Create session
    token = await create_session(user_id, data.email, business_id)
    response.set_cookie("session", token, httponly=True, secure=True, samesite="lax", max_age=86400*7)

    # Create Stripe customer
    if STRIPE_SECRET_KEY:
        try:
            customer = stripe.Customer.create(
                email=data.email,
                name=data.business_name,
                metadata={"user_id": user_id, "business_id": business_id}
            )
            await db_execute(
                "UPDATE businesses SET stripe_customer_id = $1 WHERE id = $2",
                customer.id, business_id
            )
        except Exception as e:
            print(f"Stripe error: {e}")

    # Send welcome email
    background_tasks.add_task(
        send_email,
        data.email,
        "Welcome to CallBot AI!",
        f"<h1>Welcome {data.business_name}!</h1><p>Your AI receptionist is almost ready. Complete the setup to go live.</p>"
    )

    return {
        "success": True,
        "user_id": user_id,
        "business_id": business_id,
        "redirect": f"/onboarding?business_id={business_id}"
    }

@app.post("/api/auth/login")
async def login(data: LoginRequest, response: Response):
    user = await db_fetchrow("SELECT * FROM users WHERE email = $1", data.email)
    if not user:
        raise HTTPException(status_code=401, detail="Invalid credentials")

    if not verify_password(data.password, user["password_hash"]):
        raise HTTPException(status_code=401, detail="Invalid credentials")

    business = await db_fetchrow("SELECT * FROM businesses WHERE user_id = $1 LIMIT 1", user["id"])
    business_id = business["id"] if business else None

    token = await create_session(user["id"], user["email"], business_id)
    response.set_cookie("session", token, httponly=True, secure=True, samesite="lax", max_age=86400*7)

    return {
        "success": True,
        "user_id": user["id"],
        "business_id": business_id,
        "redirect": f"/dashboard?business_id={business_id}" if business_id else "/onboarding"
    }

@app.post("/api/auth/logout")
async def logout(request: Request, response: Response):
    token = request.cookies.get("session")
    if token:
        await delete_session(token)
    response.delete_cookie("session")
    return {"success": True}

@app.get("/api/auth/me")
async def me(request: Request):
    user = await get_current_user(request)
    if not user:
        return {"authenticated": False}

    businesses = await db_query("SELECT * FROM businesses WHERE user_id = $1", user["id"])
    return {
        "authenticated": True,
        "user": {"id": user["id"], "email": user["email"], "name": user["name"]},
        "businesses": [dict(b) for b in businesses]
    }

# =============================================================================
# Business Endpoints
# =============================================================================

@app.get("/api/business/{business_id}")
async def get_business(business_id: str, request: Request):
    user = await require_auth(request)
    business = await db_fetchrow(
        "SELECT * FROM businesses WHERE id = $1 AND user_id = $2",
        business_id, user["id"]
    )
    if not business:
        raise HTTPException(status_code=404, detail="Business not found")
    return {"business": dict(business)}

@app.patch("/api/business/{business_id}")
async def update_business(business_id: str, data: BusinessUpdate, request: Request):
    user = await require_auth(request)
    business = await db_fetchrow(
        "SELECT * FROM businesses WHERE id = $1 AND user_id = $2",
        business_id, user["id"]
    )
    if not business:
        raise HTTPException(status_code=404, detail="Business not found")

    updates = {k: v for k, v in data.dict().items() if v is not None}
    if updates:
        set_clause = ", ".join([f"{k} = ${i+2}" for i, k in enumerate(updates.keys())])
        await db_execute(
            f"UPDATE businesses SET {set_clause} WHERE id = $1",
            business_id, *updates.values()
        )

    return {"success": True}

@app.get("/api/business/{business_id}/stats")
async def get_business_stats(business_id: str, request: Request):
    user = await require_auth(request)
    business = await db_fetchrow(
        "SELECT * FROM businesses WHERE id = $1 AND user_id = $2",
        business_id, user["id"]
    )
    if not business:
        raise HTTPException(status_code=404, detail="Business not found")

    # Get call stats
    total_calls = await db_fetchrow(
        "SELECT COUNT(*) as count FROM calls WHERE business_id = $1",
        business_id
    )
    appointments = await db_fetchrow(
        "SELECT COUNT(*) as count FROM appointments WHERE business_id = $1",
        business_id
    )

    return {
        "stats": {
            "total_calls": total_calls["count"] if total_calls else 0,
            "total_appointments": appointments["count"] if appointments else 0,
            "status": business["status"],
            "tier": business["tier"]
        }
    }

@app.get("/api/business/{business_id}/calls")
async def get_business_calls(business_id: str, request: Request, limit: int = 50):
    user = await require_auth(request)
    business = await db_fetchrow(
        "SELECT * FROM businesses WHERE id = $1 AND user_id = $2",
        business_id, user["id"]
    )
    if not business:
        raise HTTPException(status_code=404, detail="Business not found")

    calls = await db_query(
        "SELECT * FROM calls WHERE business_id = $1 ORDER BY created_at DESC LIMIT $2",
        business_id, limit
    )
    return {"calls": [dict(c) for c in calls]}

# =============================================================================
# Onboarding
# =============================================================================

@app.post("/api/onboarding/{business_id}/step")
async def save_onboarding_step(business_id: str, data: OnboardingStep, request: Request):
    user = await require_auth(request)
    business = await db_fetchrow(
        "SELECT * FROM businesses WHERE id = $1 AND user_id = $2",
        business_id, user["id"]
    )
    if not business:
        raise HTTPException(status_code=404, detail="Business not found")

    step_data = data.data

    if data.step == 1:
        await db_execute(
            "UPDATE businesses SET name = $2, phone = $3, address = $4 WHERE id = $1",
            business_id,
            step_data.get("name", business["name"]),
            step_data.get("phone"),
            step_data.get("address")
        )
    elif data.step == 2:
        await db_execute(
            "UPDATE businesses SET services = $2, business_hours = $3 WHERE id = $1",
            business_id,
            step_data.get("services"),
            step_data.get("business_hours")
        )
    elif data.step == 3:
        await db_execute(
            "UPDATE businesses SET agent_name = $2, agent_voice = $3 WHERE id = $1",
            business_id,
            step_data.get("agent_name", "Alex"),
            step_data.get("agent_voice", "rachel")
        )

    return {"success": True, "step": data.step}

@app.post("/api/onboarding/{business_id}/complete")
async def complete_onboarding(business_id: str, request: Request, background_tasks: BackgroundTasks):
    user = await require_auth(request)
    business = await db_fetchrow(
        "SELECT * FROM businesses WHERE id = $1 AND user_id = $2",
        business_id, user["id"]
    )
    if not business:
        raise HTTPException(status_code=404, detail="Business not found")

    business_dict = dict(business)

    # Create Vapi assistant
    assistant_id = await create_vapi_assistant(business_dict)
    phone_number = None

    if assistant_id:
        phone_number = await create_vapi_phone(assistant_id)
        await db_execute(
            "UPDATE businesses SET vapi_assistant_id = $2, vapi_phone_number = $3, status = $4 WHERE id = $1",
            business_id, assistant_id, phone_number, "active"
        )
    else:
        await db_execute("UPDATE businesses SET status = $2 WHERE id = $1", business_id, "active")

    # Notify user
    if phone_number:
        background_tasks.add_task(
            send_email,
            user["email"],
            "Your AI Receptionist is Live!",
            f"<h1>Congratulations!</h1><p>Your AI receptionist for {business_dict['name']} is now live.</p><p>Phone Number: {phone_number}</p>"
        )

    return {
        "success": True,
        "assistant_id": assistant_id,
        "phone_number": phone_number,
        "redirect": f"/dashboard?business_id={business_id}"
    }

# =============================================================================
# Stripe Endpoints
# =============================================================================

@app.get("/api/stripe/checkout")
async def create_checkout(business_id: str, tier: str = "starter", request: Request = None):
    user = await require_auth(request)
    business = await db_fetchrow(
        "SELECT * FROM businesses WHERE id = $1 AND user_id = $2",
        business_id, user["id"]
    )
    if not business:
        raise HTTPException(status_code=404, detail="Business not found")

    if not STRIPE_SECRET_KEY:
        return RedirectResponse(url=f"/onboarding?business_id={business_id}")

    price_id = PRICE_IDS.get(tier, PRICE_IDS["starter"])

    checkout = stripe.checkout.Session.create(
        customer=business.get("stripe_customer_id"),
        payment_method_types=["card"],
        line_items=[{"price": price_id, "quantity": 1}],
        mode="subscription",
        subscription_data={"trial_period_days": 7},
        success_url=f"{BASE_URL}/api/stripe/success?session_id={{CHECKOUT_SESSION_ID}}&business_id={business_id}",
        cancel_url=f"{BASE_URL}/signup?cancelled=true",
        allow_promotion_codes=True
    )

    return RedirectResponse(url=checkout.url, status_code=303)

@app.get("/api/stripe/success")
async def stripe_success(session_id: str, business_id: str):
    if STRIPE_SECRET_KEY:
        session = stripe.checkout.Session.retrieve(session_id)
        await db_execute(
            "UPDATE businesses SET stripe_subscription_id = $2, subscription_status = $3 WHERE id = $1",
            business_id, session.subscription, "trialing"
        )
    return RedirectResponse(url=f"/onboarding?business_id={business_id}")

@app.get("/api/stripe/portal")
async def customer_portal(request: Request):
    user = await require_auth(request)
    business = await db_fetchrow("SELECT * FROM businesses WHERE user_id = $1 LIMIT 1", user["id"])

    if not business or not business.get("stripe_customer_id"):
        raise HTTPException(status_code=400, detail="No subscription found")

    portal = stripe.billing_portal.Session.create(
        customer=business["stripe_customer_id"],
        return_url=f"{BASE_URL}/dashboard"
    )
    return RedirectResponse(url=portal.url, status_code=303)

# =============================================================================
# Webhooks
# =============================================================================

@app.post("/api/webhooks/vapi")
async def vapi_webhook(request: Request, background_tasks: BackgroundTasks):
    try:
        body = await request.json()
        event_type = body.get("type", body.get("message", {}).get("type"))

        if event_type == "end-of-call-report":
            call_data = body.get("call", body.get("message", {}).get("call", {}))
            assistant_id = call_data.get("assistantId")

            business = await db_fetchrow(
                "SELECT * FROM businesses WHERE vapi_assistant_id = $1",
                assistant_id
            )

            if business:
                call_id = f"call_{secrets.token_hex(8)}"
                await db_execute(
                    "INSERT INTO calls (id, business_id, vapi_call_id, caller_phone, duration, summary, created_at) VALUES ($1, $2, $3, $4, $5, $6, $7)",
                    call_id,
                    business["id"],
                    call_data.get("id"),
                    call_data.get("customer", {}).get("number"),
                    call_data.get("duration", 0),
                    body.get("summary", ""),
                    datetime.utcnow()
                )

        elif event_type == "function-call":
            func = body.get("functionCall", {})
            if func.get("name") == "bookAppointment":
                params = func.get("parameters", {})
                call_data = body.get("call", {})
                assistant_id = call_data.get("assistantId")

                business = await db_fetchrow(
                    "SELECT * FROM businesses WHERE vapi_assistant_id = $1",
                    assistant_id
                )

                if business:
                    appt_id = f"appt_{secrets.token_hex(8)}"
                    await db_execute(
                        "INSERT INTO appointments (id, business_id, customer_name, customer_phone, service_type, preferred_date, status, created_at) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)",
                        appt_id,
                        business["id"],
                        params.get("customer_name"),
                        params.get("phone_number"),
                        params.get("service_type"),
                        params.get("preferred_date"),
                        "pending",
                        datetime.utcnow()
                    )
                    return {"result": f"Appointment booked! Reference: {appt_id[:12]}"}

        return {"status": "ok"}
    except Exception as e:
        print(f"Webhook error: {e}")
        return {"status": "error"}

@app.post("/api/webhooks/stripe")
async def stripe_webhook(request: Request):
    if not STRIPE_WEBHOOK_SECRET:
        return {"status": "not configured"}

    payload = await request.body()
    sig = request.headers.get("stripe-signature")

    try:
        event = stripe.Webhook.construct_event(payload, sig, STRIPE_WEBHOOK_SECRET)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

    if event["type"] == "customer.subscription.updated":
        sub = event["data"]["object"]
        customer_id = sub.get("customer")
        status = sub.get("status")

        await db_execute(
            "UPDATE businesses SET subscription_status = $2 WHERE stripe_customer_id = $1",
            customer_id, status
        )

    elif event["type"] == "customer.subscription.deleted":
        sub = event["data"]["object"]
        customer_id = sub.get("customer")

        await db_execute(
            "UPDATE businesses SET subscription_status = $2, status = $3 WHERE stripe_customer_id = $1",
            customer_id, "canceled", "suspended"
        )

    return {"status": "ok"}

# =============================================================================
# Pricing Page Data
# =============================================================================

@app.get("/api/pricing")
async def get_pricing():
    return {
        "tiers": [
            {
                "name": "Starter",
                "price": 297,
                "features": [
                    "1 AI Phone Agent",
                    "500 minutes/month",
                    "Basic call handling",
                    "Appointment booking",
                    "Email notifications",
                    "Business hours support"
                ]
            },
            {
                "name": "Professional",
                "price": 497,
                "popular": True,
                "features": [
                    "3 AI Phone Agents",
                    "2,000 minutes/month",
                    "Advanced call routing",
                    "SMS notifications",
                    "CRM integrations",
                    "Custom voice & script",
                    "Priority support"
                ]
            },
            {
                "name": "Enterprise",
                "price": 997,
                "features": [
                    "Unlimited AI Agents",
                    "10,000 minutes/month",
                    "Multi-location support",
                    "API access",
                    "White-label option",
                    "Dedicated account manager",
                    "24/7 phone support",
                    "Custom integrations"
                ]
            }
        ]
    }

# =============================================================================
# Run
# =============================================================================

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=PORT)
