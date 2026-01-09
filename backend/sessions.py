"""
Redis-backed Session Management for CallBotAI
Production-ready with secure session handling
"""

import os
import json
import secrets
import hashlib
from datetime import datetime, timedelta
from typing import Optional, Dict, Any
from dataclasses import dataclass, asdict

import redis.asyncio as redis

# Configuration
REDIS_URL = os.getenv("REDIS_URL", "")
SESSION_EXPIRY = int(os.getenv("SESSION_EXPIRY_DAYS", "30"))  # days
SESSION_PREFIX = "session:"
RATE_LIMIT_PREFIX = "ratelimit:"

# Redis client
_redis: Optional[redis.Redis] = None
_redis_available = True
_in_memory_sessions: Dict[str, Any] = {}  # Fallback for when Redis unavailable


async def get_redis() -> Optional[redis.Redis]:
    """Get or create Redis connection (returns None if unavailable)"""
    global _redis, _redis_available

    if not REDIS_URL or not _redis_available:
        return None

    if _redis is None:
        try:
            _redis = redis.from_url(REDIS_URL, decode_responses=True)
            await _redis.ping()  # Test connection
        except Exception as e:
            print(f"Redis unavailable: {e}. Using in-memory sessions.")
            _redis_available = False
            _redis = None
            return None
    return _redis


async def close_redis():
    """Close Redis connection"""
    global _redis
    if _redis:
        await _redis.close()
        _redis = None


@dataclass
class Session:
    """Session data structure"""
    user_id: str
    email: str
    created_at: str
    last_activity: str
    ip_address: Optional[str] = None
    user_agent: Optional[str] = None
    business_id: Optional[str] = None

    def to_dict(self) -> Dict:
        return asdict(self)

    @classmethod
    def from_dict(cls, data: Dict) -> "Session":
        return cls(**{k: v for k, v in data.items() if k in cls.__dataclass_fields__})


async def create_session(
    user_id: str,
    email: str,
    ip_address: str = None,
    user_agent: str = None,
    business_id: str = None
) -> str:
    """Create a new session and return the token"""
    r = await get_redis()

    # Generate secure token
    token = secrets.token_urlsafe(32)

    # Create session data
    session = Session(
        user_id=user_id,
        email=email,
        created_at=datetime.utcnow().isoformat(),
        last_activity=datetime.utcnow().isoformat(),
        ip_address=ip_address,
        user_agent=user_agent,
        business_id=business_id
    )

    if r:
        # Store in Redis with expiry
        key = f"{SESSION_PREFIX}{token}"
        await r.setex(
            key,
            timedelta(days=SESSION_EXPIRY),
            json.dumps(session.to_dict())
        )

        # Also store a reverse lookup by user_id for session management
        user_sessions_key = f"user_sessions:{user_id}"
        await r.sadd(user_sessions_key, token)
        await r.expire(user_sessions_key, timedelta(days=SESSION_EXPIRY))
    else:
        # Fallback to in-memory storage
        _in_memory_sessions[token] = {
            "data": session.to_dict(),
            "expires": datetime.utcnow() + timedelta(days=SESSION_EXPIRY)
        }

    return token


async def get_session(token: str) -> Optional[Session]:
    """Get session by token"""
    if not token:
        return None

    r = await get_redis()

    if r:
        key = f"{SESSION_PREFIX}{token}"
        data = await r.get(key)
        if not data:
            return None

        try:
            session = Session.from_dict(json.loads(data))

            # Update last activity
            session.last_activity = datetime.utcnow().isoformat()
            await r.setex(
                key,
                timedelta(days=SESSION_EXPIRY),
                json.dumps(session.to_dict())
            )

            return session
        except (json.JSONDecodeError, TypeError):
            return None
    else:
        # Fallback to in-memory storage
        if token not in _in_memory_sessions:
            return None

        session_data = _in_memory_sessions[token]
        if datetime.utcnow() > session_data["expires"]:
            del _in_memory_sessions[token]
            return None

        try:
            session = Session.from_dict(session_data["data"])
            session.last_activity = datetime.utcnow().isoformat()
            session_data["data"] = session.to_dict()
            return session
        except (KeyError, TypeError):
            return None


async def delete_session(token: str) -> bool:
    """Delete a session"""
    r = await get_redis()

    if r:
        key = f"{SESSION_PREFIX}{token}"

        # Get session to find user_id
        data = await r.get(key)
        if data:
            try:
                session_data = json.loads(data)
                user_id = session_data.get('user_id')
                if user_id:
                    await r.srem(f"user_sessions:{user_id}", token)
            except json.JSONDecodeError:
                pass

        result = await r.delete(key)
        return result > 0
    else:
        # Fallback to in-memory storage
        if token in _in_memory_sessions:
            del _in_memory_sessions[token]
            return True
        return False


async def delete_all_user_sessions(user_id: str) -> int:
    """Delete all sessions for a user (logout everywhere)"""
    r = await get_redis()
    user_sessions_key = f"user_sessions:{user_id}"

    tokens = await r.smembers(user_sessions_key)
    count = 0

    for token in tokens:
        key = f"{SESSION_PREFIX}{token}"
        result = await r.delete(key)
        count += result

    await r.delete(user_sessions_key)
    return count


async def get_user_sessions(user_id: str) -> list:
    """Get all active sessions for a user"""
    r = await get_redis()
    user_sessions_key = f"user_sessions:{user_id}"

    tokens = await r.smembers(user_sessions_key)
    sessions = []

    for token in tokens:
        session = await get_session(token)
        if session:
            sessions.append({
                "token_preview": token[:8] + "...",
                "created_at": session.created_at,
                "last_activity": session.last_activity,
                "ip_address": session.ip_address,
                "user_agent": session.user_agent
            })

    return sessions


# =============================================================================
# Rate Limiting
# =============================================================================

async def check_rate_limit(
    identifier: str,
    limit: int,
    window_seconds: int,
    action: str = "request"
) -> tuple[bool, int]:
    """
    Check rate limit for an identifier.
    Returns (allowed: bool, remaining: int)
    """
    r = await get_redis()

    if not r:
        # If Redis unavailable, allow all requests (no rate limiting)
        return True, limit

    key = f"{RATE_LIMIT_PREFIX}{action}:{identifier}"

    current = await r.get(key)

    if current is None:
        # First request in window
        await r.setex(key, window_seconds, 1)
        return True, limit - 1

    current = int(current)
    if current >= limit:
        return False, 0

    await r.incr(key)
    return True, limit - current - 1


async def get_rate_limit_reset(identifier: str, action: str = "request") -> int:
    """Get seconds until rate limit resets"""
    r = await get_redis()
    key = f"{RATE_LIMIT_PREFIX}{action}:{identifier}"
    ttl = await r.ttl(key)
    return max(0, ttl)


# =============================================================================
# Cache Helpers
# =============================================================================

async def cache_set(key: str, value: Any, ttl_seconds: int = 3600):
    """Set a cached value"""
    r = await get_redis()
    await r.setex(f"cache:{key}", ttl_seconds, json.dumps(value))


async def cache_get(key: str) -> Optional[Any]:
    """Get a cached value"""
    r = await get_redis()
    data = await r.get(f"cache:{key}")
    if data:
        try:
            return json.loads(data)
        except json.JSONDecodeError:
            return None
    return None


async def cache_delete(key: str):
    """Delete a cached value"""
    r = await get_redis()
    await r.delete(f"cache:{key}")


async def cache_delete_pattern(pattern: str):
    """Delete all keys matching pattern"""
    r = await get_redis()
    keys = []
    async for key in r.scan_iter(f"cache:{pattern}"):
        keys.append(key)
    if keys:
        await r.delete(*keys)


# =============================================================================
# Distributed Locking
# =============================================================================

class DistributedLock:
    """Simple distributed lock using Redis"""

    def __init__(self, name: str, timeout: int = 10):
        self.name = f"lock:{name}"
        self.timeout = timeout
        self.token = None

    async def __aenter__(self):
        r = await get_redis()
        self.token = secrets.token_hex(16)

        # Try to acquire lock
        acquired = await r.set(
            self.name,
            self.token,
            nx=True,
            ex=self.timeout
        )

        if not acquired:
            raise RuntimeError(f"Could not acquire lock: {self.name}")

        return self

    async def __aexit__(self, exc_type, exc_val, exc_tb):
        r = await get_redis()

        # Only release if we own the lock
        current = await r.get(self.name)
        if current == self.token:
            await r.delete(self.name)


# =============================================================================
# Health Check
# =============================================================================

async def redis_health_check() -> Dict:
    """Check Redis connection health"""
    try:
        r = await get_redis()
        if not r:
            return {
                "status": "unavailable",
                "mode": "in-memory fallback",
                "sessions_count": len(_in_memory_sessions)
            }
        await r.ping()
        info = await r.info("memory")
        return {
            "status": "healthy",
            "used_memory": info.get("used_memory_human", "unknown"),
            "connected_clients": info.get("connected_clients", "unknown")
        }
    except Exception as e:
        return {
            "status": "unhealthy",
            "error": str(e)
        }
