"""
SMS Service for CallBot AI
Handles missed call text-back, follow-up sequences, and notifications
Supports Twilio and Vonage (Nexmo) as providers
"""

import os
import asyncio
from datetime import datetime, timedelta
from typing import Dict, Optional, List, Any
from enum import Enum
import httpx
import json

# Configuration
SMS_PROVIDER = os.getenv("SMS_PROVIDER", "twilio")  # twilio, vonage
TWILIO_ACCOUNT_SID = os.getenv("TWILIO_ACCOUNT_SID", "")
TWILIO_AUTH_TOKEN = os.getenv("TWILIO_AUTH_TOKEN", "")
TWILIO_PHONE_NUMBER = os.getenv("TWILIO_PHONE_NUMBER", "")
VONAGE_API_KEY = os.getenv("VONAGE_API_KEY", "")
VONAGE_API_SECRET = os.getenv("VONAGE_API_SECRET", "")
VONAGE_PHONE_NUMBER = os.getenv("VONAGE_PHONE_NUMBER", "")


class SMSStatus(Enum):
    QUEUED = "queued"
    SENT = "sent"
    DELIVERED = "delivered"
    FAILED = "failed"


class SMSType(Enum):
    MISSED_CALL_TEXTBACK = "missed_call_textback"
    APPOINTMENT_REMINDER = "appointment_reminder"
    FOLLOW_UP = "follow_up"
    NOTIFICATION = "notification"
    MARKETING = "marketing"


# SMS Templates
SMS_TEMPLATES = {
    "missed_call_textback": """Hi! This is {business_name}. We noticed you just called but couldn't connect. How can we help you today? Reply to this message or call us back at {callback_number}.""",

    "missed_call_textback_after_hours": """Hi! Thanks for calling {business_name}. We're currently closed but will get back to you first thing tomorrow. Is there anything urgent we can help with? Reply here and we'll respond ASAP.""",

    "appointment_confirmation": """Your appointment with {business_name} is confirmed for {date} at {time}. Reply CONFIRM to confirm or RESCHEDULE to change. Questions? Reply here!""",

    "appointment_reminder_24h": """Reminder: Your appointment with {business_name} is tomorrow at {time}. Reply CONFIRM to confirm or RESCHEDULE to change.""",

    "appointment_reminder_1h": """Reminder: Your appointment with {business_name} is in 1 hour ({time}). See you soon! Address: {address}""",

    "follow_up_day_1": """Hi {customer_name}! It's {agent_name} from {business_name}. Just checking in - did you have any questions about what we discussed? Happy to help!""",

    "follow_up_day_3": """Hi {customer_name}! Following up from our recent conversation. Would you like to schedule an appointment? Reply YES and I'll find a time that works for you.""",

    "follow_up_day_7": """Hi {customer_name}! We haven't heard from you in a bit. Just wanted to make sure you know we're here if you need us. {business_name} - Reply STOP to opt out.""",

    "quote_follow_up": """Hi {customer_name}! This is {business_name}. Did you have a chance to review the quote we discussed? Any questions? Reply here or call {callback_number}.""",

    "thank_you": """Thank you for choosing {business_name}! We appreciate your business. Questions? Reply here anytime.""",
}


async def send_sms_twilio(to_number: str, message: str, from_number: Optional[str] = None) -> Dict:
    """Send SMS via Twilio"""
    if not TWILIO_ACCOUNT_SID or not TWILIO_AUTH_TOKEN:
        return {"success": False, "error": "Twilio not configured"}

    from_num = from_number or TWILIO_PHONE_NUMBER
    url = f"https://api.twilio.com/2010-04-01/Accounts/{TWILIO_ACCOUNT_SID}/Messages.json"

    async with httpx.AsyncClient() as client:
        response = await client.post(
            url,
            auth=(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN),
            data={
                "To": to_number,
                "From": from_num,
                "Body": message
            },
            timeout=30.0
        )

        if response.status_code in [200, 201]:
            data = response.json()
            return {
                "success": True,
                "message_id": data.get("sid"),
                "status": data.get("status"),
                "provider": "twilio"
            }
        else:
            return {
                "success": False,
                "error": response.text,
                "status_code": response.status_code,
                "provider": "twilio"
            }


async def send_sms_vonage(to_number: str, message: str, from_number: Optional[str] = None) -> Dict:
    """Send SMS via Vonage (Nexmo)"""
    if not VONAGE_API_KEY or not VONAGE_API_SECRET:
        return {"success": False, "error": "Vonage not configured"}

    from_num = from_number or VONAGE_PHONE_NUMBER
    url = "https://rest.nexmo.com/sms/json"

    async with httpx.AsyncClient() as client:
        response = await client.post(
            url,
            json={
                "api_key": VONAGE_API_KEY,
                "api_secret": VONAGE_API_SECRET,
                "to": to_number.replace("+", ""),
                "from": from_num.replace("+", ""),
                "text": message
            },
            timeout=30.0
        )

        if response.status_code == 200:
            data = response.json()
            messages = data.get("messages", [{}])
            if messages and messages[0].get("status") == "0":
                return {
                    "success": True,
                    "message_id": messages[0].get("message-id"),
                    "status": "sent",
                    "provider": "vonage"
                }
            else:
                return {
                    "success": False,
                    "error": messages[0].get("error-text", "Unknown error"),
                    "provider": "vonage"
                }
        else:
            return {
                "success": False,
                "error": response.text,
                "status_code": response.status_code,
                "provider": "vonage"
            }


async def send_sms(
    to_number: str,
    message: str,
    from_number: Optional[str] = None,
    provider: Optional[str] = None
) -> Dict:
    """Send SMS using configured provider"""
    provider = provider or SMS_PROVIDER

    # Clean phone number
    to_number = clean_phone_number(to_number)
    if not to_number:
        return {"success": False, "error": "Invalid phone number"}

    # Truncate message if too long (160 chars standard, 1600 for concatenated)
    if len(message) > 1600:
        message = message[:1597] + "..."

    if provider == "twilio":
        return await send_sms_twilio(to_number, message, from_number)
    elif provider == "vonage":
        return await send_sms_vonage(to_number, message, from_number)
    else:
        return {"success": False, "error": f"Unknown SMS provider: {provider}"}


def clean_phone_number(phone: str) -> str:
    """Clean and format phone number to E.164 format"""
    if not phone:
        return ""

    # Remove all non-numeric characters except +
    cleaned = "".join(c for c in phone if c.isdigit() or c == "+")

    # Add + prefix if not present and looks like US number
    if not cleaned.startswith("+"):
        if len(cleaned) == 10:
            cleaned = "+1" + cleaned
        elif len(cleaned) == 11 and cleaned.startswith("1"):
            cleaned = "+" + cleaned

    return cleaned


def render_template(template_name: str, variables: Dict[str, Any]) -> str:
    """Render an SMS template with variables"""
    template = SMS_TEMPLATES.get(template_name, "")
    if not template:
        return ""

    try:
        return template.format(**variables)
    except KeyError as e:
        # Return template with missing variable placeholder
        return template


async def send_missed_call_textback(
    business_id: str,
    business_name: str,
    caller_phone: str,
    callback_number: str,
    is_after_hours: bool = False,
    delay_seconds: int = 30
) -> Dict:
    """Send automatic text-back for missed calls - speed to lead!"""

    # Small delay to avoid texting if they call right back
    if delay_seconds > 0:
        await asyncio.sleep(delay_seconds)

    template = "missed_call_textback_after_hours" if is_after_hours else "missed_call_textback"
    message = render_template(template, {
        "business_name": business_name,
        "callback_number": callback_number
    })

    result = await send_sms(caller_phone, message)
    result["type"] = SMSType.MISSED_CALL_TEXTBACK.value
    result["business_id"] = business_id

    return result


async def send_appointment_confirmation(
    customer_phone: str,
    business_name: str,
    appointment_date: str,
    appointment_time: str
) -> Dict:
    """Send appointment confirmation SMS"""
    message = render_template("appointment_confirmation", {
        "business_name": business_name,
        "date": appointment_date,
        "time": appointment_time
    })

    result = await send_sms(customer_phone, message)
    result["type"] = SMSType.APPOINTMENT_REMINDER.value

    return result


async def send_appointment_reminder(
    customer_phone: str,
    business_name: str,
    appointment_time: str,
    address: str = "",
    reminder_type: str = "24h"
) -> Dict:
    """Send appointment reminder SMS"""
    template = f"appointment_reminder_{reminder_type}"
    message = render_template(template, {
        "business_name": business_name,
        "time": appointment_time,
        "address": address
    })

    result = await send_sms(customer_phone, message)
    result["type"] = SMSType.APPOINTMENT_REMINDER.value

    return result


class FollowUpSequence:
    """Manages automated follow-up SMS sequences"""

    def __init__(self, business_id: str, business_name: str, agent_name: str, callback_number: str):
        self.business_id = business_id
        self.business_name = business_name
        self.agent_name = agent_name
        self.callback_number = callback_number
        self.sequence = [
            {"delay_days": 1, "template": "follow_up_day_1"},
            {"delay_days": 3, "template": "follow_up_day_3"},
            {"delay_days": 7, "template": "follow_up_day_7"},
        ]

    async def send_step(
        self,
        customer_phone: str,
        customer_name: str,
        step_index: int = 0
    ) -> Dict:
        """Send a specific step in the follow-up sequence"""
        if step_index >= len(self.sequence):
            return {"success": False, "error": "Sequence complete"}

        step = self.sequence[step_index]
        message = render_template(step["template"], {
            "customer_name": customer_name,
            "agent_name": self.agent_name,
            "business_name": self.business_name,
            "callback_number": self.callback_number
        })

        result = await send_sms(customer_phone, message)
        result["type"] = SMSType.FOLLOW_UP.value
        result["step"] = step_index
        result["next_step_days"] = self.sequence[step_index + 1]["delay_days"] if step_index + 1 < len(self.sequence) else None

        return result


async def send_custom_sms(
    to_number: str,
    message: str,
    business_id: str,
    sms_type: SMSType = SMSType.NOTIFICATION
) -> Dict:
    """Send a custom SMS message"""
    result = await send_sms(to_number, message)
    result["type"] = sms_type.value
    result["business_id"] = business_id
    return result


# Batch SMS for campaigns
async def send_batch_sms(
    recipients: List[Dict[str, str]],
    message_template: str,
    business_id: str,
    rate_limit_per_second: float = 1.0
) -> Dict:
    """Send SMS to multiple recipients with rate limiting"""
    results = {
        "total": len(recipients),
        "sent": 0,
        "failed": 0,
        "errors": []
    }

    delay = 1.0 / rate_limit_per_second

    for recipient in recipients:
        phone = recipient.get("phone")
        name = recipient.get("name", "there")

        # Personalize message
        message = message_template.replace("{name}", name)
        message = message.replace("{customer_name}", name)

        result = await send_sms(phone, message)

        if result.get("success"):
            results["sent"] += 1
        else:
            results["failed"] += 1
            results["errors"].append({
                "phone": phone,
                "error": result.get("error")
            })

        await asyncio.sleep(delay)

    return results


def is_valid_phone_for_sms(phone: str) -> bool:
    """Check if phone number is valid for SMS"""
    cleaned = clean_phone_number(phone)
    return len(cleaned) >= 10 and cleaned.startswith("+")


def check_opt_out_keywords(message: str) -> bool:
    """Check if message contains opt-out keywords"""
    opt_out_keywords = ["stop", "unsubscribe", "cancel", "quit", "end"]
    message_lower = message.lower().strip()
    return message_lower in opt_out_keywords


def check_opt_in_keywords(message: str) -> bool:
    """Check if message contains opt-in keywords"""
    opt_in_keywords = ["start", "subscribe", "yes", "unstop"]
    message_lower = message.lower().strip()
    return message_lower in opt_in_keywords
