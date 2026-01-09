"""
Vapi integration service
Handles automatic agent creation and management
"""

import os
import httpx
from typing import Dict, Optional

VAPI_API_KEY = os.getenv("VAPI_API_KEY", "")
VAPI_BASE_URL = "https://api.vapi.ai"


def get_headers():
    return {
        "Authorization": f"Bearer {VAPI_API_KEY}",
        "Content-Type": "application/json"
    }


def generate_system_prompt(business_data: Dict) -> str:
    """Generate a compliant system prompt based on business data"""

    name = business_data.get('agent_name', 'Alex')
    business_name = business_data.get('name', 'our business')
    industry = business_data.get('industry', 'service')
    services = business_data.get('services', '')
    hours = business_data.get('business_hours', '')
    address = business_data.get('address', '')
    service_area = business_data.get('service_area', '')

    # Structured data from form
    pricing = business_data.get('pricing', {})
    offers_financing = business_data.get('offers_financing', False)
    offers_emergency = business_data.get('offers_emergency', False)
    response_time = business_data.get('response_time', '')
    appointment_types = business_data.get('appointment_types', [])
    custom = business_data.get('custom_instructions', '')

    # Build services section
    services_text = services if isinstance(services, str) else ', '.join(services) if services else 'general services'

    # Build pricing info
    pricing_info = ""
    if pricing:
        if pricing.get('service_call'):
            pricing_info += f"- Service/diagnostic call: ${pricing['service_call']}\n"
        if pricing.get('hourly_rate'):
            pricing_info += f"- Hourly rate: ${pricing['hourly_rate']}/hour\n"
        if pricing.get('free_estimates'):
            pricing_info += "- Free estimates available for larger projects\n"

    # Build hours section
    hours_text = hours if hours else "Please ask for our current hours"

    prompt = f"""You are {name}, a professional AI assistant for {business_name}.

IMPORTANT COMPLIANCE RULES:
- You are an AI assistant. If asked directly, confirm you are an AI.
- Never pretend to be human or deceive callers about your nature.
- Be transparent and honest in all interactions.
- Do not make promises you cannot keep.
- Protect caller privacy - only collect necessary information.

ABOUT THE BUSINESS:
- Business: {business_name}
- Industry: {industry}
- Services offered: {services_text}
- Business hours: {hours_text}
{f'- Service area: {service_area}' if service_area else ''}
{f'- Address: {address}' if address else ''}

PRICING INFORMATION:
{pricing_info if pricing_info else '- Pricing varies by service. Offer to have someone provide a quote.'}
{f'- Financing available: Yes' if offers_financing else ''}
{f'- Emergency/after-hours service: Available' if offers_emergency else ''}
{f'- Typical response time: {response_time}' if response_time else ''}

YOUR PRIMARY GOALS (in order of priority):
1. Greet professionally and understand the caller's needs
2. Collect their information: full name, phone number, and email
3. BOOK AN APPOINTMENT if they want service - use the bookAppointment function
4. Answer questions about services, pricing, and availability
5. For emergencies, collect info immediately and assure them someone will call back ASAP

APPOINTMENT BOOKING:
{f'- Available appointment types: {", ".join(appointment_types)}' if appointment_types else '- General service appointments available'}
- Always confirm the appointment date, time, and service type with the caller
- Collect their preferred contact method for confirmation

CONVERSATION STYLE:
- Keep responses SHORT and conversational - this is a phone call
- Be warm, professional, and empathetic
- Listen actively and confirm understanding
- If you don't know something, say you'll have a team member follow up
- Never leave a caller without capturing their contact info and reason for calling

{f'ADDITIONAL INSTRUCTIONS:{chr(10)}{custom}' if custom else ''}

ENDING CALLS:
- Summarize what was discussed and any next steps
- Confirm appointment details if one was booked
- Thank them for calling {business_name}
- Assure them of follow-up if needed"""

    return prompt


def generate_first_message(business_data: Dict) -> str:
    """Generate a compliant first message with AI disclosure"""
    name = business_data.get('agent_name', 'Alex')
    business_name = business_data.get('name', 'us')

    # AI disclosure in greeting for compliance
    return f"Hi, thanks for calling {business_name}! This is {name}, your AI assistant. How can I help you today?"


def get_appointment_booking_tool() -> Dict:
    """Return the appointment booking function tool for Vapi"""
    return {
        "type": "function",
        "function": {
            "name": "bookAppointment",
            "description": "Book an appointment for the caller. Use this when the caller wants to schedule a service visit, consultation, or appointment.",
            "parameters": {
                "type": "object",
                "properties": {
                    "customer_name": {
                        "type": "string",
                        "description": "The full name of the customer"
                    },
                    "phone_number": {
                        "type": "string",
                        "description": "The customer's phone number"
                    },
                    "email": {
                        "type": "string",
                        "description": "The customer's email address (optional)"
                    },
                    "service_type": {
                        "type": "string",
                        "description": "The type of service or appointment requested"
                    },
                    "preferred_date": {
                        "type": "string",
                        "description": "The preferred date for the appointment"
                    },
                    "preferred_time": {
                        "type": "string",
                        "description": "The preferred time for the appointment (morning, afternoon, or specific time)"
                    },
                    "notes": {
                        "type": "string",
                        "description": "Any additional notes or details about the appointment"
                    },
                    "is_emergency": {
                        "type": "boolean",
                        "description": "Whether this is an emergency service request"
                    }
                },
                "required": ["customer_name", "phone_number", "service_type"]
            }
        }
    }


def get_transfer_call_tool() -> Dict:
    """Return the transfer call function tool"""
    return {
        "type": "function",
        "function": {
            "name": "transferCall",
            "description": "Transfer the call to a human representative when the caller specifically requests to speak with a person or for complex issues the AI cannot handle.",
            "parameters": {
                "type": "object",
                "properties": {
                    "reason": {
                        "type": "string",
                        "description": "The reason for transferring the call"
                    }
                },
                "required": ["reason"]
            }
        }
    }


async def create_assistant(business_data: Dict, webhook_url: str) -> Dict:
    """Create a Vapi assistant for a business with compliance and quick pickup"""

    system_prompt = generate_system_prompt(business_data)
    first_message = generate_first_message(business_data)

    voice_map = {
        'rachel': '21m00Tcm4TlvDq8ikWAM',  # Rachel - warm female
        'adam': 'pNInz6obpgDQGcFmaJgB',    # Adam - professional male
        'sarah': 'EXAVITQu4vr4xnSDxMaL',   # Sarah - friendly female
        'josh': 'TxGEqnHWrfWFTfGW9XjX',    # Josh - casual male
    }

    voice_id = voice_map.get(business_data.get('agent_voice', 'rachel'), voice_map['rachel'])

    payload = {
        "name": f"{business_data.get('name', 'Business')} - AI Receptionist",
        "model": {
            "provider": "openai",
            "model": "gpt-4o-mini",
            "temperature": 0.7,
            "systemPrompt": system_prompt,
            "tools": [
                get_appointment_booking_tool(),
                get_transfer_call_tool()
            ]
        },
        "voice": {
            "provider": "11labs",
            "voiceId": voice_id,
            "stability": 0.5,
            "similarityBoost": 0.75
        },
        "firstMessage": first_message,
        "firstMessageMode": "assistant-speaks-first",
        "endCallPhrases": ["goodbye", "bye", "have a great day", "take care"],
        "serverUrl": webhook_url,

        # Quick pickup settings - answer fast to catch before voicemail
        "responseDelaySeconds": 0.4,  # Start responding quickly
        "silenceTimeoutSeconds": 20,   # Shorter silence timeout
        "maxDurationSeconds": 1800,    # 30 min max

        # Call settings for quick answer
        "hipaaEnabled": False,
        "backgroundSound": "office",
        "backchannelingEnabled": True,  # Natural conversation cues
        "backgroundDenoisingEnabled": True,

        # Voicemail detection - skip voicemail, talk to humans
        "voicemailDetection": {
            "enabled": True,
            "provider": "twilio",
            "machineDetectionTimeout": 5,
            "machineDetectionSpeechThreshold": 2500,
            "machineDetectionSpeechEndThreshold": 1000
        }
    }

    async with httpx.AsyncClient() as client:
        response = await client.post(
            f"{VAPI_BASE_URL}/assistant",
            headers=get_headers(),
            json=payload,
            timeout=30.0
        )

        if response.status_code == 201:
            return {"success": True, "assistant": response.json()}
        else:
            return {"success": False, "error": response.text}


async def update_assistant(assistant_id: str, business_data: Dict) -> Dict:
    """Update an existing Vapi assistant"""

    system_prompt = generate_system_prompt(business_data)
    first_message = generate_first_message(business_data)

    payload = {
        "name": f"{business_data.get('name', 'Business')} - AI Receptionist",
        "model": {
            "systemPrompt": system_prompt,
            "tools": [
                get_appointment_booking_tool(),
                get_transfer_call_tool()
            ]
        },
        "firstMessage": first_message
    }

    async with httpx.AsyncClient() as client:
        response = await client.patch(
            f"{VAPI_BASE_URL}/assistant/{assistant_id}",
            headers=get_headers(),
            json=payload,
            timeout=30.0
        )

        if response.status_code == 200:
            return {"success": True, "assistant": response.json()}
        else:
            return {"success": False, "error": response.text}


async def delete_assistant(assistant_id: str) -> bool:
    """Delete a Vapi assistant"""
    async with httpx.AsyncClient() as client:
        response = await client.delete(
            f"{VAPI_BASE_URL}/assistant/{assistant_id}",
            headers=get_headers(),
            timeout=30.0
        )
        return response.status_code == 200


async def get_assistant(assistant_id: str) -> Optional[Dict]:
    """Get assistant details"""
    async with httpx.AsyncClient() as client:
        response = await client.get(
            f"{VAPI_BASE_URL}/assistant/{assistant_id}",
            headers=get_headers(),
            timeout=30.0
        )
        if response.status_code == 200:
            return response.json()
        return None


async def create_phone_number(assistant_id: str) -> Dict:
    """Create/buy a phone number for an assistant"""

    payload = {
        "provider": "vapi",
        "assistantId": assistant_id,
        "name": "Main Line"
    }

    async with httpx.AsyncClient() as client:
        response = await client.post(
            f"{VAPI_BASE_URL}/phone-number",
            headers=get_headers(),
            json=payload,
            timeout=30.0
        )

        if response.status_code == 201:
            return {"success": True, "phone": response.json()}
        else:
            return {"success": False, "error": response.text}


async def get_phone_numbers() -> list:
    """Get all phone numbers"""
    async with httpx.AsyncClient() as client:
        response = await client.get(
            f"{VAPI_BASE_URL}/phone-number",
            headers=get_headers(),
            timeout=30.0
        )
        if response.status_code == 200:
            return response.json()
        return []


async def make_test_call(assistant_id: str, phone_number: str) -> Dict:
    """Make a test outbound call"""

    payload = {
        "assistantId": assistant_id,
        "customer": {
            "number": phone_number
        }
    }

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
