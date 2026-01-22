-- SubShield Database Schema
-- Run this in Supabase SQL Editor to set up the database

-- Leads table for capturing and nurturing leads
CREATE TABLE IF NOT EXISTS leads (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  risk_score INTEGER,
  source TEXT DEFAULT 'preview',
  ip_hash TEXT,
  captured_at TIMESTAMPTZ DEFAULT NOW(),
  emails_sent INTEGER[] DEFAULT ARRAY[0],
  converted BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Rate limiting table
CREATE TABLE IF NOT EXISTS rate_limits (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  ip_hash TEXT NOT NULL UNIQUE,
  count INTEGER DEFAULT 1,
  reset_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Analysis history table (for future use)
CREATE TABLE IF NOT EXISTS analyses (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL,
  file_name TEXT,
  risk_score INTEGER,
  analysis_result JSONB,
  paid BOOLEAN DEFAULT FALSE,
  stripe_session_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_leads_email ON leads(email);
CREATE INDEX IF NOT EXISTS idx_leads_captured_at ON leads(captured_at);
CREATE INDEX IF NOT EXISTS idx_leads_converted ON leads(converted);
CREATE INDEX IF NOT EXISTS idx_rate_limits_ip_hash ON rate_limits(ip_hash);
CREATE INDEX IF NOT EXISTS idx_rate_limits_reset_at ON rate_limits(reset_at);
CREATE INDEX IF NOT EXISTS idx_analyses_email ON analyses(email);
CREATE INDEX IF NOT EXISTS idx_analyses_stripe_session_id ON analyses(stripe_session_id);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger for leads table
DROP TRIGGER IF EXISTS update_leads_updated_at ON leads;
CREATE TRIGGER update_leads_updated_at
  BEFORE UPDATE ON leads
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Row Level Security (RLS) policies
-- Enable RLS on all tables
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE rate_limits ENABLE ROW LEVEL SECURITY;
ALTER TABLE analyses ENABLE ROW LEVEL SECURITY;

-- Service role has full access (used by backend)
CREATE POLICY "Service role has full access to leads"
  ON leads FOR ALL
  USING (auth.role() = 'service_role');

CREATE POLICY "Service role has full access to rate_limits"
  ON rate_limits FOR ALL
  USING (auth.role() = 'service_role');

CREATE POLICY "Service role has full access to analyses"
  ON analyses FOR ALL
  USING (auth.role() = 'service_role');

-- Cleanup function for old rate limit records (run via cron)
CREATE OR REPLACE FUNCTION cleanup_expired_rate_limits()
RETURNS void AS $$
BEGIN
  DELETE FROM rate_limits WHERE reset_at < NOW();
END;
$$ LANGUAGE plpgsql;

-- Cleanup function for old nurture records (leads who completed sequence)
CREATE OR REPLACE FUNCTION cleanup_old_leads()
RETURNS void AS $$
BEGIN
  -- Delete leads older than 30 days who haven't converted
  DELETE FROM leads
  WHERE converted = FALSE
    AND captured_at < NOW() - INTERVAL '30 days';
END;
$$ LANGUAGE plpgsql;
