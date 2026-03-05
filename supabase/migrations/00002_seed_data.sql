-- ============================================================
-- CRM WhatsApp & Email — Migration 00002: Seed Data
-- Epic 01 / US 01.1 — Dados iniciais (feature flags + planos)
--
-- REGRAS:
--   ✅ Idempotente (ON CONFLICT DO NOTHING)
--   ✅ Pode ser re-executado sem erro
-- ============================================================

-- =========================
-- 1. FEATURE FLAGS INICIAIS
-- =========================
INSERT INTO feature_flags (key, description, enabled_by_default, plan_ids) VALUES
  -- CRM Core (Epic 01)
  ('crm_import_leads', 'Importação de leads via CSV/Excel/Paste', true, ARRAY['free', 'pro', 'business']),
  ('crm_lead_scoring', 'Lead scoring automático baseado em regras', false, ARRAY['pro', 'business']),
  
  -- Email Marketing (Epic 02)
  ('email_marketing', 'Módulo de email marketing (envio + templates)', false, ARRAY['pro', 'business']),
  ('email_template_editor', 'Editor visual drag-and-drop de templates', false, ARRAY['pro', 'business']),
  ('email_broadcast', 'Envio em massa de emails (broadcast)', false, ARRAY['pro', 'business']),
  
  -- WhatsApp (Epic 03)
  ('whatsapp_integration', 'Integração com WhatsApp Business API', false, ARRAY['business']),
  ('whatsapp_messaging', 'Envio de mensagens WhatsApp (individual + broadcast)', false, ARRAY['business']),
  ('whatsapp_inbox', 'Inbox centralizado de WhatsApp', false, ARRAY['business']),
  
  -- Jornadas (Epic 04)
  ('journey_engine', 'Motor de execução de jornadas de automação', false, ARRAY['business']),
  ('journey_editor', 'Editor visual de jornadas (React Flow)', false, ARRAY['business']),
  ('journey_ab_testing', 'A/B Testing em jornadas de automação', false, ARRAY['business']),
  
  -- Dashboard & Analytics (Epic 05)
  ('analytics_dashboard', 'Dashboard principal com KPIs e gráficos', true, ARRAY['free', 'pro', 'business']),
  ('analytics_campaigns', 'Relatórios de campanhas email e WhatsApp', false, ARRAY['pro', 'business']),
  ('analytics_journeys', 'Relatórios de jornadas de automação', false, ARRAY['business'])
ON CONFLICT (key) DO NOTHING;

-- =========================
-- 2. FUNÇÃO: Criar pipeline default para novo tenant
-- =========================
CREATE OR REPLACE FUNCTION create_default_pipeline_for_tenant(p_tenant_id UUID)
RETURNS UUID AS $$
DECLARE
  v_pipeline_id UUID;
BEGIN
  -- Create default pipeline
  INSERT INTO pipelines (tenant_id, name, is_default)
  VALUES (p_tenant_id, 'Pipeline Principal', true)
  RETURNING id INTO v_pipeline_id;

  -- Create default stages
  INSERT INTO pipeline_stages (pipeline_id, name, color, position, is_won, is_lost) VALUES
    (v_pipeline_id, 'Novo',         '#6366f1', 0, false, false), -- indigo
    (v_pipeline_id, 'Contato',      '#3b82f6', 1, false, false), -- blue
    (v_pipeline_id, 'Qualificado',  '#f59e0b', 2, false, false), -- amber
    (v_pipeline_id, 'Proposta',     '#f97316', 3, false, false), -- orange
    (v_pipeline_id, 'Convertido',   '#22c55e', 4, true,  false), -- green (won)
    (v_pipeline_id, 'Perdido',      '#ef4444', 5, false, true);  -- red (lost)

  RETURN v_pipeline_id;
END;
$$ LANGUAGE plpgsql;

-- =========================
-- 3. TRIGGER: Auto-create pipeline when tenant is created
-- =========================
CREATE OR REPLACE FUNCTION trigger_create_default_pipeline()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM create_default_pipeline_for_tenant(NEW.id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_tenant_create_pipeline ON tenants;
CREATE TRIGGER trigger_tenant_create_pipeline
  AFTER INSERT ON tenants
  FOR EACH ROW EXECUTE FUNCTION trigger_create_default_pipeline();
