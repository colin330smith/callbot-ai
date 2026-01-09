"""
CRM & Automation Integrations for CallBot AI
GoHighLevel, HubSpot, Salesforce, Zapier, Make
"""

import os
from datetime import datetime
from typing import Dict, Optional, List, Any
from enum import Enum
import httpx


class IntegrationType(Enum):
    GOHIGHLEVEL = "gohighlevel"
    HUBSPOT = "hubspot"
    SALESFORCE = "salesforce"
    ZAPIER = "zapier"
    MAKE = "make"
    SLACK = "slack"
    GOOGLE_CALENDAR = "google_calendar"


class IntegrationStatus(Enum):
    CONNECTED = "connected"
    DISCONNECTED = "disconnected"
    ERROR = "error"
    PENDING = "pending"


class Integration:
    """Base integration configuration"""

    def __init__(
        self,
        integration_id: str,
        business_id: str,
        integration_type: IntegrationType,
        credentials: Dict = None,
        settings: Dict = None
    ):
        self.id = integration_id
        self.business_id = business_id
        self.type = integration_type
        self.credentials = credentials or {}
        self.settings = settings or {}
        self.status = IntegrationStatus.PENDING
        self.created_at = datetime.utcnow()
        self.last_sync = None
        self.error_message = None


# =============================================================================
# GoHighLevel Integration
# =============================================================================

class GoHighLevelClient:
    """GoHighLevel API client"""

    BASE_URL = "https://rest.gohighlevel.com/v1"

    def __init__(self, api_key: str, location_id: str):
        self.api_key = api_key
        self.location_id = location_id

    def _headers(self):
        return {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json"
        }

    async def create_contact(self, contact_data: Dict) -> Dict:
        """Create a new contact in GHL"""
        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{self.BASE_URL}/contacts/",
                headers=self._headers(),
                json={
                    "locationId": self.location_id,
                    "firstName": contact_data.get("first_name", ""),
                    "lastName": contact_data.get("last_name", ""),
                    "name": contact_data.get("name", ""),
                    "phone": contact_data.get("phone", ""),
                    "email": contact_data.get("email", ""),
                    "address1": contact_data.get("address", ""),
                    "tags": contact_data.get("tags", ["AI Phone Lead"]),
                    "source": "CallBotAI",
                    "customField": contact_data.get("custom_fields", {})
                },
                timeout=30.0
            )

            if response.status_code in [200, 201]:
                return {"success": True, "contact": response.json()}
            return {"success": False, "error": response.text}

    async def update_contact(self, contact_id: str, updates: Dict) -> Dict:
        """Update an existing contact"""
        async with httpx.AsyncClient() as client:
            response = await client.put(
                f"{self.BASE_URL}/contacts/{contact_id}",
                headers=self._headers(),
                json=updates,
                timeout=30.0
            )

            if response.status_code == 200:
                return {"success": True, "contact": response.json()}
            return {"success": False, "error": response.text}

    async def add_contact_to_workflow(self, contact_id: str, workflow_id: str) -> Dict:
        """Add contact to a GHL workflow"""
        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{self.BASE_URL}/contacts/{contact_id}/workflow/{workflow_id}",
                headers=self._headers(),
                timeout=30.0
            )

            if response.status_code == 200:
                return {"success": True}
            return {"success": False, "error": response.text}

    async def create_opportunity(self, contact_id: str, pipeline_id: str, stage_id: str, opportunity_data: Dict) -> Dict:
        """Create opportunity in GHL pipeline"""
        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{self.BASE_URL}/pipelines/{pipeline_id}/opportunities",
                headers=self._headers(),
                json={
                    "locationId": self.location_id,
                    "contactId": contact_id,
                    "pipelineStageId": stage_id,
                    "name": opportunity_data.get("name", "AI Phone Lead"),
                    "monetaryValue": opportunity_data.get("value", 0),
                    "source": "CallBotAI"
                },
                timeout=30.0
            )

            if response.status_code in [200, 201]:
                return {"success": True, "opportunity": response.json()}
            return {"success": False, "error": response.text}

    async def create_task(self, contact_id: str, task_data: Dict) -> Dict:
        """Create a task for a contact"""
        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{self.BASE_URL}/contacts/{contact_id}/tasks",
                headers=self._headers(),
                json={
                    "title": task_data.get("title", "Follow up"),
                    "body": task_data.get("description", ""),
                    "dueDate": task_data.get("due_date", ""),
                    "completed": False
                },
                timeout=30.0
            )

            if response.status_code in [200, 201]:
                return {"success": True, "task": response.json()}
            return {"success": False, "error": response.text}

    async def search_contacts(self, query: str) -> Dict:
        """Search contacts by phone or email"""
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"{self.BASE_URL}/contacts/search",
                headers=self._headers(),
                params={
                    "locationId": self.location_id,
                    "query": query
                },
                timeout=30.0
            )

            if response.status_code == 200:
                return {"success": True, "contacts": response.json().get("contacts", [])}
            return {"success": False, "error": response.text}


# =============================================================================
# HubSpot Integration
# =============================================================================

class HubSpotClient:
    """HubSpot API client"""

    BASE_URL = "https://api.hubapi.com"

    def __init__(self, access_token: str):
        self.access_token = access_token

    def _headers(self):
        return {
            "Authorization": f"Bearer {self.access_token}",
            "Content-Type": "application/json"
        }

    async def create_contact(self, contact_data: Dict) -> Dict:
        """Create a new contact in HubSpot"""
        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{self.BASE_URL}/crm/v3/objects/contacts",
                headers=self._headers(),
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

            if response.status_code in [200, 201]:
                return {"success": True, "contact": response.json()}
            return {"success": False, "error": response.text}

    async def update_contact(self, contact_id: str, updates: Dict) -> Dict:
        """Update an existing contact"""
        async with httpx.AsyncClient() as client:
            response = await client.patch(
                f"{self.BASE_URL}/crm/v3/objects/contacts/{contact_id}",
                headers=self._headers(),
                json={"properties": updates},
                timeout=30.0
            )

            if response.status_code == 200:
                return {"success": True, "contact": response.json()}
            return {"success": False, "error": response.text}

    async def create_deal(self, contact_id: str, deal_data: Dict) -> Dict:
        """Create a deal in HubSpot"""
        async with httpx.AsyncClient() as client:
            # Create deal
            response = await client.post(
                f"{self.BASE_URL}/crm/v3/objects/deals",
                headers=self._headers(),
                json={
                    "properties": {
                        "dealname": deal_data.get("name", "AI Phone Lead"),
                        "amount": deal_data.get("value", 0),
                        "pipeline": deal_data.get("pipeline", "default"),
                        "dealstage": deal_data.get("stage", "appointmentscheduled"),
                        "closedate": deal_data.get("close_date")
                    }
                },
                timeout=30.0
            )

            if response.status_code not in [200, 201]:
                return {"success": False, "error": response.text}

            deal = response.json()

            # Associate with contact
            await client.put(
                f"{self.BASE_URL}/crm/v3/objects/deals/{deal['id']}/associations/contacts/{contact_id}/deal_to_contact",
                headers=self._headers(),
                timeout=30.0
            )

            return {"success": True, "deal": deal}

    async def search_contacts(self, phone: str) -> Dict:
        """Search contacts by phone"""
        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{self.BASE_URL}/crm/v3/objects/contacts/search",
                headers=self._headers(),
                json={
                    "filterGroups": [{
                        "filters": [{
                            "propertyName": "phone",
                            "operator": "EQ",
                            "value": phone
                        }]
                    }]
                },
                timeout=30.0
            )

            if response.status_code == 200:
                return {"success": True, "contacts": response.json().get("results", [])}
            return {"success": False, "error": response.text}

    async def create_note(self, contact_id: str, note_content: str) -> Dict:
        """Create a note on a contact"""
        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{self.BASE_URL}/crm/v3/objects/notes",
                headers=self._headers(),
                json={
                    "properties": {
                        "hs_note_body": note_content,
                        "hs_timestamp": datetime.utcnow().isoformat()
                    }
                },
                timeout=30.0
            )

            if response.status_code not in [200, 201]:
                return {"success": False, "error": response.text}

            note = response.json()

            # Associate with contact
            await client.put(
                f"{self.BASE_URL}/crm/v3/objects/notes/{note['id']}/associations/contacts/{contact_id}/note_to_contact",
                headers=self._headers(),
                timeout=30.0
            )

            return {"success": True, "note": note}


# =============================================================================
# Zapier/Make Webhook Integration
# =============================================================================

async def send_to_webhook(webhook_url: str, data: Dict) -> Dict:
    """Send data to any webhook URL (Zapier, Make, etc.)"""
    try:
        async with httpx.AsyncClient() as client:
            response = await client.post(
                webhook_url,
                json=data,
                timeout=30.0
            )

            return {
                "success": response.status_code in [200, 201, 202],
                "status_code": response.status_code
            }
    except Exception as e:
        return {"success": False, "error": str(e)}


# =============================================================================
# Slack Integration
# =============================================================================

class SlackClient:
    """Slack API client for notifications"""

    def __init__(self, webhook_url: str = None, bot_token: str = None):
        self.webhook_url = webhook_url
        self.bot_token = bot_token

    async def send_message(self, message: str, channel: str = None, blocks: List = None) -> Dict:
        """Send message to Slack"""
        # Use webhook URL (simpler)
        if self.webhook_url:
            async with httpx.AsyncClient() as client:
                payload = {"text": message}
                if blocks:
                    payload["blocks"] = blocks

                response = await client.post(
                    self.webhook_url,
                    json=payload,
                    timeout=30.0
                )
                return {"success": response.status_code == 200}

        # Use Bot Token (more features)
        if self.bot_token and channel:
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    "https://slack.com/api/chat.postMessage",
                    headers={"Authorization": f"Bearer {self.bot_token}"},
                    json={
                        "channel": channel,
                        "text": message,
                        "blocks": blocks
                    },
                    timeout=30.0
                )

                data = response.json()
                return {"success": data.get("ok", False), "error": data.get("error")}

        return {"success": False, "error": "No webhook URL or bot token configured"}

    def create_call_notification_blocks(self, call_data: Dict) -> List:
        """Create rich Slack blocks for call notification"""
        return [
            {
                "type": "header",
                "text": {
                    "type": "plain_text",
                    "text": "📞 New Call Completed"
                }
            },
            {
                "type": "section",
                "fields": [
                    {"type": "mrkdwn", "text": f"*Caller:*\n{call_data.get('caller_phone', 'Unknown')}"},
                    {"type": "mrkdwn", "text": f"*Duration:*\n{call_data.get('duration', 0)} seconds"},
                    {"type": "mrkdwn", "text": f"*Appointment:*\n{'✅ Booked' if call_data.get('appointment_booked') else '❌ Not booked'}"},
                    {"type": "mrkdwn", "text": f"*Time:*\n{call_data.get('timestamp', 'N/A')}"}
                ]
            },
            {
                "type": "section",
                "text": {
                    "type": "mrkdwn",
                    "text": f"*Summary:*\n{call_data.get('summary', 'No summary available')[:500]}"
                }
            }
        ]


# =============================================================================
# Integration Manager
# =============================================================================

class IntegrationManager:
    """Manages all integrations for businesses"""

    def __init__(self):
        self.integrations: Dict[str, List[Integration]] = {}  # business_id -> integrations

    def add_integration(self, integration: Integration):
        """Add an integration"""
        if integration.business_id not in self.integrations:
            self.integrations[integration.business_id] = []
        self.integrations[integration.business_id].append(integration)

    def get_integrations(self, business_id: str) -> List[Integration]:
        """Get all integrations for a business"""
        return self.integrations.get(business_id, [])

    def get_integration(self, business_id: str, integration_type: IntegrationType) -> Optional[Integration]:
        """Get specific integration by type"""
        for integration in self.get_integrations(business_id):
            if integration.type == integration_type:
                return integration
        return None

    def remove_integration(self, business_id: str, integration_id: str) -> bool:
        """Remove an integration"""
        if business_id not in self.integrations:
            return False

        for i, integration in enumerate(self.integrations[business_id]):
            if integration.id == integration_id:
                self.integrations[business_id].pop(i)
                return True
        return False

    async def sync_call_to_crm(self, business_id: str, call_data: Dict) -> List[Dict]:
        """Sync call data to all connected CRMs"""
        results = []

        for integration in self.get_integrations(business_id):
            if integration.status != IntegrationStatus.CONNECTED:
                continue

            result = {"integration": integration.type.value, "success": False}

            try:
                if integration.type == IntegrationType.GOHIGHLEVEL:
                    client = GoHighLevelClient(
                        integration.credentials.get("api_key"),
                        integration.credentials.get("location_id")
                    )
                    # Search for existing contact
                    search = await client.search_contacts(call_data.get("caller_phone", ""))
                    if search.get("success") and search.get("contacts"):
                        # Update existing
                        contact_id = search["contacts"][0]["id"]
                        await client.update_contact(contact_id, {
                            "tags": call_data.get("tags", []),
                            "customField": {"last_ai_call": datetime.utcnow().isoformat()}
                        })
                    else:
                        # Create new
                        await client.create_contact({
                            "phone": call_data.get("caller_phone"),
                            "name": call_data.get("caller_name", ""),
                            "tags": ["AI Phone Lead"]
                        })
                    result["success"] = True

                elif integration.type == IntegrationType.HUBSPOT:
                    client = HubSpotClient(integration.credentials.get("access_token"))
                    search = await client.search_contacts(call_data.get("caller_phone", ""))
                    if search.get("success") and search.get("contacts"):
                        contact_id = search["contacts"][0]["id"]
                        await client.create_note(contact_id, f"AI Phone Call Summary:\n{call_data.get('summary', '')}")
                    else:
                        await client.create_contact({
                            "phone": call_data.get("caller_phone"),
                            "first_name": call_data.get("caller_name", "").split()[0] if call_data.get("caller_name") else ""
                        })
                    result["success"] = True

                elif integration.type == IntegrationType.ZAPIER:
                    webhook_result = await send_to_webhook(
                        integration.credentials.get("webhook_url"),
                        call_data
                    )
                    result["success"] = webhook_result.get("success", False)

                elif integration.type == IntegrationType.SLACK:
                    client = SlackClient(webhook_url=integration.credentials.get("webhook_url"))
                    blocks = client.create_call_notification_blocks(call_data)
                    slack_result = await client.send_message(
                        f"New call from {call_data.get('caller_phone')}",
                        blocks=blocks
                    )
                    result["success"] = slack_result.get("success", False)

            except Exception as e:
                result["error"] = str(e)

            results.append(result)
            integration.last_sync = datetime.utcnow()

        return results


# Global integration manager
integration_manager = IntegrationManager()
