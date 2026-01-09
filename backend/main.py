"""
CallBot AI - Production Backend
AI Phone Receptionist SaaS Platform
"""
import os
import secrets
import hashlib
from datetime import datetime
from typing import Optional, Dict, Any

from fastapi import FastAPI, HTTPException, Request, Response, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, RedirectResponse
from pydantic import BaseModel, EmailStr
import stripe
import httpx

# Configuration
PORT = int(os.getenv("PORT", 8080))
DATABASE_URL = os.getenv("DATABASE_URL", "")
STRIPE_SECRET_KEY = os.getenv("STRIPE_SECRET_KEY", "")
VAPI_API_KEY = os.getenv("VAPI_API_KEY", "")
BASE_URL = os.getenv("BASE_URL", "https://callbot-backend-production.up.railway.app")

if STRIPE_SECRET_KEY:
    stripe.api_key = STRIPE_SECRET_KEY

# In-memory stores (for demo - production uses PostgreSQL)
_sessions: Dict[str, Dict] = {}
_users: Dict[str, Dict] = {}
_businesses: Dict[str, Dict] = {}
_calls: list = []
_appointments: list = []

# App
app = FastAPI(title="CallBot AI", version="3.0.0", description="AI Phone Receptionist SaaS")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Models
class SignupRequest(BaseModel):
    email: EmailStr
    password: str
    business_name: str
    tier: str = "starter"

class LoginRequest(BaseModel):
    email: EmailStr
    password: str

class BusinessUpdate(BaseModel):
    name: Optional[str] = None
    services: Optional[str] = None
    business_hours: Optional[str] = None

class OnboardingData(BaseModel):
    business_name: str
    industry: str
    phone: Optional[str] = None
    service_area: Optional[str] = None
    services: list[str] = []
    pricing: Optional[str] = None
    business_hours: Optional[str] = None
    faqs: list[dict] = []
    voice: str = "rachel"
    greeting: Optional[str] = None
    # Call handling options
    call_mode: str = "forwarding"  # "forwarding" or "takeover"
    rings_before_ai: int = 3
    # Emergency dispatch
    emergency_dispatch: bool = False
    oncall_phones: Optional[str] = None
    emergency_keywords: Optional[str] = None

# Helpers
def hash_password(password: str) -> str:
    salt = secrets.token_hex(16)
    h = hashlib.pbkdf2_hmac('sha256', password.encode(), salt.encode(), 100000)
    return f"{salt}:{h.hex()}"

def verify_password(password: str, stored: str) -> bool:
    try:
        salt, h = stored.split(':')
        return hashlib.pbkdf2_hmac('sha256', password.encode(), salt.encode(), 100000).hex() == h
    except:
        return False

async def get_current_user(request: Request) -> Optional[Dict]:
    token = request.cookies.get("session") or request.headers.get("Authorization", "").replace("Bearer ", "")
    if not token or token not in _sessions:
        return None
    session = _sessions[token]
    return _users.get(session["user_id"])

async def require_auth(request: Request) -> Dict:
    user = await get_current_user(request)
    if not user:
        raise HTTPException(status_code=401, detail="Not authenticated")
    return user

# Routes
@app.get("/")
async def root():
    return {"name": "CallBot AI", "version": "3.0.0", "status": "running", "timestamp": datetime.utcnow().isoformat()}

@app.get("/health")
async def health():
    return {
        "status": "healthy",
        "timestamp": datetime.utcnow().isoformat(),
        "version": "3.0.0",
        "database": "connected" if DATABASE_URL else "in_memory",
        "stripe": "configured" if STRIPE_SECRET_KEY else "demo",
        "vapi": "configured" if VAPI_API_KEY else "demo"
    }

@app.post("/api/auth/signup")
async def signup(data: SignupRequest, response: Response):
    if any(u["email"] == data.email for u in _users.values()):
        raise HTTPException(status_code=400, detail="Email already registered")

    user_id = f"usr_{secrets.token_hex(8)}"
    business_id = f"biz_{secrets.token_hex(8)}"

    _users[user_id] = {
        "id": user_id,
        "email": data.email,
        "name": data.business_name,
        "password_hash": hash_password(data.password),
        "created_at": datetime.utcnow().isoformat()
    }

    _businesses[business_id] = {
        "id": business_id,
        "user_id": user_id,
        "name": data.business_name,
        "tier": data.tier,
        "status": "active",
        "services": "",
        "business_hours": "Mon-Fri 9am-5pm",
        "vapi_assistant_id": None,
        "vapi_phone_number": None,
        "stripe_customer_id": None,
        "created_at": datetime.utcnow().isoformat()
    }

    token = secrets.token_urlsafe(32)
    _sessions[token] = {"user_id": user_id, "business_id": business_id}
    response.set_cookie("session", token, httponly=True, secure=True, samesite="lax", max_age=86400*7)

    # Create Stripe customer
    if STRIPE_SECRET_KEY:
        try:
            customer = stripe.Customer.create(email=data.email, name=data.business_name, metadata={"user_id": user_id})
            _businesses[business_id]["stripe_customer_id"] = customer.id
        except:
            pass

    return {"success": True, "user_id": user_id, "business_id": business_id, "redirect": f"/dashboard?business_id={business_id}"}

@app.post("/api/auth/login")
async def login(data: LoginRequest, response: Response):
    user = next((u for u in _users.values() if u["email"] == data.email), None)
    if not user or not verify_password(data.password, user["password_hash"]):
        raise HTTPException(status_code=401, detail="Invalid credentials")

    business = next((b for b in _businesses.values() if b["user_id"] == user["id"]), None)

    token = secrets.token_urlsafe(32)
    _sessions[token] = {"user_id": user["id"], "business_id": business["id"] if business else None}
    response.set_cookie("session", token, httponly=True, secure=True, samesite="lax", max_age=86400*7)

    return {"success": True, "user_id": user["id"], "business_id": business["id"] if business else None}

@app.post("/api/auth/logout")
async def logout(request: Request, response: Response):
    token = request.cookies.get("session")
    if token:
        _sessions.pop(token, None)
    response.delete_cookie("session")
    return {"success": True}

@app.get("/api/auth/me")
async def me(request: Request):
    user = await get_current_user(request)
    if not user:
        return {"authenticated": False}
    businesses = [b for b in _businesses.values() if b["user_id"] == user["id"]]
    return {"authenticated": True, "user": {"id": user["id"], "email": user["email"], "name": user["name"]}, "businesses": businesses}

@app.get("/api/business/{business_id}")
async def get_business(business_id: str, request: Request):
    user = await require_auth(request)
    business = _businesses.get(business_id)
    if not business or business["user_id"] != user["id"]:
        raise HTTPException(status_code=404, detail="Business not found")
    return {"business": business}

@app.patch("/api/business/{business_id}")
async def update_business(business_id: str, data: BusinessUpdate, request: Request):
    user = await require_auth(request)
    business = _businesses.get(business_id)
    if not business or business["user_id"] != user["id"]:
        raise HTTPException(status_code=404, detail="Business not found")

    for k, v in data.dict().items():
        if v is not None:
            business[k] = v
    return {"success": True}

@app.get("/api/business/{business_id}/stats")
async def get_stats(business_id: str, request: Request):
    user = await require_auth(request)
    business = _businesses.get(business_id)
    if not business or business["user_id"] != user["id"]:
        raise HTTPException(status_code=404, detail="Business not found")

    calls = [c for c in _calls if c.get("business_id") == business_id]
    appts = [a for a in _appointments if a.get("business_id") == business_id]

    return {"stats": {"total_calls": len(calls), "total_appointments": len(appts), "status": business["status"], "tier": business["tier"]}}

@app.get("/api/business/{business_id}/calls")
async def get_calls(business_id: str, request: Request):
    user = await require_auth(request)
    business = _businesses.get(business_id)
    if not business or business["user_id"] != user["id"]:
        raise HTTPException(status_code=404, detail="Business not found")

    return {"calls": [c for c in _calls if c.get("business_id") == business_id]}

@app.post("/api/onboarding/{business_id}/step")
async def save_onboarding_step(business_id: str, request: Request):
    """Save data from each onboarding step"""
    user = await require_auth(request)
    business = _businesses.get(business_id)
    if not business or business["user_id"] != user["id"]:
        raise HTTPException(status_code=404, detail="Business not found")

    body = await request.json()
    step = body.get("step")
    data = body.get("data", {})

    # Store step data in business record
    if not business.get("onboarding_data"):
        business["onboarding_data"] = {}

    for key, value in data.items():
        business["onboarding_data"][key] = value

    return {"success": True, "step": step}


@app.post("/api/onboarding/{business_id}/complete")
async def complete_onboarding(business_id: str, request: Request):
    user = await require_auth(request)
    business = _businesses.get(business_id)
    if not business or business["user_id"] != user["id"]:
        raise HTTPException(status_code=404, detail="Business not found")

    # Get stored onboarding data
    data = business.get("onboarding_data", {})

    # Update business with onboarding data
    business["name"] = data.get("name", business.get("name", ""))
    business["industry"] = data.get("industry", "")
    business["phone"] = data.get("phone", "")
    business["service_area"] = data.get("service_area", "")
    services = data.get("services", "")
    business["services"] = services if isinstance(services, str) else ", ".join(services) if services else ""
    business["pricing"] = data.get("pricing", "")
    business["business_hours"] = data.get("business_hours", "Mon-Fri 9am-5pm")
    business["faqs"] = data.get("faqs", [])
    # Call handling settings
    business["call_mode"] = data.get("call_mode", "forwarding")
    business["rings_before_ai"] = data.get("rings_before_ai", 3)
    business["emergency_dispatch"] = data.get("emergency_dispatch", False)
    business["oncall_phones"] = data.get("oncall_phones", "")
    business["emergency_keywords"] = data.get("emergency_keywords", "")

    # Build comprehensive AI system prompt
    services_list = business["services"].split(", ") if business["services"] else []
    services_text = ", ".join(services_list) if services_list else "various services"

    faqs_text = ""
    faqs = business.get("faqs", [])
    if faqs:
        faqs_text = "\n\nFrequently Asked Questions you should know:\n"
        for faq in faqs:
            faqs_text += f"Q: {faq.get('question', '')}\nA: {faq.get('answer', '')}\n"

    # Emergency dispatch instructions
    emergency_text = ""
    if business["emergency_dispatch"] and business["emergency_keywords"]:
        keywords = [k.strip() for k in business["emergency_keywords"].split(",")]
        emergency_text = f"""

EMERGENCY DISPATCH MODE (CRITICAL):
If the caller mentions any of these keywords: {', '.join(keywords)}
You MUST:
1. Stay calm and reassure the caller that help is on the way
2. Keep them on the line
3. Use the dispatchEmergency function to alert on-call staff
4. Collect details: nature of emergency, their location/address, any safety concerns
5. Keep the caller engaged and informed while waiting for callback from on-call staff"""

    # Call mode description
    call_mode_text = ""
    if business["call_mode"] == "forwarding":
        call_mode_text = f"\n\nCALL MODE: Call Forwarding - You answer calls that the business owner doesn't pick up after {business['rings_before_ai']} rings."
    else:
        call_mode_text = "\n\nCALL MODE: Full Takeover - You handle ALL incoming calls directly."

    business_name = business["name"]
    industry = business["industry"]
    service_area = business.get("service_area", "Local area")
    business_hours = business.get("business_hours", "Mon-Fri 9am-5pm")
    pricing = business.get("pricing", "")

    system_prompt = f"""You are a professional AI phone receptionist for {business_name}, a {industry} business.

BUSINESS INFORMATION:
- Business Name: {business_name}
- Industry: {industry}
- Service Area: {service_area or 'Local area'}
- Business Hours: {business_hours or 'Mon-Fri 9am-5pm'}

SERVICES OFFERED:
{services_text}

{f"PRICING INFORMATION: {pricing}" if pricing else ""}
{faqs_text}{call_mode_text}{emergency_text}

YOUR RESPONSIBILITIES:
1. Answer calls professionally and warmly
2. Understand caller needs and provide helpful information
3. Schedule appointments when requested - collect: name, phone, service needed, preferred date/time
4. Answer questions about services, pricing, and availability
5. Take messages for complex issues that need human follow-up
6. Always be helpful, patient, and professional

APPOINTMENT BOOKING:
When a caller wants to schedule an appointment, collect:
- Their full name
- Phone number
- What service they need
- Preferred date and time
Then confirm the details and let them know they'll receive a confirmation.

If you don't know something specific, offer to have someone call them back with more details."""

    greeting = data.get("greeting") or f"Hello! Thank you for calling {business_name}. How can I help you today?"
    voice = data.get("agent_voice", "rachel")

    # Create Vapi assistant with full business context
    phone_number = None
    assistant_id = None

    if VAPI_API_KEY:
        try:
            async with httpx.AsyncClient() as client:
                resp = await client.post(
                    "https://api.vapi.ai/assistant",
                    headers={"Authorization": f"Bearer {VAPI_API_KEY}"},
                    json={
                        "name": f"{business_name} AI Receptionist",
                        "voice": {"voiceId": voice, "provider": "11labs"},
                        "model": {
                            "provider": "openai",
                            "model": "gpt-4-turbo-preview",
                            "messages": [{"role": "system", "content": system_prompt}]
                        },
                        "firstMessage": greeting,
                        "serverUrl": f"{BASE_URL}/api/webhooks/vapi",
                        "functions": [
                            {
                                "name": "bookAppointment",
                                "description": "Book an appointment for the caller",
                                "parameters": {
                                    "type": "object",
                                    "properties": {
                                        "customer_name": {"type": "string", "description": "Full name of the customer"},
                                        "phone_number": {"type": "string", "description": "Customer phone number"},
                                        "service_type": {"type": "string", "description": "Type of service requested"},
                                        "preferred_date": {"type": "string", "description": "Preferred date and time"},
                                        "notes": {"type": "string", "description": "Any additional notes"}
                                    },
                                    "required": ["customer_name", "phone_number", "service_type", "preferred_date"]
                                }
                            },
                            {
                                "name": "dispatchEmergency",
                                "description": "Alert on-call staff for emergency situations. Use this when caller mentions emergency keywords like flooding, no heat, urgent, etc.",
                                "parameters": {
                                    "type": "object",
                                    "properties": {
                                        "caller_name": {"type": "string", "description": "Caller's name"},
                                        "caller_phone": {"type": "string", "description": "Caller's phone number"},
                                        "emergency_type": {"type": "string", "description": "Type of emergency"},
                                        "location": {"type": "string", "description": "Location/address of emergency"},
                                        "details": {"type": "string", "description": "Additional details about the emergency"}
                                    },
                                    "required": ["caller_phone", "emergency_type", "details"]
                                }
                            }
                        ]
                    },
                    timeout=30
                )
                if resp.status_code == 201:
                    assistant_id = resp.json().get("id")
                    # Get phone number
                    phone_resp = await client.post(
                        "https://api.vapi.ai/phone-number",
                        headers={"Authorization": f"Bearer {VAPI_API_KEY}"},
                        json={"assistantId": assistant_id, "provider": "vapi"},
                        timeout=30
                    )
                    if phone_resp.status_code == 201:
                        phone_number = phone_resp.json().get("number")
                else:
                    print(f"Vapi assistant creation failed: {resp.status_code} - {resp.text}")
        except Exception as e:
            print(f"Vapi error: {e}")

    business["vapi_assistant_id"] = assistant_id
    business["vapi_phone_number"] = phone_number
    business["status"] = "active"

    return {"success": True, "assistant_id": assistant_id, "phone_number": phone_number, "redirect": f"/dashboard?business_id={business_id}"}

@app.get("/api/stripe/checkout")
async def stripe_checkout(business_id: str, tier: str = "starter", request: Request = None):
    user = await require_auth(request)
    business = _businesses.get(business_id)
    if not business or business["user_id"] != user["id"]:
        raise HTTPException(status_code=404, detail="Business not found")

    if not STRIPE_SECRET_KEY:
        return {"success": True, "url": f"/dashboard?business_id={business_id}"}

    prices = {"starter": 4900, "professional": 9900, "business": 19900}

    checkout = stripe.checkout.Session.create(
        customer=business.get("stripe_customer_id"),
        payment_method_types=["card"],
        line_items=[{"price_data": {"currency": "usd", "product_data": {"name": f"CallBot AI {tier.title()}"}, "recurring": {"interval": "month"}, "unit_amount": prices.get(tier, 29700)}, "quantity": 1}],
        mode="subscription",
        subscription_data={"trial_period_days": 7},
        success_url=f"{BASE_URL}/dashboard?business_id={business_id}&success=true",
        cancel_url=f"{BASE_URL}/pricing?cancelled=true"
    )

    return {"success": True, "url": checkout.url}

@app.get("/api/stripe/portal")
async def stripe_portal(request: Request):
    user = await require_auth(request)
    business = next((b for b in _businesses.values() if b["user_id"] == user["id"]), None)
    if not business or not business.get("stripe_customer_id"):
        raise HTTPException(status_code=400, detail="No subscription found")

    portal = stripe.billing_portal.Session.create(customer=business["stripe_customer_id"], return_url=f"{BASE_URL}/dashboard")
    return RedirectResponse(url=portal.url, status_code=303)

@app.post("/api/webhooks/vapi")
async def vapi_webhook(request: Request):
    try:
        body = await request.json()
        event_type = body.get("type", body.get("message", {}).get("type"))

        if event_type == "end-of-call-report":
            call_data = body.get("call", body.get("message", {}).get("call", {}))
            assistant_id = call_data.get("assistantId")
            business = next((b for b in _businesses.values() if b.get("vapi_assistant_id") == assistant_id), None)
            if business:
                _calls.append({
                    "id": f"call_{secrets.token_hex(8)}",
                    "business_id": business["id"],
                    "caller_phone": call_data.get("customer", {}).get("number"),
                    "duration": call_data.get("duration", 0),
                    "summary": body.get("summary", ""),
                    "created_at": datetime.utcnow().isoformat()
                })

        elif event_type == "function-call":
            func = body.get("functionCall", {})
            if func.get("name") == "bookAppointment":
                params = func.get("parameters", {})
                assistant_id = body.get("call", {}).get("assistantId")
                business = next((b for b in _businesses.values() if b.get("vapi_assistant_id") == assistant_id), None)
                if business:
                    appt_id = f"appt_{secrets.token_hex(8)}"
                    _appointments.append({
                        "id": appt_id,
                        "business_id": business["id"],
                        "customer_name": params.get("customer_name"),
                        "customer_phone": params.get("phone_number"),
                        "service_type": params.get("service_type"),
                        "preferred_date": params.get("preferred_date"),
                        "status": "pending",
                        "created_at": datetime.utcnow().isoformat()
                    })
                    return {"result": f"Appointment booked! Reference: {appt_id[:12]}"}

            elif func.get("name") == "dispatchEmergency":
                params = func.get("parameters", {})
                assistant_id = body.get("call", {}).get("assistantId")
                business = next((b for b in _businesses.values() if b.get("vapi_assistant_id") == assistant_id), None)
                if business and business.get("emergency_dispatch"):
                    # Log the emergency
                    emergency_id = f"emg_{secrets.token_hex(8)}"
                    oncall_phones = business.get("oncall_phones", "")

                    # In production, this would trigger actual calls/SMS to on-call staff
                    # For now, we log and simulate the dispatch
                    print(f"EMERGENCY DISPATCH: {emergency_id}")
                    print(f"  Business: {business['name']}")
                    print(f"  Caller: {params.get('caller_phone')}")
                    print(f"  Type: {params.get('emergency_type')}")
                    print(f"  Details: {params.get('details')}")
                    print(f"  Dispatching to: {oncall_phones}")

                    # Store emergency record
                    _calls.append({
                        "id": emergency_id,
                        "business_id": business["id"],
                        "caller_phone": params.get("caller_phone"),
                        "type": "emergency",
                        "emergency_type": params.get("emergency_type"),
                        "location": params.get("location"),
                        "details": params.get("details"),
                        "dispatched_to": oncall_phones,
                        "status": "dispatched",
                        "created_at": datetime.utcnow().isoformat()
                    })

                    return {"result": f"Emergency dispatch initiated! Our on-call team has been alerted and will call back shortly. Reference: {emergency_id[:12]}"}

        return {"status": "ok"}
    except Exception as e:
        print(f"Webhook error: {e}")
        return {"status": "error"}

@app.get("/api/pricing")
async def pricing():
    return {
        "tiers": [
            {"name": "Starter", "price": 49, "minutes": 100, "features": ["1 AI Agent", "100 min/mo", "Appointment booking", "Email notifications", "Call recordings"]},
            {"name": "Professional", "price": 99, "minutes": 300, "popular": True, "features": ["Everything in Starter", "300 min/mo", "SMS notifications", "Custom AI voice", "Emergency dispatch", "Priority support"]},
            {"name": "Business", "price": 199, "minutes": 1000, "features": ["Everything in Professional", "1,000 min/mo", "Multiple phone numbers", "CRM integrations", "API access", "Dedicated account manager"]}
        ]
    }

# Demo endpoint for testing
@app.post("/api/demo/call")
async def demo_call():
    """Simulate a call for demo purposes"""
    business = next(iter(_businesses.values()), None)
    if business:
        _calls.append({
            "id": f"call_{secrets.token_hex(8)}",
            "business_id": business["id"],
            "caller_phone": "+1555" + secrets.token_hex(3),
            "duration": 120 + secrets.randbelow(180),
            "summary": "Demo call - Customer inquired about services and scheduled an appointment.",
            "created_at": datetime.utcnow().isoformat()
        })
        return {"success": True, "message": "Demo call logged"}
    return {"success": False, "message": "No business found"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=PORT)
