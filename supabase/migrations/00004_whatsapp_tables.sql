-- =============================================================
-- CRM WhatsApp & Email — Migration 00004
-- Tabelas de WhatsApp (Epic 03)
-- Idempotente e segura para múltiplas execuções
-- =============================================================

-- Tabela de configuração de provedores WhatsApp
CREATE TABLE IF NOT EXISTS whatsapp_provider_configs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  provider TEXT NOT NULL CHECK (provider IN ('evolution', 'meta')),
  is_enabled BOOLEAN DEFAULT false,
  api_url TEXT,
  api_key_encrypted TEXT,
  instance_name TEXT,
  phone_number TEXT,
  webhook_url TEXT,
  status TEXT NOT NULL DEFAULT 'unconfigured' CHECK (status IN ('unconfigured', 'connected', 'error', 'qr_pending')),
  last_tested_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(tenant_id, provider)
);

-- Tabela de conversas WhatsApp
CREATE TABLE IF NOT EXISTS whatsapp_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  lead_id UUID REFERENCES leads(id) ON DELETE SET NULL,
  phone TEXT NOT NULL,
  lead_name TEXT,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'waiting', 'closed')),
  assigned_to UUID,
  unread_count INTEGER DEFAULT 0,
  last_message_text TEXT,
  last_message_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Tabela de mensagens WhatsApp
CREATE TABLE IF NOT EXISTS whatsapp_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES whatsapp_conversations(id) ON DELETE CASCADE,
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  direction TEXT NOT NULL CHECK (direction IN ('inbound', 'outbound')),
  message_type TEXT NOT NULL DEFAULT 'text' CHECK (message_type IN ('text', 'image', 'video', 'audio', 'document', 'template')),
  body TEXT,
  media_url TEXT,
  provider_message_id TEXT,
  status TEXT NOT NULL DEFAULT 'sent' CHECK (status IN ('queued', 'sent', 'delivered', 'read', 'failed')),
  sent_by UUID, -- null = lead, user_id = agent
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Templates HSM do WhatsApp
CREATE TABLE IF NOT EXISTS whatsapp_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  language TEXT NOT NULL DEFAULT 'pt_BR',
  category TEXT NOT NULL DEFAULT 'MARKETING',
  body_text TEXT NOT NULL,
  header_text TEXT,
  footer_text TEXT,
  buttons JSONB DEFAULT '[]'::jsonb,
  variables TEXT[] DEFAULT ARRAY[]::TEXT[],
  provider_template_id TEXT,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'pending', 'approved', 'rejected')),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_whatsapp_conversations_tenant ON whatsapp_conversations(tenant_id);
CREATE INDEX IF NOT EXISTS idx_whatsapp_conversations_lead ON whatsapp_conversations(lead_id);
CREATE INDEX IF NOT EXISTS idx_whatsapp_conversations_status ON whatsapp_conversations(status);
CREATE INDEX IF NOT EXISTS idx_whatsapp_messages_conversation ON whatsapp_messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_whatsapp_messages_created ON whatsapp_messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_whatsapp_templates_tenant ON whatsapp_templates(tenant_id);

-- RLS
ALTER TABLE whatsapp_provider_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE whatsapp_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE whatsapp_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE whatsapp_templates ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "tenant_isolation_wa_configs" ON whatsapp_provider_configs;
CREATE POLICY "tenant_isolation_wa_configs" ON whatsapp_provider_configs
  USING (tenant_id = (current_setting('app.current_tenant_id', true))::uuid);

DROP POLICY IF EXISTS "tenant_isolation_wa_conversations" ON whatsapp_conversations;
CREATE POLICY "tenant_isolation_wa_conversations" ON whatsapp_conversations
  USING (tenant_id = (current_setting('app.current_tenant_id', true))::uuid);

DROP POLICY IF EXISTS "tenant_isolation_wa_messages" ON whatsapp_messages;
CREATE POLICY "tenant_isolation_wa_messages" ON whatsapp_messages
  USING (tenant_id = (current_setting('app.current_tenant_id', true))::uuid);

DROP POLICY IF EXISTS "tenant_isolation_wa_templates" ON whatsapp_templates;
CREATE POLICY "tenant_isolation_wa_templates" ON whatsapp_templates
  USING (tenant_id = (current_setting('app.current_tenant_id', true))::uuid);

-- Seed feature flags for WhatsApp
INSERT INTO feature_flags (key, description, is_enabled, allowed_plans) VALUES
  ('whatsapp_enabled', 'Integração WhatsApp', false, ARRAY['pro','business']),
  ('whatsapp_inbox_enabled', 'Inbox centralizado WhatsApp', false, ARRAY['pro','business']),
  ('whatsapp_templates_enabled', 'Templates HSM WhatsApp', false, ARRAY['business'])
ON CONFLICT (key) DO NOTHING;
