-- =============================================================
-- CRM WhatsApp & Email — Migration 00006
-- Helpers para o Motor de Jornadas (RPCs e Gatilhos)
-- =============================================================

-- Função para incrementar métricas de steps de forma atômica
CREATE OR REPLACE FUNCTION increment_step_completed(step_id UUID)
RETURNS VOID AS $$
BEGIN
    UPDATE journey_steps
    SET total_completed = total_completed + 1
    WHERE id = step_id;
    
    -- Também incrementa no nó correspondente dentro do canvas_data da jornada
    -- (Opcional, mas útil para o editor ler métricas direto do JSON se quiser)
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função para incrementar entrada em steps
CREATE OR REPLACE FUNCTION increment_step_entered(step_id UUID)
RETURNS VOID AS $$
BEGIN
    UPDATE journey_steps
    SET total_entered = total_entered + 1
    WHERE id = step_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- View para facilitar a identificação de passos de 'wait' pendentes
CREATE OR REPLACE VIEW pending_journey_wait_steps AS
SELECT 
    l.id as log_id,
    l.enrollment_id,
    l.step_id,
    l.started_at,
    s.config->>'waitValue' as wait_value,
    s.config->>'waitUnit' as wait_unit,
    e.tenant_id
FROM journey_step_logs l
JOIN journey_steps s ON l.step_id = s.id
JOIN journey_enrollments e ON l.enrollment_id = e.id
WHERE l.status = 'pending' 
AND s.step_type = 'wait'
AND e.status = 'active';
