"""
Webhook Automations for CallBot AI
Trigger external actions based on call outcomes, appointments, and events
"""

import os
import hmac
import hashlib
import asyncio
from datetime import datetime
from typing import Dict, Optional, List, Any, Callable
from enum import Enum
import httpx
import json

WEBHOOK_TIMEOUT = 30
MAX_RETRIES = 3
RETRY_DELAYS = [5, 30, 120]  # seconds


class WebhookEventType(Enum):
    # Call events
    CALL_STARTED = "call.started"
    CALL_ENDED = "call.ended"
    CALL_MISSED = "call.missed"
    CALL_TRANSFERRED = "call.transferred"

    # Appointment events
    APPOINTMENT_BOOKED = "appointment.booked"
    APPOINTMENT_CONFIRMED = "appointment.confirmed"
    APPOINTMENT_CANCELLED = "appointment.cancelled"
    APPOINTMENT_RESCHEDULED = "appointment.rescheduled"
    APPOINTMENT_REMINDER = "appointment.reminder"

    # Lead events
    LEAD_CREATED = "lead.created"
    LEAD_QUALIFIED = "lead.qualified"
    LEAD_CONVERTED = "lead.converted"

    # SMS events
    SMS_SENT = "sms.sent"
    SMS_RECEIVED = "sms.received"
    SMS_OPT_OUT = "sms.opt_out"

    # Campaign events
    CAMPAIGN_STARTED = "campaign.started"
    CAMPAIGN_COMPLETED = "campaign.completed"

    # Custom
    CUSTOM = "custom"


class WebhookDeliveryStatus(Enum):
    PENDING = "pending"
    DELIVERED = "delivered"
    FAILED = "failed"
    RETRYING = "retrying"


class WebhookEndpoint:
    """Configured webhook endpoint"""

    def __init__(
        self,
        endpoint_id: str,
        business_id: str,
        url: str,
        events: List[WebhookEventType],
        secret: Optional[str] = None,
        headers: Dict[str, str] = None,
        active: bool = True
    ):
        self.id = endpoint_id
        self.business_id = business_id
        self.url = url
        self.events = events
        self.secret = secret or hashlib.sha256(os.urandom(32)).hexdigest()
        self.headers = headers or {}
        self.active = active
        self.created_at = datetime.utcnow()
        self.last_triggered = None
        self.success_count = 0
        self.failure_count = 0


class WebhookDelivery:
    """Record of a webhook delivery attempt"""

    def __init__(
        self,
        delivery_id: str,
        endpoint_id: str,
        event_type: WebhookEventType,
        payload: Dict
    ):
        self.id = delivery_id
        self.endpoint_id = endpoint_id
        self.event_type = event_type
        self.payload = payload
        self.status = WebhookDeliveryStatus.PENDING
        self.attempts = 0
        self.response_code = None
        self.response_body = None
        self.error = None
        self.created_at = datetime.utcnow()
        self.delivered_at = None


def generate_webhook_signature(payload: str, secret: str) -> str:
    """Generate HMAC signature for webhook payload"""
    return hmac.new(
        secret.encode(),
        payload.encode(),
        hashlib.sha256
    ).hexdigest()


def verify_webhook_signature(payload: str, signature: str, secret: str) -> bool:
    """Verify webhook signature"""
    expected = generate_webhook_signature(payload, secret)
    return hmac.compare_digest(expected, signature)


async def deliver_webhook(
    endpoint: WebhookEndpoint,
    event_type: WebhookEventType,
    payload: Dict
) -> Dict:
    """Deliver a webhook to an endpoint"""

    # Add metadata to payload
    delivery_payload = {
        "event": event_type.value,
        "timestamp": datetime.utcnow().isoformat(),
        "business_id": endpoint.business_id,
        "data": payload
    }

    payload_json = json.dumps(delivery_payload)

    # Generate signature
    signature = generate_webhook_signature(payload_json, endpoint.secret)

    # Prepare headers
    headers = {
        "Content-Type": "application/json",
        "X-CallBotAI-Signature": signature,
        "X-CallBotAI-Event": event_type.value,
        "X-CallBotAI-Timestamp": datetime.utcnow().isoformat(),
        **endpoint.headers
    }

    # Deliver with retries
    last_error = None
    for attempt in range(MAX_RETRIES):
        try:
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    endpoint.url,
                    content=payload_json,
                    headers=headers,
                    timeout=WEBHOOK_TIMEOUT
                )

                if response.status_code in [200, 201, 202, 204]:
                    endpoint.success_count += 1
                    endpoint.last_triggered = datetime.utcnow()
                    return {
                        "success": True,
                        "status_code": response.status_code,
                        "attempts": attempt + 1
                    }
                else:
                    last_error = f"HTTP {response.status_code}: {response.text[:200]}"

        except Exception as e:
            last_error = str(e)

        # Wait before retry (if not last attempt)
        if attempt < MAX_RETRIES - 1:
            await asyncio.sleep(RETRY_DELAYS[attempt])

    endpoint.failure_count += 1
    return {
        "success": False,
        "error": last_error,
        "attempts": MAX_RETRIES
    }


class WebhookManager:
    """Manages webhooks for all businesses"""

    def __init__(self):
        self.endpoints: Dict[str, List[WebhookEndpoint]] = {}  # business_id -> endpoints
        self.delivery_history: List[WebhookDelivery] = []

    def register_endpoint(self, endpoint: WebhookEndpoint):
        """Register a webhook endpoint"""
        if endpoint.business_id not in self.endpoints:
            self.endpoints[endpoint.business_id] = []
        self.endpoints[endpoint.business_id].append(endpoint)

    def remove_endpoint(self, business_id: str, endpoint_id: str) -> bool:
        """Remove a webhook endpoint"""
        if business_id not in self.endpoints:
            return False

        for i, ep in enumerate(self.endpoints[business_id]):
            if ep.id == endpoint_id:
                self.endpoints[business_id].pop(i)
                return True
        return False

    def get_endpoints(self, business_id: str) -> List[WebhookEndpoint]:
        """Get all endpoints for a business"""
        return self.endpoints.get(business_id, [])

    async def trigger_event(
        self,
        business_id: str,
        event_type: WebhookEventType,
        payload: Dict
    ) -> List[Dict]:
        """Trigger webhooks for an event"""

        endpoints = self.get_endpoints(business_id)
        results = []

        for endpoint in endpoints:
            if not endpoint.active:
                continue

            if event_type not in endpoint.events:
                continue

            result = await deliver_webhook(endpoint, event_type, payload)
            result["endpoint_id"] = endpoint.id
            result["endpoint_url"] = endpoint.url
            results.append(result)

        return results


# Global webhook manager
webhook_manager = WebhookManager()


# Pre-built automation actions
async def action_send_to_zapier(zapier_webhook_url: str, data: Dict) -> Dict:
    """Send data to a Zapier webhook"""
    try:
        async with httpx.AsyncClient() as client:
            response = await client.post(
                zapier_webhook_url,
                json=data,
                timeout=30.0
            )
            return {"success": response.status_code == 200, "status_code": response.status_code}
    except Exception as e:
        return {"success": False, "error": str(e)}


async def action_send_to_make(make_webhook_url: str, data: Dict) -> Dict:
    """Send data to a Make (Integromat) webhook"""
    try:
        async with httpx.AsyncClient() as client:
            response = await client.post(
                make_webhook_url,
                json=data,
                timeout=30.0
            )
            return {"success": response.status_code == 200, "status_code": response.status_code}
    except Exception as e:
        return {"success": False, "error": str(e)}


async def action_create_ghl_contact(
    ghl_api_key: str,
    location_id: str,
    contact_data: Dict
) -> Dict:
    """Create contact in GoHighLevel"""
    try:
        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"https://rest.gohighlevel.com/v1/contacts/",
                headers={
                    "Authorization": f"Bearer {ghl_api_key}",
                    "Content-Type": "application/json"
                },
                json={
                    "locationId": location_id,
                    "firstName": contact_data.get("first_name", ""),
                    "lastName": contact_data.get("last_name", ""),
                    "phone": contact_data.get("phone", ""),
                    "email": contact_data.get("email", ""),
                    "tags": contact_data.get("tags", ["AI Phone Lead"]),
                    "source": "CallBotAI"
                },
                timeout=30.0
            )
            return {"success": response.status_code in [200, 201], "data": response.json() if response.status_code in [200, 201] else None}
    except Exception as e:
        return {"success": False, "error": str(e)}


async def action_create_hubspot_contact(
    hubspot_api_key: str,
    contact_data: Dict
) -> Dict:
    """Create contact in HubSpot"""
    try:
        async with httpx.AsyncClient() as client:
            response = await client.post(
                "https://api.hubapi.com/crm/v3/objects/contacts",
                headers={
                    "Authorization": f"Bearer {hubspot_api_key}",
                    "Content-Type": "application/json"
                },
                json={
                    "properties": {
                        "firstname": contact_data.get("first_name", ""),
                        "lastname": contact_data.get("last_name", ""),
                        "phone": contact_data.get("phone", ""),
                        "email": contact_data.get("email", ""),
                        "hs_lead_status": "NEW",
                        "leadsource": "AI Phone"
                    }
                },
                timeout=30.0
            )
            return {"success": response.status_code in [200, 201], "data": response.json() if response.status_code in [200, 201] else None}
    except Exception as e:
        return {"success": False, "error": str(e)}


class AutomationRule:
    """Automation rule that triggers actions based on conditions"""

    def __init__(
        self,
        rule_id: str,
        business_id: str,
        name: str,
        trigger_event: WebhookEventType,
        conditions: List[Dict] = None,
        actions: List[Dict] = None,
        active: bool = True
    ):
        self.id = rule_id
        self.business_id = business_id
        self.name = name
        self.trigger_event = trigger_event
        self.conditions = conditions or []
        self.actions = actions or []
        self.active = active

    def check_conditions(self, payload: Dict) -> bool:
        """Check if all conditions are met"""
        for condition in self.conditions:
            field = condition.get("field")
            operator = condition.get("operator")
            value = condition.get("value")

            actual = payload.get(field)

            if operator == "equals" and actual != value:
                return False
            elif operator == "not_equals" and actual == value:
                return False
            elif operator == "contains" and value not in str(actual):
                return False
            elif operator == "greater_than" and not (actual and actual > value):
                return False
            elif operator == "less_than" and not (actual and actual < value):
                return False
            elif operator == "exists" and actual is None:
                return False

        return True


# Pre-built automation templates
AUTOMATION_TEMPLATES = {
    "missed_call_to_ghl": {
        "name": "Missed Call → GoHighLevel Contact",
        "trigger_event": WebhookEventType.CALL_MISSED,
        "actions": [
            {"type": "create_ghl_contact", "tags": ["Missed Call", "Needs Follow-up"]}
        ]
    },
    "appointment_to_zapier": {
        "name": "New Appointment → Zapier",
        "trigger_event": WebhookEventType.APPOINTMENT_BOOKED,
        "actions": [
            {"type": "send_to_zapier"}
        ]
    },
    "lead_to_hubspot": {
        "name": "New Lead → HubSpot",
        "trigger_event": WebhookEventType.LEAD_CREATED,
        "actions": [
            {"type": "create_hubspot_contact"}
        ]
    },
    "call_ended_notification": {
        "name": "Call Ended → Slack Notification",
        "trigger_event": WebhookEventType.CALL_ENDED,
        "conditions": [
            {"field": "duration", "operator": "greater_than", "value": 60}
        ],
        "actions": [
            {"type": "send_to_webhook", "url_field": "slack_webhook_url"}
        ]
    }
}
