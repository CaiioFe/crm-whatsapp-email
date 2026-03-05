-- =============================================================
-- CRM WhatsApp & Email — Migration 00005
-- Tabelas de Jornadas de Automação (Epic 04)
-- Idempotente e segura para múltiplas execuções
-- =============================================================

-- Tabela de jornadas
CREATE TABLE IF NOT EXISTS journeys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'paused', 'completed', 'archived')),
  
  -- Trigger
  trigger_type TEXT NOT NULL DEFAULT 'manual' CHECK (trigger_type IN ('manual', 'lead_created', 'stage_changed', 'tag_added', 'score_threshold', 'inactivity', 'form_submitted')),
  trigger_config JSONB DEFAULT '{}'::jsonb,
  
  -- Canvas (React Flow nodes/edges)
  canvas_data JSONB DEFAULT '{"nodes":[],"edges":[]}'::jsonb,
  
  -- Métricas
  total_enrolled INTEGER DEFAULT 0,
  total_completed INTEGER DEFAULT 0,
  total_dropped INTEGER DEFAULT 0,
  conversion_rate NUMERIC(5,2) DEFAULT 0,
  
  -- Agendamento
  starts_at TIMESTAMPTZ,
  ends_at TIMESTAMPTZ,
  
  -- Critérios de Saída Automática
  exit_criteria JSONB DEFAULT '[]'::jsonb,
  
  created_by UUID,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Steps de uma jornada
CREATE TABLE IF NOT EXISTS journey_steps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  journey_id UUID NOT NULL REFERENCES journeys(id) ON DELETE CASCADE,
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  
  step_type TEXT NOT NULL CHECK (step_type IN ('send_email', 'send_whatsapp', 'wait', 'condition', 'split_ab', 'update_lead', 'add_tag', 'remove_tag', 'change_stage', 'webhook', 'notify_team')),
  name TEXT NOT NULL DEFAULT '',
  config JSONB NOT NULL DEFAULT '{}'::jsonb,
  
  -- Position no canvas
  position_x NUMERIC DEFAULT 0,
  position_y NUMERIC DEFAULT 0,
  
  -- Métricas por step
  total_entered INTEGER DEFAULT 0,
  total_completed INTEGER DEFAULT 0,
  
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Conexões entre steps
CREATE TABLE IF NOT EXISTS journey_edges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  journey_id UUID NOT NULL REFERENCES journeys(id) ON DELETE CASCADE,
  source_step_id UUID NOT NULL REFERENCES journey_steps(id) ON DELETE CASCADE,
  target_step_id UUID NOT NULL REFERENCES journey_steps(id) ON DELETE CASCADE,
  condition_label TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Inscrições de leads em jornadas
CREATE TABLE IF NOT EXISTS journey_enrollments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  journey_id UUID NOT NULL REFERENCES journeys(id) ON DELETE CASCADE,
  lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed', 'dropped', 'paused')),
  current_step_id UUID REFERENCES journey_steps(id) ON DELETE SET NULL,
  
  enrolled_at TIMESTAMPTZ DEFAULT now(),
  completed_at TIMESTAMPTZ,
  dropped_at TIMESTAMPTZ,
  
  -- A/B variant
  ab_variant TEXT,
  
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  
  UNIQUE(journey_id, lead_id)
);

-- Log de execução por step
CREATE TABLE IF NOT EXISTS journey_step_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  enrollment_id UUID NOT NULL REFERENCES journey_enrollments(id) ON DELETE CASCADE,
  step_id UUID NOT NULL REFERENCES journey_steps(id) ON DELETE CASCADE,
  
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'executing', 'completed', 'failed', 'skipped')),
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  error_message TEXT,
  result JSONB DEFAULT '{}'::jsonb,
  
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_journeys_tenant ON journeys(tenant_id);
CREATE INDEX IF NOT EXISTS idx_journeys_status ON journeys(status);
CREATE INDEX IF NOT EXISTS idx_journey_steps_journey ON journey_steps(journey_id);
CREATE INDEX IF NOT EXISTS idx_journey_enrollments_journey ON journey_enrollments(journey_id);
CREATE INDEX IF NOT EXISTS idx_journey_enrollments_lead ON journey_enrollments(lead_id);
CREATE INDEX IF NOT EXISTS idx_journey_enrollments_status ON journey_enrollments(status);
CREATE INDEX IF NOT EXISTS idx_journey_step_logs_enrollment ON journey_step_logs(enrollment_id);

-- RLS
ALTER TABLE journeys ENABLE ROW LEVEL SECURITY;
ALTER TABLE journey_steps ENABLE ROW LEVEL SECURITY;
ALTER TABLE journey_edges ENABLE ROW LEVEL SECURITY;
ALTER TABLE journey_enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE journey_step_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "tenant_isolation_journeys" ON journeys;
CREATE POLICY "tenant_isolation_journeys" ON journeys
  USING (tenant_id = (current_setting('app.current_tenant_id', true))::uuid);

DROP POLICY IF EXISTS "tenant_isolation_journey_steps" ON journey_steps;
CREATE POLICY "tenant_isolation_journey_steps" ON journey_steps
  USING (tenant_id = (current_setting('app.current_tenant_id', true))::uuid);

DROP POLICY IF EXISTS "tenant_isolation_journey_enrollments" ON journey_enrollments;
CREATE POLICY "tenant_isolation_journey_enrollments" ON journey_enrollments
  USING (tenant_id = (current_setting('app.current_tenant_id', true))::uuid);

DROP POLICY IF EXISTS "tenant_isolation_journey_step_logs" ON journey_step_logs;
CREATE POLICY "tenant_isolation_journey_step_logs" ON journey_step_logs
  USING (enrollment_id IN (SELECT id FROM journey_enrollments));

-- Trigger para saída automática de jornada quando o estágio do lead muda
CREATE OR REPLACE FUNCTION handle_lead_journey_exit()
RETURNS TRIGGER AS $$
DECLARE
    entry RECORD;
BEGIN
    -- Verifica se o current_stage_id mudou
    IF OLD.current_stage_id IS DISTINCT FROM NEW.current_stage_id THEN
        -- Busca inscrições ativas para este lead
        FOR entry IN 
            SELECT je.id, j.exit_criteria 
            FROM journey_enrollments je
            JOIN journeys j ON j.id = je.journey_id
            WHERE je.lead_id = NEW.id AND je.status = 'active'
        LOOP
            -- Verifica se o novo estágio está nos critérios de saída
            IF EXISTS (
                SELECT 1 FROM jsonb_array_elements(entry.exit_criteria) AS criteria
                WHERE criteria->>'type' = 'stage_changed' 
                AND criteria->>'target_stage_id' = NEW.current_stage_id::text
            ) THEN
                UPDATE journey_enrollments 
                SET status = 'completed', 
                    completed_at = now(),
                    metadata = jsonb_set(metadata, '{exit_reason}', '"stage_changed"')
                WHERE id = entry.id;
                
                -- Loga a saída
                INSERT INTO journey_step_logs (enrollment_id, step_id, status, error_message, started_at, completed_at)
                SELECT entry.id, je.current_step_id, 'skipped', 'Interrompido por mudança de estágio', now(), now()
                FROM journey_enrollments je WHERE je.id = entry.id;
            END IF;
        END LOOP;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_lead_journey_exit ON leads;
CREATE TRIGGER trg_lead_journey_exit
  AFTER UPDATE OF current_stage_id ON leads
  FOR EACH ROW
  EXECUTE FUNCTION handle_lead_journey_exit();

-- Seed feature flags for journeys
INSERT INTO feature_flags (key, description, is_enabled, allowed_plans) VALUES
  ('journeys_enabled', 'Jornadas de automação', false, ARRAY['pro','business']),
  ('journey_editor_enabled', 'Editor visual de jornadas', false, ARRAY['pro','business']),
  ('journey_ab_testing', 'A/B testing em jornadas', false, ARRAY['business']),
  ('journey_webhooks', 'Webhooks em jornadas', false, ARRAY['business'])
ON CONFLICT (key) DO NOTHING;
