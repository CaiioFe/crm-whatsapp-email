// ============================================================
// CRM WhatsApp & Email — Lib: Journey Service
// Logic for normalizing canvas data and handling execution
// ============================================================

import { SupabaseClient } from "@supabase/supabase-js";

export interface CanvasNode {
    id: string;
    type: string;
    data: {
        nodeType: string;
        label: string;
        [key: string]: any;
    };
    position: { x: number; y: number };
}

export interface CanvasEdge {
    id: string;
    source: string;
    target: string;
    label?: string;
}

export interface CanvasData {
    nodes: CanvasNode[];
    edges: CanvasEdge[];
}

/**
 * Normalizes canvas data (JSON) into relational tables (journey_steps, journey_edges)
 * for a specific journey. This is typically called when a journey is activated.
 */
export async function normalizeJourney(supabase: SupabaseClient, journeyId: string, tenantId: string, canvasData: CanvasData) {
    const { nodes, edges } = canvasData;

    // 1. Clean up existing relational data
    // We do a clean slate approach for the relational structure to avoid drift
    await supabase.from('journey_edges').delete().eq('journey_id', journeyId);
    await supabase.from('journey_steps').delete().eq('journey_id', journeyId);

    // 2. Identify the Trigger
    const triggerNode = nodes.find(n => n.data.nodeType === 'trigger');
    if (triggerNode) {
        // Update the main journey record with trigger info
        await supabase
            .from('journeys')
            .update({
                trigger_type: triggerNode.data.triggerType || 'manual',
                trigger_config: triggerNode.data
            })
            .eq('id', journeyId);
    }

    // 3. Insert Steps and create a mapping (canvasId -> dbId)
    const nodeMapping: Record<string, string> = {};

    for (const node of nodes) {
        // Skip the trigger node for steps table? 
        // Actually, the engine might need the trigger as the starting point, 
        // but usually, the first REAL action is the start.
        // Let's keep it for consistency.

        const { data: step, error } = await supabase
            .from('journey_steps')
            .insert({
                journey_id: journeyId,
                tenant_id: tenantId,
                step_type: node.data.nodeType as any,
                name: node.data.label,
                config: node.data,
                position_x: node.position.x,
                position_y: node.position.y
            })
            .select('id')
            .single();

        if (error) throw error;
        nodeMapping[node.id] = step.id;
    }

    // 4. Insert Edges using the mapping
    for (const edge of edges) {
        const sourceStepId = nodeMapping[edge.source];
        const targetStepId = nodeMapping[edge.target];

        if (sourceStepId && targetStepId) {
            const { error: edgeErr } = await supabase
                .from('journey_edges')
                .insert({
                    journey_id: journeyId,
                    source_step_id: sourceStepId,
                    target_step_id: targetStepId,
                    condition_label: edge.label || null
                });

            if (edgeErr) throw edgeErr;
        }
    }

    return { stepsCount: nodes.length, edgesCount: edges.length };
}

/**
 * Enrolls one or more leads into journeys matching a specific trigger event.
 */
export async function enrollLeadsInJourneys(supabase: SupabaseClient, tenantId: string, event: 'lead_created' | 'tag_added' | 'stage_changed', leadId: string) {
    // 1. Find relevant active journeys
    const { data: journeys, error } = await supabase
        .from('journeys')
        .select('id, name')
        .eq('tenant_id', tenantId)
        .eq('status', 'active')
        .eq('trigger_type', event);

    if (error || !journeys?.length) return;

    for (const journey of journeys) {
        try {
            // Find the first step after the trigger
            const { data: triggerStep } = await supabase
                .from('journey_steps')
                .select('id')
                .eq('journey_id', journey.id)
                .eq('step_type', 'trigger')
                .single();

            if (!triggerStep) continue;

            const { data: nextEdge } = await supabase
                .from('journey_edges')
                .select('target_step_id')
                .eq('source_step_id', triggerStep.id)
                .single();

            if (!nextEdge) continue;

            // Enroll the lead
            const { data: enrollment, error: enrollErr } = await supabase
                .from('journey_enrollments')
                .insert({
                    journey_id: journey.id,
                    lead_id: leadId,
                    tenant_id: tenantId,
                    status: 'active',
                    current_step_id: nextEdge.target_step_id
                })
                .select()
                .single();

            if (enrollErr) {
                // Ignore unique constraint errors (already enrolled)
                if (enrollErr.code !== '23505') console.error('Enrollment error:', enrollErr);
                continue;
            }

            // Start immediate execution for this lead
            await executeStep(supabase, enrollment.id);

        } catch (err) {
            console.error(`Error enrolling lead ${leadId} in journey ${journey.id}:`, err);
        }
    }
}

/**
 * Processes the current step of an enrollment.
 */
export async function executeStep(supabase: SupabaseClient, enrollmentId: string) {
    const { data: enrollment, error: enrollErr } = await supabase
        .from('journey_enrollments')
        .select('*, journey_steps!journey_enrollments_current_step_id_fkey(*)')
        .eq('id', enrollmentId)
        .single();

    if (enrollErr || !enrollment || enrollment.status !== 'active') return;

    const currentStep = enrollment.journey_steps;
    if (!currentStep) return;

    // Track entry metric
    try {
        await supabase.rpc('increment_step_entered', { step_id: currentStep.id });
    } catch {
        // Fallback for missing RPC
        await supabase.from('journey_steps').update({ total_entered: (currentStep.total_entered || 0) + 1 }).eq('id', currentStep.id);
    }

    // Log start
    const { data: logEntry } = await supabase
        .from('journey_step_logs')
        .insert({
            enrollment_id: enrollmentId,
            step_id: currentStep.id,
            status: 'executing',
            started_at: new Date().toISOString()
        })
        .select()
        .single();

    try {
        let executionResult: Record<string, any> = { success: true };

        // Process based on step type
        switch (currentStep.step_type) {
            case 'send_email':
                if (currentStep.config?.templateId) {
                    const { data: template } = await supabase.from('email_templates').select('*').eq('id', currentStep.config.templateId).single();
                    if (template) {
                        const { data: lead } = await supabase.from('leads').select('*').eq('id', enrollment.lead_id).single();
                        const variables = {
                            nome: lead?.name || lead?.contact_name || "Cliente",
                            email: lead?.email || "",
                            empresa: lead?.company_name || "",
                            estagio: lead?.current_stage_id || "",
                        };

                        // Render subject
                        let subject = template.subject || currentStep.config.subject;
                        for (const [k, v] of Object.entries(variables)) {
                            subject = subject.replace(new RegExp(`\\{\\{${k}\\}\\}`, "g"), v);
                        }

                        console.log(`[JOURNEY] Sending email template "${template.name}" with subject "${subject}" to lead ${enrollment.lead_id} (${lead?.email})`);
                        executionResult = {
                            success: true,
                            channel: 'email',
                            template: template.name,
                            subject: subject,
                            recipient: lead?.email
                        };
                    }
                } else {
                    console.log(`[JOURNEY] Sending basic email: ${currentStep.config?.subject} to lead ${enrollment.lead_id}`);
                    executionResult = { success: true, channel: 'email' };
                }
                break;

            case 'send_whatsapp':
                if (currentStep.config?.content) {
                    const { data: lead } = await supabase.from('leads').select('*').eq('id', enrollment.lead_id).single();
                    // 1. Build a rich variable map including custom_fields
                    const variables: Record<string, any> = {
                        name: lead?.name || "Cliente",
                        nome: lead?.name?.split(' ')[0] || "Cliente", // First name as 'nome'
                        email: lead?.email || "",
                        company: lead?.company || "",
                        empresa: lead?.company || "",
                        phone: lead?.phone || "",
                        ...lead, // Spread all lead fields (id, source, etc)
                        custom_fields: lead?.custom_fields || {}
                    };

                    // 2. Helper to resolve deep paths like {{custom_fields.Faturamento}}
                    const resolvePath = (path: string, obj: any) => {
                        return path.split('.').reduce((prev, curr) => (prev && prev[curr] !== undefined) ? prev[curr] : null, obj);
                    };

                    // 3. Replace variables in content using regex to find {{path.to.var}}
                    let content = currentStep.config.content;
                    const matches = content.match(/\{\{([^}]+)\}\}/g);

                    if (matches) {
                        for (const match of matches) {
                            const path = match.replace(/\{\{|\}\}/g, "").trim();
                            const resolvedValue = resolvePath(path, variables);
                            if (resolvedValue !== null) {
                                content = content.replace(match, String(resolvedValue));
                            }
                        }
                    }

                    // Get WhatsApp config
                    const { data: waConfig } = await supabase
                        .from('whatsapp_provider_configs')
                        .select('*')
                        .eq('tenant_id', enrollment.tenant_id)
                        .eq('provider', 'evolution')
                        .eq('is_enabled', true)
                        .single();

                    if (waConfig && lead?.phone) {
                        try {
                            const baseUrl = waConfig.api_url.replace(/\/$/, "");
                            const instance = waConfig.instance_name;
                            const leadPhone = lead.phone.replace(/\D/g, ""); // Clean phone number

                            const response = await fetch(`${baseUrl}/message/sendText/${instance}`, {
                                method: "POST",
                                headers: {
                                    "Content-Type": "application/json",
                                    "apikey": waConfig.api_key_encrypted
                                },
                                body: JSON.stringify({
                                    number: leadPhone.startsWith("55") ? leadPhone : `55${leadPhone}`,
                                    options: { delay: 1200, presence: "composing" },
                                    textMessage: { text: content }
                                })
                            });

                            const resData = await response.json();

                            if (response.ok) {
                                console.log(`[JOURNEY] WhatsApp sent to ${leadPhone}: ${content.substring(0, 30)}...`);
                                executionResult = { success: true, channel: 'whatsapp', result: resData };
                            } else {
                                throw new Error(resData.message || "Evolution API Error");
                            }
                        } catch (err) {
                            console.error("[JOURNEY] WhatsApp Error:", err);
                            throw err; // This will trigger the catch block below
                        }
                    } else {
                        console.log(`[JOURNEY] Skipping WhatsApp: Config missing or lead has no phone.`);
                        executionResult = { success: false, error: 'Config missing or phone missing' };
                    }
                }
                break;

            case 'add_tag':
                if (currentStep.config?.tagId) {
                    try {
                        await supabase.from('lead_tags').insert({
                            lead_id: enrollment.lead_id,
                            tag_id: currentStep.config.tagId
                        });
                    } catch (e) {
                        console.error("Error adding tag in journey:", e);
                    }
                }
                break;

            case 'change_stage':
                if (currentStep.config?.stageId) {
                    await supabase.from('leads').update({ current_stage_id: currentStep.config.stageId }).eq('id', enrollment.lead_id);
                }
                break;

            case 'wait':
                // For wait, we calculated the next run time
                const waitValue = parseInt(currentStep.config?.waitValue || '1');
                const waitUnit = currentStep.config?.waitUnit || 'days';

                // Save specific wait info in metadata for the scheduler
                await supabase.from('journey_enrollments').update({
                    metadata: {
                        ...enrollment.metadata,
                        waiting_until: new Date(Date.now() + (waitUnit === 'days' ? waitValue * 86400000 : waitValue * 3600000)).toISOString()
                    }
                }).eq('id', enrollmentId);

                await supabase.from('journey_step_logs').update({ status: 'pending' }).eq('id', logEntry?.id);
                return;

            default:
                console.log(`[JOURNEY] Processing neutral step: ${currentStep.step_type}`);
        }

        // Complete step
        await supabase.from('journey_step_logs').update({
            status: 'completed',
            completed_at: new Date().toISOString(),
            result: executionResult
        }).eq('id', logEntry?.id);

        // Update completion metrics
        try {
            await supabase.rpc('increment_step_completed', { step_id: currentStep.id });
        } catch {
            await supabase.from('journey_steps').update({ total_completed: (currentStep.total_completed || 0) + 1 }).eq('id', currentStep.id);
        }

        // Find next step based on edges
        // If it's a condition node, we might have multiple edges with labels
        const { data: edges } = await supabase
            .from('journey_edges')
            .select('target_step_id, condition_label')
            .eq('source_step_id', currentStep.id);

        if (edges?.length) {
            let targetId = edges[0].target_step_id;

            // Handle branching for conditions
            if (currentStep.step_type === 'condition') {
                const isMatch = await checkCondition(supabase, currentStep.config, enrollment.lead_id);
                const targetEdge = edges.find(e =>
                    e.condition_label?.toLowerCase() === (isMatch ? 'sim' : 'não') ||
                    e.condition_label?.toLowerCase() === (isMatch ? 'true' : 'false')
                );
                if (targetEdge) targetId = targetEdge.target_step_id;
            }

            // Move to next step
            await supabase.from('journey_enrollments').update({
                current_step_id: targetId,
                updated_at: new Date().toISOString()
            }).eq('id', enrollmentId);

            // Continue execution to next step
            // We use setTimeout to break the stack and allow async completion
            setTimeout(() => executeStep(supabase, enrollmentId), 100);
        } else {
            // Journey finished
            await supabase.from('journey_enrollments').update({
                status: 'completed',
                completed_at: new Date().toISOString(),
                current_step_id: null
            }).eq('id', enrollmentId);

            // Update journey metrics
            try {
                await supabase.rpc('increment_journey_completed', { journey_id: enrollment.journey_id });
            } catch { }
        }

    } catch (err) {
        console.error(`Error executing journey step ${currentStep.id}:`, err);
        await supabase.from('journey_step_logs').update({
            status: 'failed',
            error_message: err instanceof Error ? err.message : String(err)
        }).eq('id', logEntry?.id);
    }
}

/**
 * Evaluates a condition node against a lead
 */
async function checkCondition(supabase: SupabaseClient, config: any, leadId: string): Promise<boolean> {
    const { conditionType, operator, value, field } = config;

    // Fetch lead data for evaluation
    const { data: lead } = await supabase.from('leads').select('*').eq('id', leadId).single();
    if (!lead) return false;

    switch (conditionType) {
        case 'field_match':
            const leadValue = lead[field];
            if (operator === 'equals') return String(leadValue) === String(value);
            if (operator === 'contains') return String(leadValue).includes(String(value));
            break;

        case 'has_tag':
            const { count } = await supabase
                .from('lead_tags')
                .select('*', { count: 'exact', head: true })
                .eq('lead_id', leadId)
                .eq('tag_id', value);
            return (count || 0) > 0;

        case 'score_points':
            const score = lead.score || 0;
            const targetScore = parseInt(value);
            if (operator === 'greater_than') return score > targetScore;
            if (operator === 'less_than') return score < targetScore;
            break;
    }

    return false;
}

/**
 * Background worker logic: Processes all leads that finished their 'Wait' period.
 * This should be called by a cron job (Edge Function or GitHub Action)
 */
export async function processPendingWaits(supabase: SupabaseClient) {
    const now = new Date().toISOString();

    // Find active enrollments where metadata.waiting_until is in the past
    const { data: dueEnrollments, error } = await supabase
        .from('journey_enrollments')
        .select('id, current_step_id, journey_id, metadata')
        .eq('status', 'active')
        .not('current_step_id', 'is', null);

    if (error) {
        console.error("Error fetching enrollments for wait check:", error);
        return { processed: 0, error };
    }

    const filtered = dueEnrollments?.filter(e => {
        const waitingUntil = (e.metadata as any)?.waiting_until;
        return waitingUntil && waitingUntil < now;
    }) || [];

    if (!filtered.length) return { processed: 0 };

    for (const enrollment of filtered) {
        // Move lead to the next logical step after the Wait node
        const { data: edges } = await supabase
            .from('journey_edges')
            .select('target_step_id')
            .eq('source_step_id', enrollment.current_step_id);

        if (edges?.length) {
            // Update enrollment to next step
            await supabase.from('journey_enrollments').update({
                current_step_id: edges[0].target_step_id,
                updated_at: new Date().toISOString()
            }).eq('id', enrollment.id);

            // Trigger execution for the new step
            await executeStep(supabase, enrollment.id);
        }
    }

    return { processed: filtered.length };
}

