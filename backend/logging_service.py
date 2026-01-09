"""
Structured Logging Service for CallBotAI
Production-ready logging with JSON output and log levels
"""

import os
import sys
import json
import logging
import traceback
from datetime import datetime
from typing import Any, Dict, Optional
from functools import wraps
import time

# Configuration
LOG_LEVEL = os.getenv("LOG_LEVEL", "INFO").upper()
LOG_FORMAT = os.getenv("LOG_FORMAT", "json")  # json or text
LOG_FILE = os.getenv("LOG_FILE", "")  # Optional file path
SERVICE_NAME = os.getenv("SERVICE_NAME", "callbotai")
ENVIRONMENT = os.getenv("ENVIRONMENT", "development")


class JSONFormatter(logging.Formatter):
    """Format log records as JSON"""

    def format(self, record: logging.LogRecord) -> str:
        log_data = {
            "timestamp": datetime.utcnow().isoformat() + "Z",
            "level": record.levelname,
            "logger": record.name,
            "message": record.getMessage(),
            "service": SERVICE_NAME,
            "environment": ENVIRONMENT,
        }

        # Add extra fields
        if hasattr(record, "extra_fields"):
            log_data.update(record.extra_fields)

        # Add exception info if present
        if record.exc_info:
            log_data["exception"] = {
                "type": record.exc_info[0].__name__ if record.exc_info[0] else None,
                "message": str(record.exc_info[1]) if record.exc_info[1] else None,
                "traceback": traceback.format_exception(*record.exc_info)
            }

        # Add source location
        log_data["source"] = {
            "file": record.filename,
            "line": record.lineno,
            "function": record.funcName
        }

        return json.dumps(log_data)


class TextFormatter(logging.Formatter):
    """Human-readable text formatter with colors"""

    COLORS = {
        "DEBUG": "\033[36m",     # Cyan
        "INFO": "\033[32m",      # Green
        "WARNING": "\033[33m",   # Yellow
        "ERROR": "\033[31m",     # Red
        "CRITICAL": "\033[35m",  # Magenta
        "RESET": "\033[0m"
    }

    def format(self, record: logging.LogRecord) -> str:
        color = self.COLORS.get(record.levelname, "")
        reset = self.COLORS["RESET"]

        timestamp = datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S")
        base = f"{timestamp} {color}{record.levelname:8}{reset} [{record.name}] {record.getMessage()}"

        # Add extra fields
        if hasattr(record, "extra_fields") and record.extra_fields:
            extras = " ".join(f"{k}={v}" for k, v in record.extra_fields.items())
            base += f" | {extras}"

        # Add exception info
        if record.exc_info:
            base += f"\n{''.join(traceback.format_exception(*record.exc_info))}"

        return base


class StructuredLogger:
    """Logger with structured logging support"""

    def __init__(self, name: str):
        self.logger = logging.getLogger(name)
        self.logger.setLevel(getattr(logging, LOG_LEVEL))

        # Remove existing handlers
        self.logger.handlers = []

        # Console handler
        console_handler = logging.StreamHandler(sys.stdout)
        console_handler.setLevel(getattr(logging, LOG_LEVEL))

        if LOG_FORMAT == "json":
            console_handler.setFormatter(JSONFormatter())
        else:
            console_handler.setFormatter(TextFormatter())

        self.logger.addHandler(console_handler)

        # File handler (optional)
        if LOG_FILE:
            file_handler = logging.FileHandler(LOG_FILE)
            file_handler.setLevel(getattr(logging, LOG_LEVEL))
            file_handler.setFormatter(JSONFormatter())
            self.logger.addHandler(file_handler)

    def _log(self, level: int, message: str, **kwargs):
        """Log with extra fields"""
        record = self.logger.makeRecord(
            self.logger.name,
            level,
            "(unknown file)",
            0,
            message,
            (),
            None
        )
        record.extra_fields = kwargs
        self.logger.handle(record)

    def debug(self, message: str, **kwargs):
        self._log(logging.DEBUG, message, **kwargs)

    def info(self, message: str, **kwargs):
        self._log(logging.INFO, message, **kwargs)

    def warning(self, message: str, **kwargs):
        self._log(logging.WARNING, message, **kwargs)

    def error(self, message: str, exc_info: bool = False, **kwargs):
        if exc_info:
            kwargs["exc_info"] = sys.exc_info()
        self._log(logging.ERROR, message, **kwargs)

    def critical(self, message: str, exc_info: bool = False, **kwargs):
        if exc_info:
            kwargs["exc_info"] = sys.exc_info()
        self._log(logging.CRITICAL, message, **kwargs)

    def exception(self, message: str, **kwargs):
        """Log exception with traceback"""
        self.error(message, exc_info=True, **kwargs)


# Default logger
logger = StructuredLogger("callbotai")


# =============================================================================
# Specialized Loggers
# =============================================================================

class RequestLogger(StructuredLogger):
    """Logger for HTTP requests"""

    def __init__(self):
        super().__init__("callbotai.request")

    def log_request(
        self,
        method: str,
        path: str,
        status_code: int,
        duration_ms: float,
        client_ip: str = None,
        user_id: str = None,
        business_id: str = None,
        **kwargs
    ):
        self.info(
            f"{method} {path} {status_code}",
            method=method,
            path=path,
            status_code=status_code,
            duration_ms=round(duration_ms, 2),
            client_ip=client_ip,
            user_id=user_id,
            business_id=business_id,
            **kwargs
        )


class AuditLogger(StructuredLogger):
    """Logger for security audit events"""

    def __init__(self):
        super().__init__("callbotai.audit")

    def log_auth(
        self,
        action: str,
        email: str = None,
        user_id: str = None,
        success: bool = True,
        reason: str = None,
        client_ip: str = None,
        **kwargs
    ):
        level = "info" if success else "warning"
        getattr(self, level)(
            f"Auth: {action}",
            action=action,
            email=email,
            user_id=user_id,
            success=success,
            reason=reason,
            client_ip=client_ip,
            event_type="auth",
            **kwargs
        )

    def log_access(
        self,
        resource: str,
        action: str,
        user_id: str = None,
        business_id: str = None,
        allowed: bool = True,
        **kwargs
    ):
        level = "info" if allowed else "warning"
        getattr(self, level)(
            f"Access: {action} on {resource}",
            resource=resource,
            action=action,
            user_id=user_id,
            business_id=business_id,
            allowed=allowed,
            event_type="access",
            **kwargs
        )

    def log_data_change(
        self,
        entity: str,
        entity_id: str,
        action: str,
        user_id: str = None,
        changes: Dict = None,
        **kwargs
    ):
        self.info(
            f"Data: {action} {entity}",
            entity=entity,
            entity_id=entity_id,
            action=action,
            user_id=user_id,
            changes=changes,
            event_type="data_change",
            **kwargs
        )


class CallLogger(StructuredLogger):
    """Logger for call events"""

    def __init__(self):
        super().__init__("callbotai.calls")

    def log_call_start(
        self,
        call_id: str,
        business_id: str,
        caller_phone: str = None,
        **kwargs
    ):
        self.info(
            "Call started",
            call_id=call_id,
            business_id=business_id,
            caller_phone=caller_phone,
            event_type="call_start",
            **kwargs
        )

    def log_call_end(
        self,
        call_id: str,
        business_id: str,
        duration: int,
        appointment_booked: bool = False,
        **kwargs
    ):
        self.info(
            "Call ended",
            call_id=call_id,
            business_id=business_id,
            duration=duration,
            appointment_booked=appointment_booked,
            event_type="call_end",
            **kwargs
        )


class WebhookLogger(StructuredLogger):
    """Logger for webhook events"""

    def __init__(self):
        super().__init__("callbotai.webhook")

    def log_webhook(
        self,
        source: str,
        event_type: str,
        success: bool = True,
        error: str = None,
        **kwargs
    ):
        level = "info" if success else "error"
        getattr(self, level)(
            f"Webhook: {source} - {event_type}",
            source=source,
            event_type=event_type,
            success=success,
            error=error,
            **kwargs
        )


class PaymentLogger(StructuredLogger):
    """Logger for payment events"""

    def __init__(self):
        super().__init__("callbotai.payment")

    def log_payment(
        self,
        action: str,
        business_id: str = None,
        amount: float = None,
        currency: str = "usd",
        success: bool = True,
        error: str = None,
        **kwargs
    ):
        level = "info" if success else "error"
        getattr(self, level)(
            f"Payment: {action}",
            action=action,
            business_id=business_id,
            amount=amount,
            currency=currency,
            success=success,
            error=error,
            event_type="payment",
            **kwargs
        )


# Create logger instances
request_logger = RequestLogger()
audit_logger = AuditLogger()
call_logger = CallLogger()
webhook_logger = WebhookLogger()
payment_logger = PaymentLogger()


# =============================================================================
# Decorators
# =============================================================================

def log_function_call(logger: StructuredLogger = logger):
    """Decorator to log function calls"""
    def decorator(func):
        @wraps(func)
        async def async_wrapper(*args, **kwargs):
            start_time = time.time()
            func_name = func.__name__
            logger.debug(f"Calling {func_name}", function=func_name)

            try:
                result = await func(*args, **kwargs)
                duration = (time.time() - start_time) * 1000
                logger.debug(
                    f"Completed {func_name}",
                    function=func_name,
                    duration_ms=round(duration, 2)
                )
                return result
            except Exception as e:
                duration = (time.time() - start_time) * 1000
                logger.error(
                    f"Error in {func_name}: {str(e)}",
                    function=func_name,
                    duration_ms=round(duration, 2),
                    exc_info=True
                )
                raise

        @wraps(func)
        def sync_wrapper(*args, **kwargs):
            start_time = time.time()
            func_name = func.__name__
            logger.debug(f"Calling {func_name}", function=func_name)

            try:
                result = func(*args, **kwargs)
                duration = (time.time() - start_time) * 1000
                logger.debug(
                    f"Completed {func_name}",
                    function=func_name,
                    duration_ms=round(duration, 2)
                )
                return result
            except Exception as e:
                duration = (time.time() - start_time) * 1000
                logger.error(
                    f"Error in {func_name}: {str(e)}",
                    function=func_name,
                    duration_ms=round(duration, 2),
                    exc_info=True
                )
                raise

        if asyncio.iscoroutinefunction(func):
            return async_wrapper
        return sync_wrapper

    return decorator


# =============================================================================
# Context Manager
# =============================================================================

class LogContext:
    """Context manager for adding fields to all logs within a block"""

    def __init__(self, **fields):
        self.fields = fields
        self.token = None

    def __enter__(self):
        # Store context in thread-local or similar
        return self

    def __exit__(self, exc_type, exc_val, exc_tb):
        pass


# Import asyncio for decorator
import asyncio
