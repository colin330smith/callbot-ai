-- CallBot AI Database Migrations V2
-- New tables for agency, integrations, SMS, campaigns, knowledge base, widgets

-- =============================================================================
-- Agencies Table (White-label)
-- =============================================================================
CREATE TABLE IF NOT EXISTS agencies (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    tier VARCHAR(50) DEFAULT 'starter',

    -- Branding
    logo_url VARCHAR(500),
    primary_color VARCHAR(20) DEFAULT '#4F46E5',
    secondary_color VARCHAR(20) DEFAULT '#10B981',
    custom_domain VARCHAR(255),
    support_email VARCHAR(255),

    -- Billing
    stripe_customer_id VARCHAR(255),
    stripe_subscription_id VARCHAR(255),
    billing_status VARCHAR(50) DEFAULT 'active',

    -- Usage
    total_minutes_used INTEGER DEFAULT 0,
    current_period_minutes INTEGER DEFAULT 0,
    period_start TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_agencies_user_id ON agencies(user_id);
CREATE INDEX IF NOT EXISTS idx_agencies_tier ON agencies(tier);

-- =============================================================================
-- Sub-Accounts Table
-- =============================================================================
CREATE TABLE IF NOT EXISTS sub_accounts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    agency_id UUID NOT NULL REFERENCES agencies(id) ON DELETE CASCADE,
    business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
    client_name VARCHAR(255) NOT NULL,
    status VARCHAR(50) DEFAULT 'active',

    -- Pricing (what agency charges their client)
    client_monthly_price DECIMAL(10, 2) DEFAULT 0,
    margin DECIMAL(10, 2) DEFAULT 0,

    -- Usage
    minutes_used INTEGER DEFAULT 0,
    calls_count INTEGER DEFAULT 0,

    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_sub_accounts_agency_id ON sub_accounts(agency_id);
CREATE INDEX IF NOT EXISTS idx_sub_accounts_business_id ON sub_accounts(business_id);

-- =============================================================================
-- Integrations Table
-- =============================================================================
CREATE TABLE IF NOT EXISTS integrations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
    integration_type VARCHAR(50) NOT NULL, -- gohighlevel, hubspot, zapier, etc.

    -- Credentials (encrypted in production)
    credentials JSONB DEFAULT '{}'::jsonb,
    settings JSONB DEFAULT '{}'::jsonb,

    -- Status
    status VARCHAR(50) DEFAULT 'pending',
    last_sync_at TIMESTAMP WITH TIME ZONE,
    error_message TEXT,

    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_integrations_business_id ON integrations(business_id);
CREATE INDEX IF NOT EXISTS idx_integrations_type ON integrations(integration_type);

-- =============================================================================
-- SMS Logs Table
-- =============================================================================
CREATE TABLE IF NOT EXISTS sms_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,

    -- Message Details
    to_phone VARCHAR(50) NOT NULL,
    from_phone VARCHAR(50),
    message TEXT NOT NULL,
    sms_type VARCHAR(50), -- missed_call_textback, appointment_reminder, follow_up, etc.

    -- Status
    status VARCHAR(50) DEFAULT 'queued',
    provider VARCHAR(50), -- twilio, vonage
    provider_message_id VARCHAR(255),
    error_message TEXT,

    -- Related entities
    call_id UUID REFERENCES calls(id) ON DELETE SET NULL,
    appointment_id UUID REFERENCES appointments(id) ON DELETE SET NULL,
    campaign_id UUID,

    sent_at TIMESTAMP WITH TIME ZONE,
    delivered_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_sms_logs_business_id ON sms_logs(business_id);
CREATE INDEX IF NOT EXISTS idx_sms_logs_to_phone ON sms_logs(to_phone);
CREATE INDEX IF NOT EXISTS idx_sms_logs_sms_type ON sms_logs(sms_type);
CREATE INDEX IF NOT EXISTS idx_sms_logs_created_at ON sms_logs(created_at);

-- =============================================================================
-- Campaigns Table
-- =============================================================================
CREATE TABLE IF NOT EXISTS campaigns (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,

    -- Campaign Details
    name VARCHAR(255) NOT NULL,
    campaign_type VARCHAR(50) NOT NULL, -- appointment_reminder, follow_up, promotional, etc.
    status VARCHAR(50) DEFAULT 'draft',

    -- Settings
    assistant_id VARCHAR(255),
    settings JSONB DEFAULT '{}'::jsonb,

    -- Schedule
    scheduled_start TIMESTAMP WITH TIME ZONE,
    started_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,

    -- Stats
    total_contacts INTEGER DEFAULT 0,
    calls_attempted INTEGER DEFAULT 0,
    calls_connected INTEGER DEFAULT 0,
    appointments_booked INTEGER DEFAULT 0,

    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_campaigns_business_id ON campaigns(business_id);
CREATE INDEX IF NOT EXISTS idx_campaigns_status ON campaigns(status);

-- =============================================================================
-- Campaign Contacts Table
-- =============================================================================
CREATE TABLE IF NOT EXISTS campaign_contacts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    campaign_id UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,

    -- Contact Info
    name VARCHAR(255),
    phone VARCHAR(50) NOT NULL,
    email VARCHAR(255),
    metadata JSONB DEFAULT '{}'::jsonb,

    -- Status
    status VARCHAR(50) DEFAULT 'pending', -- pending, called, completed, failed
    call_id UUID REFERENCES calls(id) ON DELETE SET NULL,
    outcome VARCHAR(50),
    attempts INTEGER DEFAULT 0,

    last_attempt_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_campaign_contacts_campaign_id ON campaign_contacts(campaign_id);
CREATE INDEX IF NOT EXISTS idx_campaign_contacts_status ON campaign_contacts(status);

-- =============================================================================
-- Knowledge Base Entries Table
-- =============================================================================
CREATE TABLE IF NOT EXISTS knowledge_base (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,

    -- Content
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    category VARCHAR(100) DEFAULT 'general',
    source_type VARCHAR(50) DEFAULT 'manual', -- manual, upload, website, api

    -- File Info (if uploaded)
    filename VARCHAR(255),
    file_size INTEGER,

    -- Content hash for deduplication
    content_hash VARCHAR(64),

    -- Status
    is_active BOOLEAN DEFAULT true,

    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_knowledge_base_business_id ON knowledge_base(business_id);
CREATE INDEX IF NOT EXISTS idx_knowledge_base_category ON knowledge_base(category);
CREATE INDEX IF NOT EXISTS idx_knowledge_base_content_hash ON knowledge_base(content_hash);

-- =============================================================================
-- Widgets Table
-- =============================================================================
CREATE TABLE IF NOT EXISTS widgets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,

    -- Configuration
    widget_type VARCHAR(50) DEFAULT 'full',
    appearance JSONB DEFAULT '{}'::jsonb,
    behavior JSONB DEFAULT '{}'::jsonb,
    allowed_domains TEXT[],

    -- Status
    is_active BOOLEAN DEFAULT true,

    -- Analytics
    total_views INTEGER DEFAULT 0,
    total_interactions INTEGER DEFAULT 0,
    total_calls_initiated INTEGER DEFAULT 0,

    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_widgets_business_id ON widgets(business_id);

-- =============================================================================
-- Widget Events Table
-- =============================================================================
CREATE TABLE IF NOT EXISTS widget_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    widget_id UUID NOT NULL REFERENCES widgets(id) ON DELETE CASCADE,

    event_type VARCHAR(50) NOT NULL,
    metadata JSONB DEFAULT '{}'::jsonb,

    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_widget_events_widget_id ON widget_events(widget_id);
CREATE INDEX IF NOT EXISTS idx_widget_events_event_type ON widget_events(event_type);

-- =============================================================================
-- Lead Scores Table
-- =============================================================================
CREATE TABLE IF NOT EXISTS lead_scores (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
    call_id UUID REFERENCES calls(id) ON DELETE CASCADE,

    -- Scoring
    score INTEGER NOT NULL,
    grade VARCHAR(2) NOT NULL,
    label VARCHAR(50),
    priority VARCHAR(20),
    breakdown JSONB DEFAULT '{}'::jsonb,

    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_lead_scores_business_id ON lead_scores(business_id);
CREATE INDEX IF NOT EXISTS idx_lead_scores_score ON lead_scores(score);
CREATE INDEX IF NOT EXISTS idx_lead_scores_grade ON lead_scores(grade);

-- =============================================================================
-- Automation Rules Table
-- =============================================================================
CREATE TABLE IF NOT EXISTS automation_rules (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,

    name VARCHAR(255) NOT NULL,
    trigger_event VARCHAR(100) NOT NULL,
    conditions JSONB DEFAULT '[]'::jsonb,
    actions JSONB DEFAULT '[]'::jsonb,

    is_active BOOLEAN DEFAULT true,

    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_automation_rules_business_id ON automation_rules(business_id);
CREATE INDEX IF NOT EXISTS idx_automation_rules_trigger_event ON automation_rules(trigger_event);

-- =============================================================================
-- SMS Opt-Outs Table
-- =============================================================================
CREATE TABLE IF NOT EXISTS sms_opt_outs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
    phone VARCHAR(50) NOT NULL,
    opted_out_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

    UNIQUE(business_id, phone)
);

CREATE INDEX IF NOT EXISTS idx_sms_opt_outs_business_phone ON sms_opt_outs(business_id, phone);

-- =============================================================================
-- Add new columns to businesses table
-- =============================================================================
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS agent_name VARCHAR(100) DEFAULT 'Alex';
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS agent_voice VARCHAR(50) DEFAULT 'rachel';
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS primary_language VARCHAR(10) DEFAULT 'en';
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS additional_languages TEXT[];
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS pricing JSONB DEFAULT '{}'::jsonb;
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS offers_financing BOOLEAN DEFAULT false;
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS offers_emergency BOOLEAN DEFAULT false;
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS response_time VARCHAR(100);
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS appointment_types TEXT[];
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS custom_instructions TEXT;
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS faq TEXT;
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS service_area TEXT;
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS vapi_phone_number VARCHAR(50);
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'setup';

-- =============================================================================
-- Add new columns to calls table
-- =============================================================================
ALTER TABLE calls ADD COLUMN IF NOT EXISTS lead_score INTEGER;
ALTER TABLE calls ADD COLUMN IF NOT EXISTS lead_grade VARCHAR(2);
ALTER TABLE calls ADD COLUMN IF NOT EXISTS is_missed_call BOOLEAN DEFAULT false;
ALTER TABLE calls ADD COLUMN IF NOT EXISTS textback_sent BOOLEAN DEFAULT false;
ALTER TABLE calls ADD COLUMN IF NOT EXISTS campaign_id UUID REFERENCES campaigns(id) ON DELETE SET NULL;

-- =============================================================================
-- Add new columns to users table
-- =============================================================================
ALTER TABLE users ADD COLUMN IF NOT EXISTS name VARCHAR(255);
ALTER TABLE users ADD COLUMN IF NOT EXISTS last_login_at TIMESTAMP WITH TIME ZONE;

-- =============================================================================
-- Apply triggers
-- =============================================================================
DROP TRIGGER IF EXISTS update_agencies_updated_at ON agencies;
CREATE TRIGGER update_agencies_updated_at
    BEFORE UPDATE ON agencies
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_sub_accounts_updated_at ON sub_accounts;
CREATE TRIGGER update_sub_accounts_updated_at
    BEFORE UPDATE ON sub_accounts
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_integrations_updated_at ON integrations;
CREATE TRIGGER update_integrations_updated_at
    BEFORE UPDATE ON integrations
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_campaigns_updated_at ON campaigns;
CREATE TRIGGER update_campaigns_updated_at
    BEFORE UPDATE ON campaigns
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_knowledge_base_updated_at ON knowledge_base;
CREATE TRIGGER update_knowledge_base_updated_at
    BEFORE UPDATE ON knowledge_base
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_widgets_updated_at ON widgets;
CREATE TRIGGER update_widgets_updated_at
    BEFORE UPDATE ON widgets
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_automation_rules_updated_at ON automation_rules;
CREATE TRIGGER update_automation_rules_updated_at
    BEFORE UPDATE ON automation_rules
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
