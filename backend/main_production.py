"""
CallBotAI - Production-Ready Backend
Full SaaS platform for AI phone receptionists
"""

import os
import csv
import io
import asyncio
from datetime import datetime, timedelta
from typing import Dict, Any, Optional, List
from contextlib import asynccontextmanager

from fastapi import FastAPI, HTTPException, Request, BackgroundTasks, Response, Depends, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import HTMLResponse, JSONResponse, RedirectResponse, StreamingResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel, EmailStr, validator
import stripe

# Local imports
from database_postgres import (
    init_db, close_pool,
    create_user, get_user, get_user_by_email, update_user,
    create_business, update_business, get_business, get_user_businesses,
    get_business_by_stripe_customer, get_business_by_vapi_assistant,
    create_call, get_business_calls, get_call, get_business_stats,
    create_appointment, get_business_appointments, update_appointment,
    create_onboarding_session, update_onboarding_session, get_onboarding_session,
    create_password_reset_token, verify_password_reset_token,
    log_audit
)
from sessions import (
    create_session, get_session, delete_session, delete_all_user_sessions,
    check_rate_limit, close_redis, redis_health_check
)
from security import (
    create_password_hash, check_password_hash,
    validate_email, validate_password_strength, sanitize_input,
    SecurityHeadersMiddleware, RateLimitMiddleware, RequestLoggingMiddleware,
    get_cookie_settings
)
from email_service import (
    send_welcome_email, send_agent_live_email, send_new_call_email,
    send_password_reset_email, send_trial_ending_email,
    send_payment_failed_email, send_subscription_cancelled_email
)
from calendar_service import (
    generate_appointment_ics, generate_google_calendar_link,
    generate_available_slots
)
from vapi_service import create_assistant, update_assistant, create_phone_number, make_test_call
from logging_service import (
    logger, request_logger, audit_logger, call_logger,
    webhook_logger, payment_logger
)

# Import extended API routes
from api_extended import router as extended_router

# =============================================================================
# Configuration
# =============================================================================

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ENVIRONMENT = os.getenv("ENVIRONMENT", "development")
IS_PRODUCTION = ENVIRONMENT == "production"

# API Keys
VAPI_API_KEY = os.getenv("VAPI_API_KEY", "")
STRIPE_SECRET_KEY = os.getenv("STRIPE_SECRET_KEY", "")
STRIPE_WEBHOOK_SECRET = os.getenv("STRIPE_WEBHOOK_SECRET", "")
STRIPE_PRICE_ID = os.getenv("STRIPE_PRICE_ID", "")

# URLs
BASE_URL = os.getenv("BASE_URL", "http://localhost:8000")
WEBHOOK_URL = os.getenv("WEBHOOK_URL", f"{BASE_URL}/api/webhooks/vapi")

# Initialize Stripe
if STRIPE_SECRET_KEY:
    stripe.api_key = STRIPE_SECRET_KEY


# =============================================================================
# App Lifecycle
# =============================================================================

_db_initialized = False

async def init_database_background():
    """Initialize database in background with retries"""
    global _db_initialized
    max_retries = 5
    for attempt in range(max_retries):
        try:
            await init_db()
            _db_initialized = True
            logger.info("Database initialized successfully")
            return
        except Exception as e:
            logger.warning(f"Database init attempt {attempt + 1}/{max_retries} failed: {e}")
            if attempt < max_retries - 1:
                await asyncio.sleep(3)
    logger.error("Database initialization failed after all retries")


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifecycle management"""
    logger.info("Starting CallBotAI server", environment=ENVIRONMENT)

    # Start database init in background (don't block startup)
    asyncio.create_task(init_database_background())

    yield

    # Cleanup
    logger.info("Shutting down CallBotAI server")
    try:
        await close_pool()
    except Exception:
        pass
    try:
        await close_redis()
    except Exception:
        pass


# =============================================================================
# App Setup
# =============================================================================

app = FastAPI(
    title="CallBotAI",
    version="3.0.0",
    description="AI Phone Receptionist SaaS Platform",
    lifespan=lifespan
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"] if not IS_PRODUCTION else [BASE_URL],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Security middleware
app.add_middleware(SecurityHeadersMiddleware)
app.add_middleware(RequestLoggingMiddleware)
if IS_PRODUCTION:
    app.add_middleware(RateLimitMiddleware)

# Include extended API routes (SMS, Campaigns, Agency, Integrations, etc.)
app.include_router(extended_router)


# =============================================================================
# Request Models
# =============================================================================

class SignupRequest(BaseModel):
    email: EmailStr
    password: str
    business_name: str
    industry: Optional[str] = None

    @validator('password')
    def validate_password(cls, v):
        is_valid, message = validate_password_strength(v)
        if not is_valid:
            raise ValueError(message)
        return v

    @validator('business_name')
    def validate_business_name(cls, v):
        v = sanitize_input(v, 255)
        if len(v) < 2:
            raise ValueError("Business name must be at least 2 characters")
        return v


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class PasswordResetRequest(BaseModel):
    email: EmailStr


class PasswordResetConfirm(BaseModel):
    token: str
    password: str

    @validator('password')
    def validate_password(cls, v):
        is_valid, message = validate_password_strength(v)
        if not is_valid:
            raise ValueError(message)
        return v


class OnboardingData(BaseModel):
    step: int
    data: Dict[str, Any]


class BusinessUpdate(BaseModel):
    name: Optional[str] = None
    services: Optional[str] = None
    business_hours: Optional[str] = None
    address: Optional[str] = None
    website: Optional[str] = None
    faq: Optional[str] = None
    custom_instructions: Optional[str] = None
    agent_name: Optional[str] = None
    agent_voice: Optional[str] = None
    notification_email: Optional[str] = None
    notification_phone: Optional[str] = None


class TestCallRequest(BaseModel):
    phone_number: str


class AppointmentUpdate(BaseModel):
    status: Optional[str] = None
    notes: Optional[str] = None


# =============================================================================
# Auth Helpers
# =============================================================================

def get_client_ip(request: Request) -> str:
    """Get client IP from request"""
    forwarded = request.headers.get("X-Forwarded-For")
    if forwarded:
        return forwarded.split(",")[0].strip()
    return request.client.host if request.client else "unknown"


async def get_current_user(request: Request) -> Optional[Dict]:
    """Get current user from session"""
    token = request.cookies.get("session") or request.headers.get("Authorization", "").replace("Bearer ", "")
    if not token:
        return None

    session = await get_session(token)
    if not session:
        return None

    user = await get_user(session.user_id)
    return user


async def require_auth(request: Request) -> Dict:
    """Require authentication"""
    user = await get_current_user(request)
    if not user:
        raise HTTPException(status_code=401, detail="Not authenticated")
    return user


async def require_business_access(request: Request, business_id: str) -> tuple[Dict, Dict]:
    """Require user has access to business"""
    user = await require_auth(request)
    business = await get_business(business_id)

    if not business or business['user_id'] != user['id']:
        audit_logger.log_access(
            resource=f"business:{business_id}",
            action="read",
            user_id=user['id'],
            allowed=False
        )
        raise HTTPException(status_code=404, detail="Business not found")

    return user, business


# =============================================================================
# Public Pages
# =============================================================================

@app.get("/", response_class=HTMLResponse)
async def landing_page():
    """Serve landing page"""
    try:
        with open(os.path.join(BASE_DIR, "website", "index.html")) as f:
            return HTMLResponse(content=f.read())
    except FileNotFoundError:
        return HTMLResponse(content="<h1>CallBotAI</h1><p>Coming soon</p>")


@app.get("/signup", response_class=HTMLResponse)
async def signup_page(request: Request):
    """Serve signup page"""
    # Redirect if already logged in
    user = await get_current_user(request)
    if user:
        return RedirectResponse(url="/dashboard")

    try:
        with open(os.path.join(BASE_DIR, "website", "signup.html")) as f:
            return HTMLResponse(content=f.read())
    except FileNotFoundError:
        return RedirectResponse(url="/")


@app.get("/login", response_class=HTMLResponse)
async def login_page(request: Request):
    """Serve login page"""
    user = await get_current_user(request)
    if user:
        return RedirectResponse(url="/dashboard")

    try:
        with open(os.path.join(BASE_DIR, "website", "login.html")) as f:
            return HTMLResponse(content=f.read())
    except FileNotFoundError:
        return RedirectResponse(url="/signup")


@app.get("/onboarding", response_class=HTMLResponse)
async def onboarding_page(request: Request):
    """Serve onboarding wizard"""
    try:
        with open(os.path.join(BASE_DIR, "website", "onboarding.html")) as f:
            return HTMLResponse(content=f.read())
    except FileNotFoundError:
        return HTMLResponse(content="<h1>Onboarding</h1>")


@app.get("/dashboard", response_class=HTMLResponse)
async def dashboard_page(request: Request):
    """Serve dashboard"""
    user = await get_current_user(request)
    if not user:
        return RedirectResponse(url="/signup")

    try:
        with open(os.path.join(BASE_DIR, "website", "dashboard.html")) as f:
            return HTMLResponse(content=f.read())
    except FileNotFoundError:
        return HTMLResponse(content="<h1>Dashboard</h1>")


@app.get("/reset-password", response_class=HTMLResponse)
async def reset_password_page():
    """Serve password reset page"""
    try:
        with open(os.path.join(BASE_DIR, "website", "reset-password.html")) as f:
            return HTMLResponse(content=f.read())
    except FileNotFoundError:
        return HTMLResponse(content="<h1>Reset Password</h1>")


# =============================================================================
# Auth API
# =============================================================================

@app.post("/api/auth/signup")
async def api_signup(data: SignupRequest, request: Request, response: Response, background_tasks: BackgroundTasks):
    """Sign up a new user"""
    client_ip = get_client_ip(request)

    # Check rate limit
    allowed, remaining = await check_rate_limit(client_ip, 3, 3600, "signup")
    if not allowed:
        audit_logger.log_auth("signup", email=data.email, success=False, reason="rate_limited", client_ip=client_ip)
        raise HTTPException(status_code=429, detail="Too many signup attempts")

    # Check if user exists
    existing = await get_user_by_email(data.email)
    if existing:
        audit_logger.log_auth("signup", email=data.email, success=False, reason="email_exists", client_ip=client_ip)
        raise HTTPException(status_code=400, detail="Email already registered")

    # Create user with secure password hash
    password_hash = create_password_hash(data.password)
    user_id = await create_user(email=data.email, name=data.business_name, password_hash=password_hash)

    # Create business
    business_id = await create_business(user_id=user_id, name=data.business_name, industry=data.industry)
    await update_business(business_id, notification_email=data.email)

    # Create session
    token = await create_session(
        user_id=user_id,
        email=data.email,
        ip_address=client_ip,
        user_agent=request.headers.get("User-Agent"),
        business_id=business_id
    )
    response.set_cookie("session", token, **get_cookie_settings(IS_PRODUCTION))

    # Create Stripe customer
    if STRIPE_SECRET_KEY:
        try:
            customer = stripe.Customer.create(
                email=data.email,
                name=data.business_name,
                metadata={"user_id": user_id, "business_id": business_id}
            )
            await update_business(business_id, stripe_customer_id=customer.id)
            payment_logger.log_payment("customer_created", business_id=business_id)
        except Exception as e:
            logger.error(f"Stripe customer creation error: {e}")

    # Log and notify
    audit_logger.log_auth("signup", email=data.email, user_id=user_id, success=True, client_ip=client_ip)
    background_tasks.add_task(send_welcome_email, data.email, data.business_name)

    # Determine redirect
    redirect_url = f"/api/stripe/checkout?business_id={business_id}" if STRIPE_SECRET_KEY and STRIPE_PRICE_ID else f"/onboarding?business_id={business_id}"

    return {
        "success": True,
        "user_id": user_id,
        "business_id": business_id,
        "redirect": redirect_url
    }


@app.post("/api/auth/login")
async def api_login(data: LoginRequest, request: Request, response: Response):
    """Log in an existing user"""
    client_ip = get_client_ip(request)

    # Check rate limit
    allowed, remaining = await check_rate_limit(f"{client_ip}:{data.email}", 5, 300, "login")
    if not allowed:
        audit_logger.log_auth("login", email=data.email, success=False, reason="rate_limited", client_ip=client_ip)
        raise HTTPException(status_code=429, detail="Too many login attempts. Please try again later.")

    user = await get_user_by_email(data.email)
    if not user:
        audit_logger.log_auth("login", email=data.email, success=False, reason="user_not_found", client_ip=client_ip)
        raise HTTPException(status_code=401, detail="Invalid email or password")

    # Check password
    if not user.get('password_hash') or not check_password_hash(data.password, user['password_hash']):
        audit_logger.log_auth("login", email=data.email, success=False, reason="invalid_password", client_ip=client_ip)
        raise HTTPException(status_code=401, detail="Invalid email or password")

    # Get business
    businesses = await get_user_businesses(user['id'])
    business_id = businesses[0]['id'] if businesses else None

    # Create session
    token = await create_session(
        user_id=user['id'],
        email=data.email,
        ip_address=client_ip,
        user_agent=request.headers.get("User-Agent"),
        business_id=business_id
    )
    response.set_cookie("session", token, **get_cookie_settings(IS_PRODUCTION))

    # Update last login
    await update_user(user['id'], last_login_at=datetime.utcnow())

    audit_logger.log_auth("login", email=data.email, user_id=user['id'], success=True, client_ip=client_ip)

    return {
        "success": True,
        "user_id": user['id'],
        "business_id": business_id,
        "redirect": f"/dashboard?business_id={business_id}" if business_id else "/onboarding"
    }


@app.post("/api/auth/logout")
async def api_logout(request: Request, response: Response):
    """Log out"""
    token = request.cookies.get("session")
    if token:
        await delete_session(token)
    response.delete_cookie("session")
    return {"success": True}


@app.get("/api/auth/me")
async def api_me(request: Request):
    """Get current user"""
    user = await get_current_user(request)
    if not user:
        return {"authenticated": False}

    businesses = await get_user_businesses(user['id'])
    return {
        "authenticated": True,
        "user": {
            "id": user['id'],
            "email": user['email'],
            "name": user['name']
        },
        "businesses": businesses
    }


@app.post("/api/auth/password-reset")
async def request_password_reset(data: PasswordResetRequest, request: Request, background_tasks: BackgroundTasks):
    """Request password reset"""
    client_ip = get_client_ip(request)

    # Rate limit
    allowed, _ = await check_rate_limit(client_ip, 3, 3600, "password_reset")
    if not allowed:
        raise HTTPException(status_code=429, detail="Too many reset attempts")

    user = await get_user_by_email(data.email)
    if user:
        token = await create_password_reset_token(user['id'])
        background_tasks.add_task(send_password_reset_email, data.email, token)
        audit_logger.log_auth("password_reset_requested", email=data.email, user_id=user['id'], success=True, client_ip=client_ip)

    # Always return success to prevent email enumeration
    return {"success": True, "message": "If an account exists, a reset link has been sent"}


@app.post("/api/auth/password-reset/confirm")
async def confirm_password_reset(data: PasswordResetConfirm, request: Request):
    """Confirm password reset"""
    user_id = await verify_password_reset_token(data.token)
    if not user_id:
        raise HTTPException(status_code=400, detail="Invalid or expired reset token")

    password_hash = create_password_hash(data.password)
    await update_user(user_id, password_hash=password_hash)

    # Invalidate all sessions
    await delete_all_user_sessions(user_id)

    audit_logger.log_auth("password_reset_completed", user_id=user_id, success=True, client_ip=get_client_ip(request))

    return {"success": True, "message": "Password reset successfully"}


# =============================================================================
# Stripe API
# =============================================================================

@app.get("/api/stripe/checkout")
async def create_stripe_checkout(business_id: str, request: Request):
    """Create Stripe checkout session with 7-day trial"""
    user, business = await require_business_access(request, business_id)

    if not STRIPE_SECRET_KEY or not STRIPE_PRICE_ID:
        return RedirectResponse(url=f"/onboarding?business_id={business_id}")

    # Get or create Stripe customer
    stripe_customer_id = business.get('stripe_customer_id')
    if not stripe_customer_id:
        customer = stripe.Customer.create(
            email=user['email'],
            name=business['name'],
            metadata={"user_id": user['id'], "business_id": business_id}
        )
        stripe_customer_id = customer.id
        await update_business(business_id, stripe_customer_id=stripe_customer_id)

    # Create checkout session
    checkout_session = stripe.checkout.Session.create(
        customer=stripe_customer_id,
        payment_method_types=['card'],
        line_items=[{'price': STRIPE_PRICE_ID, 'quantity': 1}],
        mode='subscription',
        subscription_data={
            'trial_period_days': 7,
            'metadata': {'business_id': business_id}
        },
        success_url=f"{BASE_URL}/api/stripe/success?session_id={{CHECKOUT_SESSION_ID}}&business_id={business_id}",
        cancel_url=f"{BASE_URL}/api/stripe/cancel?business_id={business_id}",
        metadata={'business_id': business_id, 'user_id': user['id']},
        allow_promotion_codes=True,
    )

    payment_logger.log_payment("checkout_created", business_id=business_id)
    return RedirectResponse(url=checkout_session.url, status_code=303)


@app.get("/api/stripe/success")
async def stripe_success(session_id: str, business_id: str, request: Request):
    """Handle successful Stripe checkout"""
    if STRIPE_SECRET_KEY:
        try:
            session = stripe.checkout.Session.retrieve(session_id)
            await update_business(
                business_id,
                stripe_subscription_id=session.subscription,
                subscription_status='trialing'
            )
            payment_logger.log_payment("checkout_completed", business_id=business_id)
        except Exception as e:
            logger.error(f"Stripe session retrieval error: {e}")

    return RedirectResponse(url=f"/onboarding?business_id={business_id}")


@app.get("/api/stripe/cancel")
async def stripe_cancel(business_id: str):
    """Handle cancelled Stripe checkout"""
    return RedirectResponse(url="/signup?cancelled=true")


@app.get("/api/stripe/portal")
async def stripe_customer_portal(request: Request):
    """Create Stripe customer portal session"""
    user = await require_auth(request)
    businesses = await get_user_businesses(user['id'])

    if not businesses or not businesses[0].get('stripe_customer_id'):
        raise HTTPException(status_code=400, detail="No subscription found")

    portal_session = stripe.billing_portal.Session.create(
        customer=businesses[0]['stripe_customer_id'],
        return_url=f"{BASE_URL}/dashboard"
    )

    return RedirectResponse(url=portal_session.url, status_code=303)


# =============================================================================
# Business API
# =============================================================================

@app.get("/api/business/{business_id}")
async def get_business_details(business_id: str, request: Request):
    """Get business details"""
    user, business = await require_business_access(request, business_id)
    return {"business": business}


@app.patch("/api/business/{business_id}")
async def update_business_details(business_id: str, data: BusinessUpdate, request: Request):
    """Update business details"""
    user, business = await require_business_access(request, business_id)

    updates = {k: v for k, v in data.dict().items() if v is not None}
    if updates:
        await update_business(business_id, **updates)

        audit_logger.log_data_change(
            entity="business",
            entity_id=business_id,
            action="update",
            user_id=user['id'],
            changes=updates
        )

        # Update Vapi assistant if needed
        if business.get('vapi_assistant_id') and any(k in updates for k in ['services', 'faq', 'custom_instructions', 'agent_name', 'business_hours']):
            updated_business = await get_business(business_id)
            await update_assistant(business['vapi_assistant_id'], updated_business)

    return {"success": True}


@app.get("/api/business/{business_id}/stats")
async def get_stats(business_id: str, request: Request):
    """Get business stats"""
    user, business = await require_business_access(request, business_id)
    stats = await get_business_stats(business_id)
    return {"stats": stats}


@app.get("/api/business/{business_id}/calls")
async def get_calls(business_id: str, request: Request, limit: int = 50, offset: int = 0):
    """Get business calls with pagination"""
    user, business = await require_business_access(request, business_id)
    calls = await get_business_calls(business_id, limit, offset)
    return {"calls": calls}


@app.get("/api/business/{business_id}/calls/export")
async def export_calls(business_id: str, request: Request, format: str = "csv"):
    """Export calls as CSV"""
    user, business = await require_business_access(request, business_id)
    calls = await get_business_calls(business_id, limit=10000)

    if format == "csv":
        output = io.StringIO()
        writer = csv.DictWriter(output, fieldnames=[
            'id', 'created_at', 'caller_phone', 'duration', 'appointment_booked', 'summary'
        ])
        writer.writeheader()
        for call in calls:
            writer.writerow({
                'id': call['id'],
                'created_at': call['created_at'],
                'caller_phone': call.get('caller_phone', ''),
                'duration': call.get('duration', 0),
                'appointment_booked': call.get('appointment_booked', False),
                'summary': call.get('summary', '')[:200]
            })

        output.seek(0)
        return StreamingResponse(
            io.BytesIO(output.getvalue().encode()),
            media_type="text/csv",
            headers={"Content-Disposition": f"attachment; filename=calls-{business_id}.csv"}
        )

    return {"calls": calls}


@app.post("/api/business/{business_id}/test-call")
async def trigger_test_call(business_id: str, data: TestCallRequest, request: Request):
    """Trigger a test call"""
    user, business = await require_business_access(request, business_id)

    if not business.get('vapi_assistant_id'):
        raise HTTPException(status_code=400, detail="No AI agent configured")

    result = await make_test_call(business['vapi_assistant_id'], data.phone_number)

    call_logger.log_call_start(
        call_id=result.get('call', {}).get('id', 'unknown'),
        business_id=business_id,
        caller_phone=data.phone_number
    )

    if result['success']:
        return {"success": True, "call_id": result['call'].get('id')}
    else:
        return {"success": False, "error": result.get('error')}


# =============================================================================
# Appointments API
# =============================================================================

@app.get("/api/business/{business_id}/appointments")
async def get_appointments(
    business_id: str,
    request: Request,
    status: Optional[str] = None,
    start_date: Optional[str] = None,
    end_date: Optional[str] = None
):
    """Get appointments"""
    user, business = await require_business_access(request, business_id)
    appointments = await get_business_appointments(business_id, status, start_date, end_date)
    return {"appointments": appointments}


@app.patch("/api/business/{business_id}/appointments/{appointment_id}")
async def update_appointment_status(
    business_id: str,
    appointment_id: str,
    data: AppointmentUpdate,
    request: Request
):
    """Update appointment"""
    user, business = await require_business_access(request, business_id)

    updates = {k: v for k, v in data.dict().items() if v is not None}
    if updates:
        await update_appointment(appointment_id, **updates)

    return {"success": True}


@app.get("/api/business/{business_id}/appointments/{appointment_id}/ics")
async def download_appointment_ics(business_id: str, appointment_id: str, request: Request):
    """Download ICS file for appointment"""
    user, business = await require_business_access(request, business_id)
    appointments = await get_business_appointments(business_id)

    appointment = next((a for a in appointments if a['id'] == appointment_id), None)
    if not appointment:
        raise HTTPException(status_code=404, detail="Appointment not found")

    ics_content = generate_appointment_ics(
        business_name=business['name'],
        customer_name=appointment['customer_name'],
        customer_phone=appointment.get('customer_phone', ''),
        customer_email=appointment.get('customer_email', ''),
        service_type=appointment.get('service_type', 'Appointment'),
        appointment_date=str(appointment.get('preferred_date', '')),
        appointment_time=appointment.get('preferred_time', ''),
        notes=appointment.get('notes', ''),
        business_email=business.get('notification_email', ''),
        business_address=business.get('address', '')
    )

    return Response(
        content=ics_content,
        media_type="text/calendar",
        headers={"Content-Disposition": f"attachment; filename=appointment-{appointment_id}.ics"}
    )


@app.get("/api/business/{business_id}/availability")
async def get_availability(business_id: str, request: Request, days: int = 14):
    """Get available appointment slots"""
    user, business = await require_business_access(request, business_id)

    # Get existing appointments
    appointments = await get_business_appointments(business_id, status="pending")
    booked_slots = [
        {"start": a.get('preferred_date'), "end": a.get('preferred_date')}
        for a in appointments
    ]

    # Generate available slots
    slots = generate_available_slots(
        business_hours=business.get('business_hours', 'Monday-Friday: 9am-5pm'),
        booked_slots=booked_slots,
        days_ahead=days
    )

    return {"slots": slots}


# =============================================================================
# Onboarding API
# =============================================================================

@app.post("/api/onboarding/{business_id}/step")
async def save_onboarding_step(business_id: str, data: OnboardingData, request: Request):
    """Save onboarding step data"""
    user, business = await require_business_access(request, business_id)

    step = data.step
    step_data = data.data

    # Map step data to business fields
    if step == 1:
        await update_business(
            business_id,
            name=step_data.get('name', business['name']),
            industry=step_data.get('industry'),
            phone=step_data.get('phone'),
            address=step_data.get('address'),
            service_area=step_data.get('service_area'),
            website=step_data.get('website')
        )
    elif step == 2:
        await update_business(
            business_id,
            services=step_data.get('services'),
            business_hours=step_data.get('business_hours')
        )
    elif step == 3:
        await update_business(
            business_id,
            pricing=step_data.get('pricing'),
            offers_financing=step_data.get('offers_financing', False),
            offers_emergency=step_data.get('offers_emergency', False),
            response_time=step_data.get('response_time')
        )
    elif step == 4:
        await update_business(
            business_id,
            agent_name=step_data.get('agent_name', 'Alex'),
            agent_voice=step_data.get('agent_voice', 'rachel'),
            appointment_types=step_data.get('appointment_types', [])
        )
    elif step == 5:
        await update_business(
            business_id,
            notification_email=step_data.get('notification_email'),
            notification_phone=step_data.get('notification_phone'),
            notification_sms_enabled=step_data.get('sms_enabled', True),
            notification_email_enabled=step_data.get('email_enabled', True)
        )

    return {"success": True, "step": step}


@app.post("/api/onboarding/{business_id}/complete")
async def complete_onboarding(business_id: str, request: Request, background_tasks: BackgroundTasks):
    """Complete onboarding and create AI agent"""
    user, business = await require_business_access(request, business_id)

    assistant_id = None
    phone_number = None

    if VAPI_API_KEY:
        try:
            result = await create_assistant(business, WEBHOOK_URL)
            if result['success']:
                assistant = result['assistant']
                assistant_id = assistant['id']

                phone_result = await create_phone_number(assistant_id)
                if phone_result['success']:
                    phone_number = phone_result['phone'].get('number')

                logger.info(f"Created Vapi assistant for business {business_id}", assistant_id=assistant_id)
            else:
                logger.error(f"Vapi assistant creation failed: {result.get('error')}")
        except Exception as e:
            logger.exception(f"Vapi error: {e}")

    await update_business(
        business_id,
        vapi_assistant_id=assistant_id,
        vapi_phone_number=phone_number,
        status='active'
    )

    # Send notification
    if phone_number:
        background_tasks.add_task(
            send_agent_live_email,
            business.get('notification_email') or user['email'],
            business['name'],
            phone_number
        )

    return {
        "success": True,
        "assistant_id": assistant_id,
        "phone_number": phone_number,
        "business_id": business_id,
        "redirect": f"/dashboard?business_id={business_id}"
    }


# =============================================================================
# Webhooks
# =============================================================================

@app.post("/api/webhooks/vapi")
async def vapi_webhook(request: Request, background_tasks: BackgroundTasks):
    """Handle Vapi webhooks"""
    try:
        body = await request.json()
        event_type = body.get("type", body.get("message", {}).get("type"))

        webhook_logger.log_webhook("vapi", event_type)

        if event_type == "function-call":
            # Handle function calls from AI agent
            function_call = body.get("functionCall", {})
            function_name = function_call.get("name")

            if function_name == "bookAppointment":
                params = function_call.get("parameters", {})
                call_data = body.get("call", {})
                assistant_id = call_data.get("assistantId")

                business = await get_business_by_vapi_assistant(assistant_id)
                if business:
                    appointment_id = await create_appointment(
                        business_id=business['id'],
                        customer_name=params.get("customer_name"),
                        customer_phone=params.get("phone_number"),
                        customer_email=params.get("email"),
                        service_type=params.get("service_type"),
                        preferred_date=params.get("preferred_date"),
                        preferred_time=params.get("preferred_time"),
                        notes=params.get("notes"),
                        is_emergency=params.get("is_emergency", False)
                    )
                    logger.info(f"Appointment booked: {appointment_id}")
                    return {"result": f"Appointment booked successfully. Reference: {appointment_id[:8]}"}

        elif event_type == "end-of-call-report":
            call_data = body.get("call", body.get("message", {}).get("call", {}))
            assistant_id = call_data.get("assistantId")

            business = await get_business_by_vapi_assistant(assistant_id)
            if business:
                transcript = body.get("transcript", "")
                summary = body.get("summary", "")
                recording_url = body.get("recordingUrl", "")

                call_id = await create_call(
                    business_id=business['id'],
                    vapi_call_id=call_data.get("id"),
                    caller_phone=call_data.get("customer", {}).get("number"),
                    duration=call_data.get("duration", 0),
                    transcript=transcript,
                    summary=summary,
                    recording_url=recording_url
                )

                call_logger.log_call_end(
                    call_id=call_id,
                    business_id=business['id'],
                    duration=call_data.get("duration", 0)
                )

                # Send notification
                if business.get('notification_email'):
                    background_tasks.add_task(
                        send_new_call_email,
                        business['notification_email'],
                        business['name'],
                        call_data.get("customer", {}).get("number", "Unknown"),
                        call_data.get("duration", 0),
                        summary,
                        False
                    )

        return {"status": "ok"}

    except Exception as e:
        webhook_logger.log_webhook("vapi", "unknown", success=False, error=str(e))
        logger.exception(f"Vapi webhook error: {e}")
        return {"status": "error"}


@app.post("/api/webhooks/stripe")
async def stripe_webhook(request: Request, background_tasks: BackgroundTasks):
    """Handle Stripe webhooks"""
    if not STRIPE_WEBHOOK_SECRET:
        return {"status": "not configured"}

    payload = await request.body()
    sig = request.headers.get("stripe-signature")

    try:
        event = stripe.Webhook.construct_event(payload, sig, STRIPE_WEBHOOK_SECRET)
    except Exception as e:
        webhook_logger.log_webhook("stripe", "unknown", success=False, error=str(e))
        raise HTTPException(status_code=400, detail=str(e))

    event_type = event["type"]
    data = event["data"]["object"]

    webhook_logger.log_webhook("stripe", event_type)

    if event_type == "customer.subscription.updated":
        subscription = data
        customer_id = subscription.get("customer")
        status = subscription.get("status")

        business = await get_business_by_stripe_customer(customer_id)
        if business:
            await update_business(business['id'], subscription_status=status)
            payment_logger.log_payment("subscription_updated", business_id=business['id'])

    elif event_type == "customer.subscription.deleted":
        subscription = data
        customer_id = subscription.get("customer")

        business = await get_business_by_stripe_customer(customer_id)
        if business:
            await update_business(business['id'], subscription_status="canceled", status="suspended")
            payment_logger.log_payment("subscription_cancelled", business_id=business['id'])

            if business.get('notification_email'):
                background_tasks.add_task(
                    send_subscription_cancelled_email,
                    business['notification_email'],
                    business['name']
                )

    elif event_type == "invoice.payment_failed":
        invoice = data
        customer_id = invoice.get("customer")

        business = await get_business_by_stripe_customer(customer_id)
        if business:
            await update_business(business['id'], subscription_status="past_due")
            payment_logger.log_payment("payment_failed", business_id=business['id'], success=False)

            if business.get('notification_email'):
                background_tasks.add_task(
                    send_payment_failed_email,
                    business['notification_email'],
                    business['name']
                )

    elif event_type == "customer.subscription.trial_will_end":
        subscription = data
        customer_id = subscription.get("customer")

        business = await get_business_by_stripe_customer(customer_id)
        if business and business.get('notification_email'):
            background_tasks.add_task(
                send_trial_ending_email,
                business['notification_email'],
                business['name'],
                3
            )

    return {"status": "ok"}


# =============================================================================
# Health & Monitoring
# =============================================================================

@app.get("/health")
async def health():
    """Health check endpoint"""
    redis_status = await redis_health_check()

    return {
        "status": "healthy",
        "timestamp": datetime.utcnow().isoformat(),
        "version": "3.0.0",
        "environment": ENVIRONMENT,
        "redis": redis_status
    }


@app.get("/api/health/detailed")
async def detailed_health(request: Request):
    """Detailed health check (requires auth)"""
    await require_auth(request)

    redis_status = await redis_health_check()

    return {
        "status": "healthy",
        "timestamp": datetime.utcnow().isoformat(),
        "version": "3.0.0",
        "environment": ENVIRONMENT,
        "components": {
            "redis": redis_status,
            "stripe": "configured" if STRIPE_SECRET_KEY else "not_configured",
            "vapi": "configured" if VAPI_API_KEY else "not_configured"
        }
    }


# =============================================================================
# Run
# =============================================================================

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main_production:app",
        host="0.0.0.0",
        port=int(os.getenv("PORT", 8000)),
        reload=not IS_PRODUCTION,
        workers=4 if IS_PRODUCTION else 1
    )
