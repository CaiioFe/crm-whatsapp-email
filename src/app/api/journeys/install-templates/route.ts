// ============================================================
// CRM WhatsApp & Email — API: Install Templates
// US 04.1 — Endpoint para instalar modelos pré-definidos
// ============================================================

import { NextRequest } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { requirePermission } from "@/lib/rbac";

const JOURNEY_TEMPLATES = [
    {
        name: "Boas-vindas Imediato (WhatsApp)",
        description: "Envia um WhatsApp imediato assim que o lead é criado.",
        trigger_type: "lead_created",
        canvas_data: {
            nodes: [
                {
                    id: "trigger-1",
                    type: "journeyNode",
                    position: { x: 400, y: 100 },
                    data: { nodeType: "trigger", label: "Novo Lead Criado", triggerType: "lead_created" }
                },
                {
                    id: "whatsapp-1",
                    type: "journeyNode",
                    position: { x: 400, y: 300 },
                    data: {
                        nodeType: "send_whatsapp",
                        label: "WhatsApp de Boas-vindas",
                        content: "Olá {{nome}}, tudo bem? Vi seu interesse no nosso CRM! Como posso te ajudar hoje?"
                    }
                }
            ],
            edges: [
                { id: "e1-2", source: "trigger-1", target: "whatsapp-1", markerEnd: { type: "arrowclosed" } }
            ]
        }
    },
    {
        name: "Recuperação de Lead (3 Dias)",
        description: "Tenta contato 3 dias após a criação se o lead ainda estiver no estágio inicial.",
        trigger_type: "lead_created",
        canvas_data: {
            nodes: [
                {
                    id: "trigger-1",
                    type: "journeyNode",
                    position: { x: 400, y: 100 },
                    data: { nodeType: "trigger", label: "Lead Criado", triggerType: "lead_created" }
                },
                {
                    id: "wait-1",
                    type: "journeyNode",
                    position: { x: 400, y: 250 },
                    data: { nodeType: "wait", label: "Esperar 3 dias", waitValue: 3, waitUnit: "days" }
                },
                {
                    id: "whatsapp-1",
                    type: "journeyNode",
                    position: { x: 400, y: 400 },
                    data: {
                        nodeType: "send_whatsapp",
                        label: "WhatsApp de Recuperação",
                        content: "Oi {{nome}}, ainda estou te aguardando para conversarmos sobre seu projeto. Tem um tempinho hoje?"
                    }
                }
            ],
            edges: [
                { id: "e1-2", source: "trigger-1", target: "wait-1", markerEnd: { type: "arrowclosed" } },
                { id: "e2-3", source: "wait-1", target: "whatsapp-1", markerEnd: { type: "arrowclosed" } }
            ]
        }
    },
    {
        name: "Nutrição de Estágio (Condicional)",
        description: "Fluxo completo com espera e moviemntação automática.",
        trigger_type: "lead_created",
        canvas_data: {
            nodes: [
                {
                    id: "trigger-1",
                    type: "journeyNode",
                    position: { x: 400, y: 50 },
                    data: { nodeType: "trigger", label: "Entrada", triggerType: "lead_created" }
                },
                {
                    id: "email-1",
                    type: "journeyNode",
                    position: { x: 400, y: 200 },
                    data: { nodeType: "send_email", label: "Email de Boas-vindas" }
                },
                {
                    id: "wait-1",
                    type: "journeyNode",
                    position: { x: 400, y: 350 },
                    data: { nodeType: "wait", label: "Esperar 24h", waitValue: 24, waitUnit: "hours" }
                },
                {
                    id: "whatsapp-1",
                    type: "journeyNode",
                    position: { x: 400, y: 500 },
                    data: {
                        nodeType: "send_whatsapp",
                        label: "WhatsApp de Check-in",
                        content: "Olá {{nome}}, recebeu meu email com os detalhes?"
                    }
                }
            ],
            edges: [
                { id: "e1", source: "trigger-1", target: "email-1", markerEnd: { type: "arrowclosed" } },
                { id: "e2", source: "email-1", target: "wait-1", markerEnd: { type: "arrowclosed" } },
                { id: "e3", source: "wait-1", target: "whatsapp-1", markerEnd: { type: "arrowclosed" } }
            ]
        }
    }
];

export async function POST(request: NextRequest) {
    try {
        const supabase = await createSupabaseServerClient();
        await requirePermission('journeys.edit');

        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });

        const { data: profile } = await supabase.from('user_profiles').select('tenant_id').eq('user_id', user.id).single();
        if (!profile) return new Response(JSON.stringify({ error: "Profile not found" }), { status: 400 });

        // Insert multiple templates
        const inserts = JOURNEY_TEMPLATES.map(tpl => ({
            ...tpl,
            tenant_id: profile.tenant_id,
            status: 'draft',
            created_by: user.id
        }));

        const { data, error } = await supabase.from('journeys').insert(inserts).select();

        if (error) throw error;

        return new Response(JSON.stringify({ message: "Templates installed", count: data.length }), {
            status: 200,
            headers: { "Content-Type": "application/json" }
        });

    } catch (err) {
        return new Response(
            JSON.stringify({
                error: err instanceof Error ? err.message : "Internal Server Error",
            }),
            { status: 500, headers: { "Content-Type": "application/json" } }
        );
    }
}
