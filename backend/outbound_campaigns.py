"""
Outbound Calling Campaigns for CallBot AI
Handles batch dialing, scheduled campaigns, and follow-up sequences
"""

import os
import asyncio
from datetime import datetime, timedelta
from typing import Dict, Optional, List, Any
from enum import Enum
import httpx
import csv
import io

VAPI_API_KEY = os.getenv("VAPI_API_KEY", "")
VAPI_BASE_URL = "https://api.vapi.ai"


class CampaignStatus(Enum):
    DRAFT = "draft"
    SCHEDULED = "scheduled"
    RUNNING = "running"
    PAUSED = "paused"
    COMPLETED = "completed"
    CANCELLED = "cancelled"


class CampaignType(Enum):
    APPOINTMENT_REMINDER = "appointment_reminder"
    FOLLOW_UP = "follow_up"
    PROMOTIONAL = "promotional"
    SURVEY = "survey"
    REACTIVATION = "reactivation"
    CUSTOM = "custom"


class CallOutcome(Enum):
    CONNECTED = "connected"
    VOICEMAIL = "voicemail"
    NO_ANSWER = "no_answer"
    BUSY = "busy"
    FAILED = "failed"
    APPOINTMENT_BOOKED = "appointment_booked"
    CALLBACK_REQUESTED = "callback_requested"
    NOT_INTERESTED = "not_interested"


def get_headers():
    return {
        "Authorization": f"Bearer {VAPI_API_KEY}",
        "Content-Type": "application/json"
    }


class Campaign:
    """Outbound calling campaign"""

    def __init__(
        self,
        campaign_id: str,
        business_id: str,
        name: str,
        campaign_type: CampaignType,
        assistant_id: str,
        contacts: List[Dict],
        settings: Dict = None
    ):
        self.id = campaign_id
        self.business_id = business_id
        self.name = name
        self.type = campaign_type
        self.assistant_id = assistant_id
        self.contacts = contacts
        self.settings = settings or {}

        # Default settings
        self.max_concurrent_calls = self.settings.get("max_concurrent_calls", 1)
        self.calls_per_minute = self.settings.get("calls_per_minute", 2)
        self.retry_attempts = self.settings.get("retry_attempts", 2)
        self.retry_delay_minutes = self.settings.get("retry_delay_minutes", 60)
        self.leave_voicemail = self.settings.get("leave_voicemail", True)
        self.voicemail_message = self.settings.get("voicemail_message", "")

        # Time restrictions
        self.start_time = self.settings.get("start_time", "09:00")
        self.end_time = self.settings.get("end_time", "20:00")
        self.timezone = self.settings.get("timezone", "America/New_York")
        self.allowed_days = self.settings.get("allowed_days", [0, 1, 2, 3, 4, 5])  # Mon-Sat

        # State
        self.status = CampaignStatus.DRAFT
        self.current_index = 0
        self.results = []


async def make_outbound_call(
    assistant_id: str,
    phone_number: str,
    customer_name: Optional[str] = None,
    metadata: Dict = None
) -> Dict:
    """Make a single outbound call via Vapi"""

    payload = {
        "assistantId": assistant_id,
        "customer": {
            "number": phone_number
        }
    }

    if customer_name:
        payload["customer"]["name"] = customer_name

    if metadata:
        payload["metadata"] = metadata

    async with httpx.AsyncClient() as client:
        response = await client.post(
            f"{VAPI_BASE_URL}/call",
            headers=get_headers(),
            json=payload,
            timeout=30.0
        )

        if response.status_code == 201:
            return {"success": True, "call": response.json()}
        else:
            return {"success": False, "error": response.text}


async def run_campaign_batch(
    campaign: Campaign,
    batch_size: int = 10,
    delay_between_calls: float = 30.0
) -> Dict:
    """Run a batch of calls from a campaign"""

    results = {
        "campaign_id": campaign.id,
        "batch_started": datetime.utcnow().isoformat(),
        "calls_attempted": 0,
        "calls_connected": 0,
        "calls_failed": 0,
        "results": []
    }

    # Get batch of contacts
    start_idx = campaign.current_index
    end_idx = min(start_idx + batch_size, len(campaign.contacts))
    batch = campaign.contacts[start_idx:end_idx]

    for contact in batch:
        phone = contact.get("phone")
        name = contact.get("name", "")

        if not phone:
            continue

        # Make the call
        call_result = await make_outbound_call(
            assistant_id=campaign.assistant_id,
            phone_number=phone,
            customer_name=name,
            metadata={
                "campaign_id": campaign.id,
                "contact_id": contact.get("id"),
                "campaign_type": campaign.type.value
            }
        )

        results["calls_attempted"] += 1

        if call_result.get("success"):
            results["calls_connected"] += 1
            results["results"].append({
                "phone": phone,
                "name": name,
                "status": "initiated",
                "call_id": call_result["call"].get("id")
            })
        else:
            results["calls_failed"] += 1
            results["results"].append({
                "phone": phone,
                "name": name,
                "status": "failed",
                "error": call_result.get("error")
            })

        # Rate limiting
        await asyncio.sleep(delay_between_calls)

    campaign.current_index = end_idx
    results["batch_completed"] = datetime.utcnow().isoformat()

    return results


def parse_contacts_csv(csv_content: str) -> List[Dict]:
    """Parse CSV content into contact list"""
    contacts = []
    reader = csv.DictReader(io.StringIO(csv_content))

    for row in reader:
        contact = {
            "name": row.get("name", row.get("Name", row.get("full_name", ""))),
            "phone": row.get("phone", row.get("Phone", row.get("phone_number", ""))),
            "email": row.get("email", row.get("Email", "")),
        }

        # Clean phone number
        if contact["phone"]:
            phone = "".join(c for c in contact["phone"] if c.isdigit() or c == "+")
            if len(phone) == 10:
                phone = "+1" + phone
            elif len(phone) == 11 and phone.startswith("1"):
                phone = "+" + phone
            contact["phone"] = phone

        if contact["phone"]:  # Only add if we have a phone number
            contacts.append(contact)

    return contacts


def generate_campaign_report(campaign: Campaign, call_outcomes: List[Dict]) -> Dict:
    """Generate analytics report for a campaign"""

    total_calls = len(call_outcomes)
    connected = sum(1 for c in call_outcomes if c.get("outcome") == CallOutcome.CONNECTED.value)
    voicemail = sum(1 for c in call_outcomes if c.get("outcome") == CallOutcome.VOICEMAIL.value)
    no_answer = sum(1 for c in call_outcomes if c.get("outcome") == CallOutcome.NO_ANSWER.value)
    appointments = sum(1 for c in call_outcomes if c.get("outcome") == CallOutcome.APPOINTMENT_BOOKED.value)

    total_duration = sum(c.get("duration", 0) for c in call_outcomes)
    avg_duration = total_duration / connected if connected > 0 else 0

    return {
        "campaign_id": campaign.id,
        "campaign_name": campaign.name,
        "total_contacts": len(campaign.contacts),
        "calls_attempted": total_calls,
        "calls_connected": connected,
        "calls_to_voicemail": voicemail,
        "calls_no_answer": no_answer,
        "appointments_booked": appointments,
        "connect_rate": round((connected / total_calls * 100) if total_calls > 0 else 0, 2),
        "conversion_rate": round((appointments / connected * 100) if connected > 0 else 0, 2),
        "total_talk_time_minutes": round(total_duration / 60, 2),
        "average_call_duration_seconds": round(avg_duration, 2),
    }


# Campaign Templates
CAMPAIGN_TEMPLATES = {
    "appointment_reminder": {
        "name": "Appointment Reminder",
        "system_prompt_addon": """
You are calling to remind {customer_name} about their upcoming appointment.
Confirm the date and time, answer any questions, and offer to reschedule if needed.
If they can't make it, try to reschedule for another time.
""",
        "first_message": "Hi, this is {agent_name} from {business_name}. I'm calling to confirm your appointment scheduled for {appointment_date}. Is this a good time to speak briefly?"
    },

    "follow_up": {
        "name": "Lead Follow-up",
        "system_prompt_addon": """
You are calling to follow up with {customer_name} who recently inquired about our services.
Your goal is to answer their questions and schedule an appointment if they're interested.
Be helpful but not pushy. If they're not interested, thank them and end the call politely.
""",
        "first_message": "Hi {customer_name}, this is {agent_name} from {business_name}. I'm following up on your recent inquiry. Do you have a few minutes to chat about how we can help you?"
    },

    "reactivation": {
        "name": "Customer Reactivation",
        "system_prompt_addon": """
You are calling {customer_name}, a past customer who hasn't used our services recently.
Mention any new services or special offers. Try to re-engage them and book an appointment.
Be friendly and remind them of the positive experience they had with us before.
""",
        "first_message": "Hi {customer_name}, this is {agent_name} from {business_name}. We noticed it's been a while since your last visit, and I wanted to check in. How have you been?"
    },

    "survey": {
        "name": "Customer Satisfaction Survey",
        "system_prompt_addon": """
You are calling to conduct a brief customer satisfaction survey.
Ask 3-5 questions about their recent experience. Be thankful for their time.
If they have complaints, acknowledge them and note them for follow-up.
""",
        "first_message": "Hi {customer_name}, this is {agent_name} from {business_name}. I'm calling to get your quick feedback on your recent experience with us. Would you have 2 minutes for a brief survey?"
    }
}


def create_campaign_assistant_prompt(
    base_prompt: str,
    campaign_type: str,
    variables: Dict
) -> str:
    """Create customized prompt for campaign calls"""

    template = CAMPAIGN_TEMPLATES.get(campaign_type, {})
    addon = template.get("system_prompt_addon", "")

    # Replace variables in addon
    for key, value in variables.items():
        addon = addon.replace(f"{{{key}}}", str(value))

    return base_prompt + "\n\n" + addon if addon else base_prompt


def create_campaign_first_message(
    campaign_type: str,
    variables: Dict
) -> str:
    """Create first message for campaign calls"""

    template = CAMPAIGN_TEMPLATES.get(campaign_type, {})
    message = template.get("first_message", "Hi, this is {agent_name} from {business_name}. How are you today?")

    # Replace variables
    for key, value in variables.items():
        message = message.replace(f"{{{key}}}", str(value))

    return message


async def schedule_campaign(
    campaign: Campaign,
    start_datetime: datetime,
    batch_size: int = 50,
    batch_interval_minutes: int = 30
) -> Dict:
    """Schedule a campaign to run at a specific time"""

    # This would integrate with a task scheduler like Celery or APScheduler
    # For now, return scheduling info

    total_batches = (len(campaign.contacts) + batch_size - 1) // batch_size
    estimated_duration = total_batches * batch_interval_minutes

    return {
        "campaign_id": campaign.id,
        "scheduled_start": start_datetime.isoformat(),
        "estimated_batches": total_batches,
        "estimated_duration_minutes": estimated_duration,
        "contacts_count": len(campaign.contacts),
        "status": CampaignStatus.SCHEDULED.value
    }


class PowerDialer:
    """Power dialer for high-volume outbound calling"""

    def __init__(
        self,
        assistant_id: str,
        max_concurrent: int = 3,
        agent_timeout_seconds: int = 30
    ):
        self.assistant_id = assistant_id
        self.max_concurrent = max_concurrent
        self.agent_timeout = agent_timeout_seconds
        self.active_calls = 0
        self.queue = []
        self.completed = []

    async def add_to_queue(self, contacts: List[Dict]):
        """Add contacts to dialing queue"""
        self.queue.extend(contacts)

    async def dial_next(self) -> Optional[Dict]:
        """Dial next number in queue"""
        if self.active_calls >= self.max_concurrent:
            return None

        if not self.queue:
            return None

        contact = self.queue.pop(0)
        self.active_calls += 1

        result = await make_outbound_call(
            assistant_id=self.assistant_id,
            phone_number=contact["phone"],
            customer_name=contact.get("name"),
            metadata=contact.get("metadata", {})
        )

        return result

    def call_completed(self, call_id: str, outcome: CallOutcome, duration: int):
        """Mark a call as completed"""
        self.active_calls -= 1
        self.completed.append({
            "call_id": call_id,
            "outcome": outcome.value,
            "duration": duration,
            "completed_at": datetime.utcnow().isoformat()
        })

    @property
    def stats(self) -> Dict:
        return {
            "queue_size": len(self.queue),
            "active_calls": self.active_calls,
            "completed_calls": len(self.completed),
            "max_concurrent": self.max_concurrent
        }
