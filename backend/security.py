"""
Security Middleware and Utilities for CallBotAI
Rate limiting, CSRF protection, input validation, and more
"""

import os
import re
import hashlib
import secrets
import time
from typing import Optional, Callable, List
from datetime import datetime, timedelta
from functools import wraps

from fastapi import Request, HTTPException, status
from fastapi.responses import JSONResponse
from starlette.middleware.base import BaseHTTPMiddleware
import bleach

# Configuration
RATE_LIMIT_ENABLED = os.getenv("RATE_LIMIT_ENABLED", "true").lower() == "true"
CSRF_ENABLED = os.getenv("CSRF_ENABLED", "true").lower() == "true"
ALLOWED_HOSTS = os.getenv("ALLOWED_HOSTS", "localhost,127.0.0.1").split(",")
SECRET_KEY = os.getenv("SECRET_KEY", secrets.token_hex(32))

# In-memory rate limit storage (use Redis in production via sessions.py)
_rate_limits = {}


# =============================================================================
# Password Hashing
# =============================================================================

def hash_password(password: str, salt: str = None) -> tuple[str, str]:
    """
    Hash a password using PBKDF2-SHA256.
    Returns (hash, salt)
    """
    if salt is None:
        salt = secrets.token_hex(16)

    # PBKDF2 with 100,000 iterations
    key = hashlib.pbkdf2_hmac(
        'sha256',
        password.encode('utf-8'),
        salt.encode('utf-8'),
        100000
    )
    return key.hex(), salt


def verify_password(password: str, password_hash: str, salt: str) -> bool:
    """Verify a password against its hash"""
    computed_hash, _ = hash_password(password, salt)
    return secrets.compare_digest(computed_hash, password_hash)


def create_password_hash(password: str) -> str:
    """Create a storable password hash (hash:salt format)"""
    hashed, salt = hash_password(password)
    return f"{hashed}:{salt}"


def check_password_hash(password: str, stored_hash: str) -> bool:
    """Check password against stored hash:salt format"""
    try:
        hashed, salt = stored_hash.split(":")
        return verify_password(password, hashed, salt)
    except ValueError:
        # Legacy format - simple SHA256
        legacy_hash = hashlib.sha256(f"callbotai_salt_2024{password}".encode()).hexdigest()
        return secrets.compare_digest(legacy_hash, stored_hash)


# =============================================================================
# Input Validation
# =============================================================================

def validate_email(email: str) -> bool:
    """Validate email format"""
    pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
    return bool(re.match(pattern, email))


def validate_phone(phone: str) -> bool:
    """Validate phone number format"""
    # Remove common formatting
    cleaned = re.sub(r'[\s\-\(\)\.]', '', phone)
    # Check if it's a valid phone number (10-15 digits, optionally starting with +)
    pattern = r'^\+?[1-9]\d{9,14}$'
    return bool(re.match(pattern, cleaned))


def validate_password_strength(password: str) -> tuple[bool, str]:
    """
    Validate password strength.
    Returns (is_valid, message)
    """
    if len(password) < 8:
        return False, "Password must be at least 8 characters"
    if len(password) > 128:
        return False, "Password must be less than 128 characters"
    if not re.search(r'[A-Za-z]', password):
        return False, "Password must contain at least one letter"
    if not re.search(r'\d', password):
        return False, "Password must contain at least one number"
    return True, "Password is valid"


def sanitize_html(text: str) -> str:
    """Sanitize HTML to prevent XSS"""
    return bleach.clean(text, tags=[], strip=True)


def sanitize_input(text: str, max_length: int = 1000) -> str:
    """Sanitize general text input"""
    if not text:
        return ""
    # Remove null bytes
    text = text.replace('\x00', '')
    # Truncate
    text = text[:max_length]
    # Sanitize HTML
    text = sanitize_html(text)
    return text.strip()


# =============================================================================
# Rate Limiting (In-Memory - use Redis for production)
# =============================================================================

class RateLimiter:
    """Simple in-memory rate limiter"""

    def __init__(self):
        self.requests = {}

    def is_allowed(
        self,
        key: str,
        limit: int,
        window_seconds: int
    ) -> tuple[bool, int, int]:
        """
        Check if request is allowed.
        Returns (allowed, remaining, reset_seconds)
        """
        now = time.time()
        window_start = now - window_seconds

        # Clean old entries
        if key in self.requests:
            self.requests[key] = [t for t in self.requests[key] if t > window_start]
        else:
            self.requests[key] = []

        current_count = len(self.requests[key])

        if current_count >= limit:
            # Calculate reset time
            oldest = min(self.requests[key]) if self.requests[key] else now
            reset_seconds = int(oldest + window_seconds - now)
            return False, 0, reset_seconds

        self.requests[key].append(now)
        remaining = limit - current_count - 1
        return True, remaining, window_seconds


rate_limiter = RateLimiter()


# Rate limit configurations
RATE_LIMITS = {
    "login": {"limit": 5, "window": 300},        # 5 attempts per 5 minutes
    "signup": {"limit": 3, "window": 3600},      # 3 signups per hour per IP
    "password_reset": {"limit": 3, "window": 3600},  # 3 resets per hour
    "api": {"limit": 100, "window": 60},         # 100 requests per minute
    "webhook": {"limit": 1000, "window": 60},    # 1000 webhooks per minute
}


def check_rate_limit(key: str, limit_type: str = "api") -> tuple[bool, dict]:
    """
    Check rate limit and return headers.
    Returns (allowed, headers_dict)
    """
    if not RATE_LIMIT_ENABLED:
        return True, {}

    config = RATE_LIMITS.get(limit_type, RATE_LIMITS["api"])
    allowed, remaining, reset = rate_limiter.is_allowed(
        f"{limit_type}:{key}",
        config["limit"],
        config["window"]
    )

    headers = {
        "X-RateLimit-Limit": str(config["limit"]),
        "X-RateLimit-Remaining": str(remaining),
        "X-RateLimit-Reset": str(reset)
    }

    return allowed, headers


# =============================================================================
# CSRF Protection
# =============================================================================

def generate_csrf_token(session_id: str) -> str:
    """Generate CSRF token tied to session"""
    data = f"{session_id}:{SECRET_KEY}"
    return hashlib.sha256(data.encode()).hexdigest()[:32]


def verify_csrf_token(token: str, session_id: str) -> bool:
    """Verify CSRF token"""
    expected = generate_csrf_token(session_id)
    return secrets.compare_digest(token, expected)


# =============================================================================
# Security Headers Middleware
# =============================================================================

class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    """Add security headers to all responses"""

    async def dispatch(self, request: Request, call_next):
        response = await call_next(request)

        # Security headers
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["X-XSS-Protection"] = "1; mode=block"
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
        response.headers["Permissions-Policy"] = "geolocation=(), microphone=(), camera=()"

        # Content Security Policy
        csp = (
            "default-src 'self'; "
            "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.tailwindcss.com https://js.stripe.com; "
            "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; "
            "font-src 'self' https://fonts.gstatic.com; "
            "img-src 'self' data: https:; "
            "connect-src 'self' https://api.stripe.com; "
            "frame-src https://js.stripe.com; "
        )
        response.headers["Content-Security-Policy"] = csp

        # HSTS (only in production with HTTPS)
        if request.url.scheme == "https":
            response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"

        return response


# =============================================================================
# Rate Limit Middleware
# =============================================================================

class RateLimitMiddleware(BaseHTTPMiddleware):
    """Rate limit middleware"""

    async def dispatch(self, request: Request, call_next):
        if not RATE_LIMIT_ENABLED:
            return await call_next(request)

        # Get client IP
        client_ip = request.client.host if request.client else "unknown"
        forwarded = request.headers.get("X-Forwarded-For")
        if forwarded:
            client_ip = forwarded.split(",")[0].strip()

        # Determine limit type based on path
        path = request.url.path
        if "/login" in path:
            limit_type = "login"
        elif "/signup" in path:
            limit_type = "signup"
        elif "/password" in path or "/reset" in path:
            limit_type = "password_reset"
        elif "/webhook" in path:
            limit_type = "webhook"
        else:
            limit_type = "api"

        allowed, headers = check_rate_limit(client_ip, limit_type)

        if not allowed:
            return JSONResponse(
                status_code=429,
                content={"detail": "Too many requests. Please try again later."},
                headers=headers
            )

        response = await call_next(request)

        # Add rate limit headers
        for key, value in headers.items():
            response.headers[key] = value

        return response


# =============================================================================
# Request Logging Middleware
# =============================================================================

class RequestLoggingMiddleware(BaseHTTPMiddleware):
    """Log all requests for security auditing"""

    async def dispatch(self, request: Request, call_next):
        start_time = time.time()

        # Get client info
        client_ip = request.client.host if request.client else "unknown"
        forwarded = request.headers.get("X-Forwarded-For")
        if forwarded:
            client_ip = forwarded.split(",")[0].strip()

        # Process request
        response = await call_next(request)

        # Calculate duration
        duration = time.time() - start_time

        # Log request (in production, send to logging service)
        log_data = {
            "timestamp": datetime.utcnow().isoformat(),
            "method": request.method,
            "path": request.url.path,
            "status": response.status_code,
            "duration_ms": round(duration * 1000, 2),
            "client_ip": client_ip,
            "user_agent": request.headers.get("User-Agent", "")[:200]
        }

        # Only log non-health check requests
        if "/health" not in request.url.path:
            print(f"[REQUEST] {log_data['method']} {log_data['path']} {log_data['status']} {log_data['duration_ms']}ms")

        return response


# =============================================================================
# IP Blocking
# =============================================================================

BLOCKED_IPS: set = set()


def block_ip(ip: str, reason: str = ""):
    """Block an IP address"""
    BLOCKED_IPS.add(ip)
    print(f"[SECURITY] Blocked IP {ip}: {reason}")


def unblock_ip(ip: str):
    """Unblock an IP address"""
    BLOCKED_IPS.discard(ip)


def is_ip_blocked(ip: str) -> bool:
    """Check if IP is blocked"""
    return ip in BLOCKED_IPS


class IPBlockMiddleware(BaseHTTPMiddleware):
    """Block requests from blocked IPs"""

    async def dispatch(self, request: Request, call_next):
        client_ip = request.client.host if request.client else "unknown"
        forwarded = request.headers.get("X-Forwarded-For")
        if forwarded:
            client_ip = forwarded.split(",")[0].strip()

        if is_ip_blocked(client_ip):
            return JSONResponse(
                status_code=403,
                content={"detail": "Access denied"}
            )

        return await call_next(request)


# =============================================================================
# API Key Validation
# =============================================================================

def generate_api_key() -> str:
    """Generate a new API key"""
    return f"cb_{secrets.token_urlsafe(32)}"


def hash_api_key(api_key: str) -> str:
    """Hash an API key for storage"""
    return hashlib.sha256(api_key.encode()).hexdigest()


# =============================================================================
# Secure Cookie Settings
# =============================================================================

def get_cookie_settings(is_production: bool = False) -> dict:
    """Get secure cookie settings"""
    return {
        "httponly": True,
        "secure": is_production,
        "samesite": "lax",
        "max_age": 86400 * 30  # 30 days
    }


# =============================================================================
# SQL Injection Prevention
# =============================================================================

def is_safe_identifier(identifier: str) -> bool:
    """Check if string is safe to use as SQL identifier"""
    return bool(re.match(r'^[a-zA-Z_][a-zA-Z0-9_]*$', identifier))


# =============================================================================
# Webhook Signature Verification
# =============================================================================

def verify_webhook_signature(
    payload: bytes,
    signature: str,
    secret: str,
    tolerance_seconds: int = 300
) -> bool:
    """
    Verify webhook signature (Stripe-style).
    Signature format: t=timestamp,v1=signature
    """
    try:
        parts = dict(part.split("=") for part in signature.split(","))
        timestamp = int(parts.get("t", 0))
        expected_sig = parts.get("v1", "")

        # Check timestamp tolerance
        current_time = int(time.time())
        if abs(current_time - timestamp) > tolerance_seconds:
            return False

        # Compute expected signature
        signed_payload = f"{timestamp}.{payload.decode()}"
        computed = hashlib.hmac(
            secret.encode(),
            signed_payload.encode(),
            hashlib.sha256
        ).hexdigest()

        return secrets.compare_digest(computed, expected_sig)

    except (ValueError, KeyError):
        return False
