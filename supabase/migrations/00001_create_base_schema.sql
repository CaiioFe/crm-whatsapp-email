-- ============================================================
-- CRM WhatsApp & Email — Migration 00001: Base Schema
-- Epic 01 / US 01.1 — Modelo de Dados & Migrations Base
-- 
-- REGRAS:
--   ✅ Idempotente (pode ser re-executado sem erro)
--   ✅ CREATE TABLE IF NOT EXISTS
--   ✅ DROP POLICY/TRIGGER IF EXISTS antes de criar
--   ✅ CREATE INDEX IF NOT EXISTS
--   ✅ INSERT com ON CONFLICT
-- ============================================================

-- =========================
-- 0. EXTENSIONS
-- =========================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =========================
-- 1. TENANTS (Multi-tenant)
-- =========================
CREATE TABLE IF NOT EXISTS tenants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  plan TEXT NOT NULL DEFAULT 'free', -- free, pro, business
  logo_url TEXT,
  settings JSONB DEFAULT '{}',
  timezone TEXT DEFAULT 'America/Sao_Paulo',
  locale TEXT DEFAULT 'pt-BR',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_tenants_slug ON tenants(slug);

-- =========================
-- 2. USER PROFILES & ROLES
-- =========================
CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL UNIQUE, -- references auth.users(id)
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  display_name TEXT,
  avatar_url TEXT,
  role TEXT NOT NULL DEFAULT 'viewer', -- viewer, operator, manager, admin
  last_login_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_user_profiles_tenant ON user_profiles(tenant_id);
CREATE INDEX IF NOT EXISTS idx_user_profiles_user ON user_profiles(user_id);

-- =========================
-- 3. FEATURE FLAGS
-- =========================
CREATE TABLE IF NOT EXISTS feature_flags (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  key TEXT UNIQUE NOT NULL,
  description TEXT,
  enabled_by_default BOOLEAN DEFAULT false,
  plan_ids TEXT[] DEFAULT '{}', -- plans that have access
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS tenant_feature_flags (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  flag_key TEXT NOT NULL REFERENCES feature_flags(key) ON DELETE CASCADE,
  enabled BOOLEAN NOT NULL,
  reason TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  CONSTRAINT uq_tenant_flag UNIQUE(tenant_id, flag_key)
);

CREATE INDEX IF NOT EXISTS idx_tenant_feature_flags_tenant ON tenant_feature_flags(tenant_id);

-- =========================
-- 4. PIPELINES & STAGES
-- =========================
CREATE TABLE IF NOT EXISTS pipelines (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name TEXT NOT NULL DEFAULT 'Pipeline Principal',
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_pipelines_tenant ON pipelines(tenant_id);

CREATE TABLE IF NOT EXISTS pipeline_stages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  pipeline_id UUID NOT NULL REFERENCES pipelines(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  color TEXT DEFAULT '#6366f1', -- default indigo
  position INTEGER NOT NULL DEFAULT 0,
  is_won BOOLEAN DEFAULT false,  -- marks "Convertido" stage
  is_lost BOOLEAN DEFAULT false, -- marks "Perdido" stage
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_pipeline_stages_pipeline ON pipeline_stages(pipeline_id);
CREATE INDEX IF NOT EXISTS idx_pipeline_stages_position ON pipeline_stages(pipeline_id, position);

-- =========================
-- 5. TAGS
-- =========================
CREATE TABLE IF NOT EXISTS tags (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  color TEXT DEFAULT '#8b5cf6', -- default violet
  created_at TIMESTAMPTZ DEFAULT now(),
  CONSTRAINT uq_tag_name_tenant UNIQUE(tenant_id, name)
);

CREATE INDEX IF NOT EXISTS idx_tags_tenant ON tags(tenant_id);

-- =========================
-- 6. LEADS
-- =========================
CREATE TABLE IF NOT EXISTS leads (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  
  -- Contact info
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  company TEXT,
  position_title TEXT,
  
  -- Flexible custom fields
  custom_fields JSONB DEFAULT '{}',
  
  -- Pipeline status
  current_stage_id UUID REFERENCES pipeline_stages(id) ON DELETE SET NULL,
  
  -- Scoring
  lead_score INTEGER DEFAULT 0,
  
  -- Source tracking
  source TEXT, -- csv_import, manual, form, api, whatsapp, website
  source_detail TEXT, -- filename, form name, etc.
  
  -- Opt-out
  opted_out_email BOOLEAN DEFAULT false,
  opted_out_whatsapp BOOLEAN DEFAULT false,
  
  -- Timestamps
  last_interaction_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  deleted_at TIMESTAMPTZ -- soft delete
);

-- Core indexes for frequent queries
CREATE INDEX IF NOT EXISTS idx_leads_tenant ON leads(tenant_id);
CREATE INDEX IF NOT EXISTS idx_leads_tenant_email ON leads(tenant_id, email);
CREATE INDEX IF NOT EXISTS idx_leads_tenant_phone ON leads(tenant_id, phone);
CREATE INDEX IF NOT EXISTS idx_leads_tenant_stage ON leads(tenant_id, current_stage_id);
CREATE INDEX IF NOT EXISTS idx_leads_tenant_score ON leads(tenant_id, lead_score);
CREATE INDEX IF NOT EXISTS idx_leads_tenant_created ON leads(tenant_id, created_at);
CREATE INDEX IF NOT EXISTS idx_leads_deleted ON leads(deleted_at) WHERE deleted_at IS NULL;

-- =========================
-- 7. LEAD TAGS (many-to-many)
-- =========================
CREATE TABLE IF NOT EXISTS lead_tags (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  tag_id UUID NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  CONSTRAINT uq_lead_tag UNIQUE(lead_id, tag_id)
);

CREATE INDEX IF NOT EXISTS idx_lead_tags_lead ON lead_tags(lead_id);
CREATE INDEX IF NOT EXISTS idx_lead_tags_tag ON lead_tags(tag_id);

-- =========================
-- 8. LEAD STAGE HISTORY (audit)
-- =========================
CREATE TABLE IF NOT EXISTS lead_stage_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  from_stage_id UUID REFERENCES pipeline_stages(id) ON DELETE SET NULL,
  to_stage_id UUID REFERENCES pipeline_stages(id) ON DELETE SET NULL,
  changed_by UUID, -- user who made the change
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_lead_stage_history_lead ON lead_stage_history(lead_id);
CREATE INDEX IF NOT EXISTS idx_lead_stage_history_created ON lead_stage_history(lead_id, created_at);

-- =========================
-- 9. INTERACTIONS (timeline)
-- =========================
CREATE TABLE IF NOT EXISTS interactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  
  -- Type of interaction
  type TEXT NOT NULL, -- email_sent, email_received, email_opened, email_clicked,
                       -- whatsapp_sent, whatsapp_received, whatsapp_read,
                       -- note, stage_change, tag_change, score_change, import
  
  -- Content
  title TEXT,
  body TEXT,
  metadata JSONB DEFAULT '{}', -- extra data (email subject, template used, etc)
  
  -- Who triggered
  created_by UUID, -- user who created (null if system-generated)
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_interactions_lead ON interactions(lead_id);
CREATE INDEX IF NOT EXISTS idx_interactions_lead_created ON interactions(lead_id, created_at);
CREATE INDEX IF NOT EXISTS idx_interactions_tenant ON interactions(tenant_id);
CREATE INDEX IF NOT EXISTS idx_interactions_type ON interactions(lead_id, type);

-- =========================
-- 10. IMPORT LOGS
-- =========================
CREATE TABLE IF NOT EXISTS import_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  filename TEXT,
  total_rows INTEGER DEFAULT 0,
  created_count INTEGER DEFAULT 0,
  updated_count INTEGER DEFAULT 0,
  error_count INTEGER DEFAULT 0,
  errors JSONB DEFAULT '[]', -- array of { row, field, message }
  status TEXT DEFAULT 'processing', -- processing, completed, failed
  imported_by UUID, -- user who triggered import
  created_at TIMESTAMPTZ DEFAULT now(),
  completed_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_import_logs_tenant ON import_logs(tenant_id);

-- =========================
-- 11. AUTO-UPDATE TRIGGER (updated_at)
-- =========================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply to all tables with updated_at
DROP TRIGGER IF EXISTS trigger_tenants_updated_at ON tenants;
CREATE TRIGGER trigger_tenants_updated_at
  BEFORE UPDATE ON tenants
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trigger_user_profiles_updated_at ON user_profiles;
CREATE TRIGGER trigger_user_profiles_updated_at
  BEFORE UPDATE ON user_profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trigger_pipelines_updated_at ON pipelines;
CREATE TRIGGER trigger_pipelines_updated_at
  BEFORE UPDATE ON pipelines
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trigger_leads_updated_at ON leads;
CREATE TRIGGER trigger_leads_updated_at
  BEFORE UPDATE ON leads
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =========================
-- 12. RLS POLICIES
-- =========================
-- Enable RLS on all tables
ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE feature_flags ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenant_feature_flags ENABLE ROW LEVEL SECURITY;
ALTER TABLE pipelines ENABLE ROW LEVEL SECURITY;
ALTER TABLE pipeline_stages ENABLE ROW LEVEL SECURITY;
ALTER TABLE tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE lead_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE lead_stage_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE interactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE import_logs ENABLE ROW LEVEL SECURITY;

-- Helper function: get tenant_id for current user
CREATE OR REPLACE FUNCTION get_user_tenant_id()
RETURNS UUID AS $$
  SELECT tenant_id FROM user_profiles WHERE user_id = auth.uid() LIMIT 1;
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Helper function: get role for current user
CREATE OR REPLACE FUNCTION get_user_role()
RETURNS TEXT AS $$
  SELECT role FROM user_profiles WHERE user_id = auth.uid() LIMIT 1;
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- == TENANTS ==
DROP POLICY IF EXISTS "tenants_select" ON tenants;
CREATE POLICY "tenants_select" ON tenants
  FOR SELECT USING (id = get_user_tenant_id());

DROP POLICY IF EXISTS "tenants_update" ON tenants;
CREATE POLICY "tenants_update" ON tenants
  FOR UPDATE USING (id = get_user_tenant_id() AND get_user_role() = 'admin');

-- == USER PROFILES ==
DROP POLICY IF EXISTS "user_profiles_select" ON user_profiles;
CREATE POLICY "user_profiles_select" ON user_profiles
  FOR SELECT USING (tenant_id = get_user_tenant_id());

DROP POLICY IF EXISTS "user_profiles_update_self" ON user_profiles;
CREATE POLICY "user_profiles_update_self" ON user_profiles
  FOR UPDATE USING (user_id = auth.uid());

DROP POLICY IF EXISTS "user_profiles_insert" ON user_profiles;
CREATE POLICY "user_profiles_insert" ON user_profiles
  FOR INSERT WITH CHECK (tenant_id = get_user_tenant_id() AND get_user_role() = 'admin');

-- == FEATURE FLAGS (global, read-only for all) ==
DROP POLICY IF EXISTS "feature_flags_select" ON feature_flags;
CREATE POLICY "feature_flags_select" ON feature_flags
  FOR SELECT USING (true);

-- == TENANT FEATURE FLAGS ==
DROP POLICY IF EXISTS "tenant_feature_flags_select" ON tenant_feature_flags;
CREATE POLICY "tenant_feature_flags_select" ON tenant_feature_flags
  FOR SELECT USING (tenant_id = get_user_tenant_id());

-- == PIPELINES ==
DROP POLICY IF EXISTS "pipelines_select" ON pipelines;
CREATE POLICY "pipelines_select" ON pipelines
  FOR SELECT USING (tenant_id = get_user_tenant_id());

DROP POLICY IF EXISTS "pipelines_insert" ON pipelines;
CREATE POLICY "pipelines_insert" ON pipelines
  FOR INSERT WITH CHECK (tenant_id = get_user_tenant_id() AND get_user_role() = 'admin');

DROP POLICY IF EXISTS "pipelines_update" ON pipelines;
CREATE POLICY "pipelines_update" ON pipelines
  FOR UPDATE USING (tenant_id = get_user_tenant_id() AND get_user_role() = 'admin');

-- == PIPELINE STAGES ==
DROP POLICY IF EXISTS "pipeline_stages_select" ON pipeline_stages;
CREATE POLICY "pipeline_stages_select" ON pipeline_stages
  FOR SELECT USING (
    pipeline_id IN (SELECT id FROM pipelines WHERE tenant_id = get_user_tenant_id())
  );

DROP POLICY IF EXISTS "pipeline_stages_insert" ON pipeline_stages;
CREATE POLICY "pipeline_stages_insert" ON pipeline_stages
  FOR INSERT WITH CHECK (
    pipeline_id IN (SELECT id FROM pipelines WHERE tenant_id = get_user_tenant_id())
    AND get_user_role() = 'admin'
  );

DROP POLICY IF EXISTS "pipeline_stages_update" ON pipeline_stages;
CREATE POLICY "pipeline_stages_update" ON pipeline_stages
  FOR UPDATE USING (
    pipeline_id IN (SELECT id FROM pipelines WHERE tenant_id = get_user_tenant_id())
    AND get_user_role() = 'admin'
  );

DROP POLICY IF EXISTS "pipeline_stages_delete" ON pipeline_stages;
CREATE POLICY "pipeline_stages_delete" ON pipeline_stages
  FOR DELETE USING (
    pipeline_id IN (SELECT id FROM pipelines WHERE tenant_id = get_user_tenant_id())
    AND get_user_role() = 'admin'
  );

-- == TAGS ==
DROP POLICY IF EXISTS "tags_select" ON tags;
CREATE POLICY "tags_select" ON tags
  FOR SELECT USING (tenant_id = get_user_tenant_id());

DROP POLICY IF EXISTS "tags_insert" ON tags;
CREATE POLICY "tags_insert" ON tags
  FOR INSERT WITH CHECK (tenant_id = get_user_tenant_id() AND get_user_role() IN ('operator', 'manager', 'admin'));

DROP POLICY IF EXISTS "tags_update" ON tags;
CREATE POLICY "tags_update" ON tags
  FOR UPDATE USING (tenant_id = get_user_tenant_id() AND get_user_role() IN ('manager', 'admin'));

DROP POLICY IF EXISTS "tags_delete" ON tags;
CREATE POLICY "tags_delete" ON tags
  FOR DELETE USING (tenant_id = get_user_tenant_id() AND get_user_role() IN ('manager', 'admin'));

-- == LEADS ==
DROP POLICY IF EXISTS "leads_select" ON leads;
CREATE POLICY "leads_select" ON leads
  FOR SELECT USING (tenant_id = get_user_tenant_id() AND deleted_at IS NULL);

DROP POLICY IF EXISTS "leads_insert" ON leads;
CREATE POLICY "leads_insert" ON leads
  FOR INSERT WITH CHECK (tenant_id = get_user_tenant_id() AND get_user_role() IN ('operator', 'manager', 'admin'));

DROP POLICY IF EXISTS "leads_update" ON leads;
CREATE POLICY "leads_update" ON leads
  FOR UPDATE USING (tenant_id = get_user_tenant_id() AND get_user_role() IN ('operator', 'manager', 'admin'));

DROP POLICY IF EXISTS "leads_delete" ON leads;
CREATE POLICY "leads_delete" ON leads
  FOR DELETE USING (tenant_id = get_user_tenant_id() AND get_user_role() IN ('manager', 'admin'));

-- == LEAD TAGS ==
DROP POLICY IF EXISTS "lead_tags_select" ON lead_tags;
CREATE POLICY "lead_tags_select" ON lead_tags
  FOR SELECT USING (
    lead_id IN (SELECT id FROM leads WHERE tenant_id = get_user_tenant_id())
  );

DROP POLICY IF EXISTS "lead_tags_insert" ON lead_tags;
CREATE POLICY "lead_tags_insert" ON lead_tags
  FOR INSERT WITH CHECK (
    lead_id IN (SELECT id FROM leads WHERE tenant_id = get_user_tenant_id())
    AND get_user_role() IN ('operator', 'manager', 'admin')
  );

DROP POLICY IF EXISTS "lead_tags_delete" ON lead_tags;
CREATE POLICY "lead_tags_delete" ON lead_tags
  FOR DELETE USING (
    lead_id IN (SELECT id FROM leads WHERE tenant_id = get_user_tenant_id())
    AND get_user_role() IN ('operator', 'manager', 'admin')
  );

-- == LEAD STAGE HISTORY ==
DROP POLICY IF EXISTS "lead_stage_history_select" ON lead_stage_history;
CREATE POLICY "lead_stage_history_select" ON lead_stage_history
  FOR SELECT USING (
    lead_id IN (SELECT id FROM leads WHERE tenant_id = get_user_tenant_id())
  );

DROP POLICY IF EXISTS "lead_stage_history_insert" ON lead_stage_history;
CREATE POLICY "lead_stage_history_insert" ON lead_stage_history
  FOR INSERT WITH CHECK (
    lead_id IN (SELECT id FROM leads WHERE tenant_id = get_user_tenant_id())
  );

-- == INTERACTIONS ==
DROP POLICY IF EXISTS "interactions_select" ON interactions;
CREATE POLICY "interactions_select" ON interactions
  FOR SELECT USING (tenant_id = get_user_tenant_id());

DROP POLICY IF EXISTS "interactions_insert" ON interactions;
CREATE POLICY "interactions_insert" ON interactions
  FOR INSERT WITH CHECK (tenant_id = get_user_tenant_id() AND get_user_role() IN ('operator', 'manager', 'admin'));

-- == IMPORT LOGS ==
DROP POLICY IF EXISTS "import_logs_select" ON import_logs;
CREATE POLICY "import_logs_select" ON import_logs
  FOR SELECT USING (tenant_id = get_user_tenant_id());

DROP POLICY IF EXISTS "import_logs_insert" ON import_logs;
CREATE POLICY "import_logs_insert" ON import_logs
  FOR INSERT WITH CHECK (tenant_id = get_user_tenant_id() AND get_user_role() = 'admin');
