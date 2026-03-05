-- =============================================================
-- CRM WhatsApp & Email — Migration 00003
-- Tabelas de Email Marketing (Epic 02)
-- Idempotente e segura para múltiplas execuções
-- =============================================================

-- Tabela de configuração de provedores de email
CREATE TABLE IF NOT EXISTS email_provider_configs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  provider TEXT NOT NULL CHECK (provider IN ('brevo', 'resend', 'sendgrid', 'smtp')),
  is_enabled BOOLEAN DEFAULT false,
  api_key_encrypted TEXT, -- encrypted with pgcrypto
  smtp_host TEXT,
  smtp_port INTEGER,
  smtp_username TEXT,
  smtp_password_encrypted TEXT,
  from_email TEXT NOT NULL DEFAULT '',
  from_name TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'unconfigured' CHECK (status IN ('unconfigured', 'connected', 'error')),
  last_tested_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(tenant_id, provider)
);

-- Tabela de templates de email
CREATE TABLE IF NOT EXISTS email_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name TEXT NOT NULL DEFAULT 'Novo Template',
  subject TEXT NOT NULL DEFAULT '',
  blocks JSONB NOT NULL DEFAULT '[]'::jsonb,
  styles JSONB NOT NULL DEFAULT '{}'::jsonb,
  variables TEXT[] DEFAULT ARRAY[]::TEXT[],
  thumbnail_url TEXT,
  is_archived BOOLEAN DEFAULT false,
  created_by UUID,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Tabela de campanhas de email
CREATE TABLE IF NOT EXISTS email_campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  template_id UUID REFERENCES email_templates(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'scheduled', 'sending', 'sent', 'cancelled')),
  send_type TEXT NOT NULL DEFAULT 'broadcast' CHECK (send_type IN ('broadcast', 'individual')),
  
  -- Filtros de destinatários
  recipient_filter JSONB DEFAULT '{}'::jsonb, -- tags, stages, score ranges
  total_recipients INTEGER DEFAULT 0,
  
  -- Métricas
  total_sent INTEGER DEFAULT 0,
  total_delivered INTEGER DEFAULT 0,
  total_opened INTEGER DEFAULT 0,
  total_clicked INTEGER DEFAULT 0,
  total_bounced INTEGER DEFAULT 0,
  total_unsubscribed INTEGER DEFAULT 0,
  
  -- Agendamento
  scheduled_at TIMESTAMPTZ,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  
  created_by UUID,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Tabela de envios individuais (cada email enviado)
CREATE TABLE IF NOT EXISTS email_sends (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID NOT NULL REFERENCES email_campaigns(id) ON DELETE CASCADE,
  lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  
  status TEXT NOT NULL DEFAULT 'queued' CHECK (status IN ('queued', 'sent', 'delivered', 'opened', 'clicked', 'bounced', 'failed')),
  provider_message_id TEXT,
  
  sent_at TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ,
  opened_at TIMESTAMPTZ,
  clicked_at TIMESTAMPTZ,
  bounced_at TIMESTAMPTZ,
  
  error_message TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Tabela de cliques rastreados
CREATE TABLE IF NOT EXISTS email_link_clicks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email_send_id UUID NOT NULL REFERENCES email_sends(id) ON DELETE CASCADE,
  lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  clicked_at TIMESTAMPTZ DEFAULT now(),
  user_agent TEXT,
  ip_address INET
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_email_provider_configs_tenant ON email_provider_configs(tenant_id);
CREATE INDEX IF NOT EXISTS idx_email_templates_tenant ON email_templates(tenant_id);
CREATE INDEX IF NOT EXISTS idx_email_campaigns_tenant ON email_campaigns(tenant_id);
CREATE INDEX IF NOT EXISTS idx_email_campaigns_status ON email_campaigns(status);
CREATE INDEX IF NOT EXISTS idx_email_sends_campaign ON email_sends(campaign_id);
CREATE INDEX IF NOT EXISTS idx_email_sends_lead ON email_sends(lead_id);
CREATE INDEX IF NOT EXISTS idx_email_sends_status ON email_sends(status);
CREATE INDEX IF NOT EXISTS idx_email_link_clicks_send ON email_link_clicks(email_send_id);

-- RLS
ALTER TABLE email_provider_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_sends ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_link_clicks ENABLE ROW LEVEL SECURITY;

-- Policies (tenant isolation)
DROP POLICY IF EXISTS "tenant_isolation_email_configs" ON email_provider_configs;
CREATE POLICY "tenant_isolation_email_configs" ON email_provider_configs
  USING (tenant_id = (current_setting('app.current_tenant_id', true))::uuid);

DROP POLICY IF EXISTS "tenant_isolation_email_templates" ON email_templates;
CREATE POLICY "tenant_isolation_email_templates" ON email_templates
  USING (tenant_id = (current_setting('app.current_tenant_id', true))::uuid);

DROP POLICY IF EXISTS "tenant_isolation_email_campaigns" ON email_campaigns;
CREATE POLICY "tenant_isolation_email_campaigns" ON email_campaigns
  USING (tenant_id = (current_setting('app.current_tenant_id', true))::uuid);

DROP POLICY IF EXISTS "tenant_isolation_email_sends" ON email_sends;
CREATE POLICY "tenant_isolation_email_sends" ON email_sends
  USING (tenant_id = (current_setting('app.current_tenant_id', true))::uuid);

-- Seed feature flags for email
INSERT INTO feature_flags (key, description, is_enabled, allowed_plans) VALUES
  ('email_providers_enabled', 'Configuração de provedores de email', true, ARRAY['free','pro','business']),
  ('email_templates_enabled', 'Editor de templates de email', true, ARRAY['free','pro','business']),
  ('email_campaigns_enabled', 'Envio de campanhas de email', true, ARRAY['pro','business']),
  ('email_tracking_enabled', 'Rastreamento de abertura/clique', true, ARRAY['pro','business']),
  ('email_ab_testing', 'A/B testing em campanhas', false, ARRAY['business'])
ON CONFLICT (key) DO NOTHING;
