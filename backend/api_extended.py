"""
Extended API Routes for CallBot AI
New features: SMS, Campaigns, Agency, Integrations, Analytics, Widget, Knowledge Base
"""

import os
from datetime import datetime
from typing import Dict, Any, Optional, List

from fastapi import APIRouter, HTTPException, Request, BackgroundTasks, UploadFile, File
from fastapi.responses import JSONResponse, Response
from pydantic import BaseModel, EmailStr

# Import services
from sms_service import (
    send_sms, send_missed_call_textback, send_appointment_confirmation,
    send_appointment_reminder, FollowUpSequence, send_batch_sms,
    clean_phone_number, is_valid_phone_for_sms
)
from outbound_campaigns import (
    Campaign, CampaignType, CampaignStatus, make_outbound_call,
    run_campaign_batch, parse_contacts_csv, generate_campaign_report,
    CAMPAIGN_TEMPLATES, PowerDialer
)
from knowledge_base import (
    KnowledgeBase, KnowledgeBaseEntry, process_uploaded_file,
    scrape_website_content, kb_manager
)
from webhook_automations import (
    WebhookEndpoint, WebhookEventType, webhook_manager, deliver_webhook
)
from agency_service import (
    Agency, AgencyTier, SubAccount, agency_manager,
    create_agency_subscription, generate_agency_api_key,
    get_white_label_config, update_agency_branding
)
from integrations import (
    Integration, IntegrationType, IntegrationStatus,
    GoHighLevelClient, HubSpotClient, SlackClient,
    integration_manager, send_to_webhook
)
from analytics_service import (
    CallAnalytics, ROIAnalytics, LeadScoring, DashboardMetrics,
    get_analytics_dashboard, TimeRange
)
from web_widget import (
    WidgetConfig, WidgetType, widget_manager,
    generate_embed_code, generate_widget_loader_js
)
from multilingual import (
    SupportedLanguage, get_supported_languages, MultilingualAgent,
    generate_multilingual_system_prompt, generate_multilingual_first_message
)
from logging_service import logger

# Create router
router = APIRouter()


# =============================================================================
# Request Models
# =============================================================================

class SMSRequest(BaseModel):
    phone: str
    message: str
    sms_type: Optional[str] = "notification"


class CampaignCreateRequest(BaseModel):
    name: str
    campaign_type: str
    assistant_id: Optional[str] = None
    settings: Optional[Dict] = None


class CampaignContactsUpload(BaseModel):
    csv_content: str


class IntegrationCreateRequest(BaseModel):
    integration_type: str
    credentials: Dict
    settings: Optional[Dict] = None


class WebhookCreateRequest(BaseModel):
    url: str
    events: List[str]


class KnowledgeBaseEntryRequest(BaseModel):
    title: str
    content: str
    category: Optional[str] = "general"


class WidgetCreateRequest(BaseModel):
    widget_type: Optional[str] = "full"
    appearance: Optional[Dict] = None
    behavior: Optional[Dict] = None


class AgencyCreateRequest(BaseModel):
    name: str
    tier: Optional[str] = "starter"


class SubAccountCreateRequest(BaseModel):
    client_name: str
    client_email: EmailStr
    monthly_price: Optional[float] = 497


class WidgetCallRequest(BaseModel):
    name: str
    phone: str
    email: Optional[str] = None
    message: Optional[str] = None


# =============================================================================
# SMS Endpoints
# =============================================================================

@router.post("/api/business/{business_id}/sms/send")
async def send_sms_endpoint(business_id: str, data: SMSRequest, request: Request):
    """Send a single SMS"""
    # Auth check would happen here
    result = await send_sms(data.phone, data.message)
    return result


@router.post("/api/business/{business_id}/sms/batch")
async def send_batch_sms_endpoint(
    business_id: str,
    request: Request,
    background_tasks: BackgroundTasks
):
    """Send batch SMS"""
    body = await request.json()
    recipients = body.get("recipients", [])
    message_template = body.get("message", "")

    if not recipients or not message_template:
        raise HTTPException(status_code=400, detail="Recipients and message required")

    # Run in background
    background_tasks.add_task(
        send_batch_sms,
        recipients,
        message_template,
        business_id
    )

    return {"success": True, "message": f"Sending SMS to {len(recipients)} recipients"}


@router.get("/api/business/{business_id}/sms/history")
async def get_sms_history(business_id: str, request: Request, limit: int = 50):
    """Get SMS history for business"""
    # Would fetch from database
    return {"sms_logs": [], "total": 0}


# =============================================================================
# Campaign Endpoints
# =============================================================================

@router.post("/api/business/{business_id}/campaigns")
async def create_campaign(business_id: str, data: CampaignCreateRequest, request: Request):
    """Create a new outbound campaign"""
    import secrets

    campaign = Campaign(
        campaign_id=f"camp_{secrets.token_hex(8)}",
        business_id=business_id,
        name=data.name,
        campaign_type=CampaignType(data.campaign_type),
        assistant_id=data.assistant_id or "",
        contacts=[],
        settings=data.settings
    )

    return {
        "success": True,
        "campaign_id": campaign.id,
        "status": campaign.status.value
    }


@router.post("/api/business/{business_id}/campaigns/{campaign_id}/contacts")
async def upload_campaign_contacts(
    business_id: str,
    campaign_id: str,
    data: CampaignContactsUpload,
    request: Request
):
    """Upload contacts to a campaign"""
    contacts = parse_contacts_csv(data.csv_content)

    return {
        "success": True,
        "contacts_added": len(contacts),
        "sample": contacts[:5] if contacts else []
    }


@router.post("/api/business/{business_id}/campaigns/{campaign_id}/start")
async def start_campaign(
    business_id: str,
    campaign_id: str,
    request: Request,
    background_tasks: BackgroundTasks
):
    """Start a campaign"""
    return {
        "success": True,
        "message": "Campaign started",
        "campaign_id": campaign_id
    }


@router.get("/api/business/{business_id}/campaigns/{campaign_id}/report")
async def get_campaign_report(business_id: str, campaign_id: str, request: Request):
    """Get campaign analytics report"""
    return {
        "campaign_id": campaign_id,
        "total_contacts": 0,
        "calls_attempted": 0,
        "calls_connected": 0,
        "appointments_booked": 0,
        "connect_rate": 0,
        "conversion_rate": 0
    }


@router.get("/api/campaign-templates")
async def get_campaign_templates():
    """Get available campaign templates"""
    return {"templates": CAMPAIGN_TEMPLATES}


# =============================================================================
# Knowledge Base Endpoints
# =============================================================================

@router.get("/api/business/{business_id}/knowledge-base")
async def get_knowledge_base(business_id: str, request: Request):
    """Get knowledge base entries"""
    kb = kb_manager.get_or_create(business_id)
    return {
        "entries": [
            {
                "id": e.id,
                "title": e.title,
                "category": e.category,
                "source_type": e.source_type,
                "created_at": e.created_at.isoformat()
            }
            for e in kb.entries
        ],
        "stats": kb.stats
    }


@router.post("/api/business/{business_id}/knowledge-base")
async def add_knowledge_entry(
    business_id: str,
    data: KnowledgeBaseEntryRequest,
    request: Request
):
    """Add entry to knowledge base"""
    import secrets

    kb = kb_manager.get_or_create(business_id)
    entry = KnowledgeBaseEntry(
        entry_id=f"kb_{secrets.token_hex(8)}",
        business_id=business_id,
        title=data.title,
        content=data.content,
        category=data.category
    )

    kb.add_entry(entry)

    return {
        "success": True,
        "entry_id": entry.id
    }


@router.post("/api/business/{business_id}/knowledge-base/upload")
async def upload_knowledge_file(
    business_id: str,
    file: UploadFile = File(...),
    request: Request = None
):
    """Upload file to knowledge base"""
    content = await file.read()
    result = process_uploaded_file(file.filename, content, business_id)

    if not result["success"]:
        raise HTTPException(status_code=400, detail=result["error"])

    # Add to knowledge base
    import secrets
    kb = kb_manager.get_or_create(business_id)
    entry = KnowledgeBaseEntry(
        entry_id=f"kb_{secrets.token_hex(8)}",
        business_id=business_id,
        title=file.filename,
        content=result["content"],
        category="upload",
        source_type="upload"
    )
    kb.add_entry(entry)

    return {
        "success": True,
        "entry_id": entry.id,
        "filename": file.filename,
        "chars_extracted": result["extracted_chars"]
    }


@router.post("/api/business/{business_id}/knowledge-base/scrape")
async def scrape_website(business_id: str, request: Request):
    """Scrape website for knowledge base"""
    body = await request.json()
    url = body.get("url")

    if not url:
        raise HTTPException(status_code=400, detail="URL required")

    result = await scrape_website_content(url)

    if not result["success"]:
        raise HTTPException(status_code=400, detail=result["error"])

    return result


# =============================================================================
# Integration Endpoints
# =============================================================================

@router.get("/api/business/{business_id}/integrations")
async def get_integrations(business_id: str, request: Request):
    """Get all integrations for business"""
    integrations = integration_manager.get_integrations(business_id)
    return {
        "integrations": [
            {
                "id": i.id,
                "type": i.type.value,
                "status": i.status.value,
                "last_sync": i.last_sync.isoformat() if i.last_sync else None
            }
            for i in integrations
        ]
    }


@router.post("/api/business/{business_id}/integrations")
async def create_integration(
    business_id: str,
    data: IntegrationCreateRequest,
    request: Request
):
    """Create new integration"""
    import secrets

    integration = Integration(
        integration_id=f"int_{secrets.token_hex(8)}",
        business_id=business_id,
        integration_type=IntegrationType(data.integration_type),
        credentials=data.credentials,
        settings=data.settings
    )
    integration.status = IntegrationStatus.CONNECTED

    integration_manager.add_integration(integration)

    return {
        "success": True,
        "integration_id": integration.id
    }


@router.post("/api/business/{business_id}/integrations/{integration_id}/test")
async def test_integration(business_id: str, integration_id: str, request: Request):
    """Test an integration connection"""
    integration = integration_manager.get_integration(
        business_id,
        IntegrationType(integration_id.split("_")[0]) if "_" in integration_id else IntegrationType.ZAPIER
    )

    if not integration:
        raise HTTPException(status_code=404, detail="Integration not found")

    return {"success": True, "status": "connected"}


@router.delete("/api/business/{business_id}/integrations/{integration_id}")
async def delete_integration(business_id: str, integration_id: str, request: Request):
    """Delete an integration"""
    success = integration_manager.remove_integration(business_id, integration_id)
    return {"success": success}


# =============================================================================
# Webhook Endpoints
# =============================================================================

@router.get("/api/business/{business_id}/webhooks")
async def get_webhooks(business_id: str, request: Request):
    """Get webhook configurations"""
    endpoints = webhook_manager.get_endpoints(business_id)
    return {
        "webhooks": [
            {
                "id": e.id,
                "url": e.url,
                "events": [ev.value for ev in e.events],
                "active": e.active,
                "success_count": e.success_count,
                "failure_count": e.failure_count
            }
            for e in endpoints
        ]
    }


@router.post("/api/business/{business_id}/webhooks")
async def create_webhook(business_id: str, data: WebhookCreateRequest, request: Request):
    """Create webhook endpoint"""
    import secrets

    endpoint = WebhookEndpoint(
        endpoint_id=f"wh_{secrets.token_hex(8)}",
        business_id=business_id,
        url=data.url,
        events=[WebhookEventType(e) for e in data.events]
    )

    webhook_manager.register_endpoint(endpoint)

    return {
        "success": True,
        "webhook_id": endpoint.id,
        "secret": endpoint.secret  # Show once on creation
    }


# =============================================================================
# Analytics Endpoints
# =============================================================================

@router.get("/api/business/{business_id}/analytics")
async def get_business_analytics(
    business_id: str,
    request: Request,
    time_range: str = "last_30_days"
):
    """Get comprehensive analytics dashboard"""
    # In production, fetch real data from database
    # For now return sample structure
    return get_analytics_dashboard([], [], time_range)


@router.get("/api/business/{business_id}/analytics/roi")
async def get_roi_analytics(
    business_id: str,
    request: Request,
    avg_customer_value: float = 500
):
    """Get ROI calculations"""
    roi = ROIAnalytics(avg_customer_value=avg_customer_value)
    return roi.calculate_roi([], [])


@router.get("/api/business/{business_id}/calls/{call_id}/score")
async def get_lead_score(business_id: str, call_id: str, request: Request):
    """Get lead score for a specific call"""
    # Would fetch call data from database
    call_data = {"duration": 180, "appointment_booked": True}
    score = LeadScoring.score_lead(call_data)
    return score


# =============================================================================
# Widget Endpoints
# =============================================================================

@router.get("/api/business/{business_id}/widgets")
async def get_widgets(business_id: str, request: Request):
    """Get all widgets for business"""
    widgets = widget_manager.get_business_widgets(business_id)
    return {
        "widgets": [
            {
                "id": w.id,
                "type": w.type.value,
                "active": w.active,
                "total_views": w.total_views,
                "total_calls": w.total_calls_initiated
            }
            for w in widgets
        ]
    }


@router.post("/api/business/{business_id}/widgets")
async def create_widget(business_id: str, data: WidgetCreateRequest, request: Request):
    """Create embeddable widget"""
    widget = widget_manager.create_widget(
        business_id,
        WidgetType(data.widget_type) if data.widget_type else WidgetType.FULL
    )

    if data.appearance:
        widget.appearance.update(data.appearance)
    if data.behavior:
        widget.behavior.update(data.behavior)

    base_url = os.getenv("BASE_URL", "http://localhost:8000")
    embed_code = generate_embed_code(widget, base_url)

    return {
        "success": True,
        "widget_id": widget.id,
        "embed_code": embed_code
    }


@router.get("/widget/{widget_id}/loader.js")
async def get_widget_loader(widget_id: str):
    """Serve widget JavaScript"""
    widget = widget_manager.get_widget(widget_id)

    if not widget or not widget.active:
        return Response(content="// Widget not found", media_type="application/javascript")

    base_url = os.getenv("BASE_URL", "http://localhost:8000")
    # Would get actual phone number from business
    vapi_phone = "+15551234567"

    js_content = generate_widget_loader_js(widget, base_url, vapi_phone)

    return Response(content=js_content, media_type="application/javascript")


@router.post("/api/widget/{widget_id}/request-call")
async def widget_request_call(
    widget_id: str,
    data: WidgetCallRequest,
    background_tasks: BackgroundTasks
):
    """Handle call request from widget"""
    widget = widget_manager.get_widget(widget_id)

    if not widget or not widget.active:
        raise HTTPException(status_code=404, detail="Widget not found")

    # Would initiate outbound call here
    widget_manager.record_event(widget_id, "call_requested")

    return {"success": True, "message": "Call will be initiated shortly"}


@router.post("/api/widget/{widget_id}/event")
async def record_widget_event(widget_id: str, request: Request):
    """Record widget analytics event"""
    body = await request.json()
    event = body.get("event", "unknown")

    widget_manager.record_event(widget_id, event)

    return {"success": True}


# =============================================================================
# Agency Endpoints
# =============================================================================

@router.post("/api/agency")
async def create_agency(data: AgencyCreateRequest, request: Request):
    """Create new agency account"""
    # Would get user from auth
    user_id = "user_123"

    agency = agency_manager.create_agency(
        user_id=user_id,
        name=data.name,
        tier=AgencyTier(data.tier) if data.tier else AgencyTier.STARTER
    )

    return {
        "success": True,
        "agency_id": agency.id,
        "tier": agency.tier.value,
        "api_key": generate_agency_api_key(agency.id)
    }


@router.get("/api/agency/{agency_id}")
async def get_agency(agency_id: str, request: Request):
    """Get agency details"""
    agency = agency_manager.get_agency(agency_id)

    if not agency:
        raise HTTPException(status_code=404, detail="Agency not found")

    return {
        "agency": {
            "id": agency.id,
            "name": agency.name,
            "tier": agency.tier.value,
            "billing_status": agency.billing_status
        },
        "branding": agency.branding,
        "sub_accounts_count": len(agency.sub_accounts)
    }


@router.get("/api/agency/{agency_id}/dashboard")
async def get_agency_dashboard(agency_id: str, request: Request):
    """Get agency dashboard stats"""
    stats = agency_manager.get_agency_dashboard_stats(agency_id)

    if not stats:
        raise HTTPException(status_code=404, detail="Agency not found")

    return stats


@router.post("/api/agency/{agency_id}/sub-accounts")
async def create_sub_account(
    agency_id: str,
    data: SubAccountCreateRequest,
    request: Request
):
    """Create sub-account under agency"""
    # Would create business for the sub-account
    import secrets
    business_id = f"bus_{secrets.token_hex(8)}"

    sub_account = agency_manager.create_sub_account(
        agency_id=agency_id,
        business_id=business_id,
        client_name=data.client_name
    )

    if not sub_account:
        raise HTTPException(status_code=400, detail="Cannot create sub-account. Check tier limits.")

    sub_account.set_pricing(data.monthly_price, 200)  # $200 base cost

    return {
        "success": True,
        "sub_account_id": sub_account.id,
        "business_id": business_id
    }


@router.get("/api/agency/{agency_id}/sub-accounts")
async def get_sub_accounts(agency_id: str, request: Request):
    """Get all sub-accounts for agency"""
    sub_accounts = agency_manager.get_agency_sub_accounts(agency_id)

    return {
        "sub_accounts": [
            {
                "id": s.id,
                "client_name": s.client_name,
                "status": s.status.value,
                "monthly_price": s.client_monthly_price,
                "minutes_used": s.minutes_used,
                "calls_count": s.calls_count
            }
            for s in sub_accounts
        ]
    }


@router.patch("/api/agency/{agency_id}/branding")
async def update_branding(agency_id: str, request: Request):
    """Update agency branding"""
    agency = agency_manager.get_agency(agency_id)

    if not agency:
        raise HTTPException(status_code=404, detail="Agency not found")

    body = await request.json()
    result = update_agency_branding(agency, body)

    return result


# =============================================================================
# Multi-Language Endpoints
# =============================================================================

@router.get("/api/languages")
async def get_languages():
    """Get supported languages"""
    return {"languages": get_supported_languages()}


@router.post("/api/business/{business_id}/language")
async def set_business_language(business_id: str, request: Request):
    """Set business primary language"""
    body = await request.json()
    language_code = body.get("language", "en")

    try:
        language = SupportedLanguage(language_code)
    except ValueError:
        raise HTTPException(status_code=400, detail="Unsupported language")

    # Would update business in database
    return {
        "success": True,
        "language": language.value,
        "name": language.name
    }


# =============================================================================
# Missed Call Text-Back Handler
# =============================================================================

@router.post("/api/webhooks/missed-call")
async def handle_missed_call(request: Request, background_tasks: BackgroundTasks):
    """Handle missed call webhook from Vapi"""
    body = await request.json()

    caller_phone = body.get("caller_phone")
    business_id = body.get("business_id")
    assistant_id = body.get("assistant_id")

    if not caller_phone or not business_id:
        return {"status": "missing_data"}

    # Would get business details from database
    business_name = "Demo Business"
    callback_number = "+15551234567"

    # Send text-back in background
    background_tasks.add_task(
        send_missed_call_textback,
        business_id,
        business_name,
        caller_phone,
        callback_number,
        False,  # is_after_hours
        30  # delay_seconds
    )

    # Trigger webhooks
    await webhook_manager.trigger_event(
        business_id,
        WebhookEventType.CALL_MISSED,
        {"caller_phone": caller_phone, "timestamp": datetime.utcnow().isoformat()}
    )

    logger.info(f"Missed call text-back queued for {caller_phone}")

    return {"status": "text_back_queued"}
