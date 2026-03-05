// ============================================================
// CRM WhatsApp & Email — API: Save Journey
// US 04.1 — Endpoint para salvar/atualizar jornadas
// ============================================================

import { NextRequest } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { requirePermission } from "@/lib/rbac";

export async function POST(request: NextRequest) {
    try {
        const supabase = await createSupabaseServerClient();

        // RBAC enforcement
        await requirePermission('journeys.edit');

        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });

        const { data: profile } = await supabase.from('user_profiles').select('tenant_id').eq('user_id', user.id).single();
        if (!profile) return new Response(JSON.stringify({ error: "Profile not found" }), { status: 400 });

        const body = await request.json();
        const { id, name, description, trigger_type, canvas_data, status } = body;

        const journeyData = {
            tenant_id: profile.tenant_id,
            name: name || "Nova Jornada",
            description: description || "",
            trigger_type: trigger_type || "manual",
            canvas_data: canvas_data || { nodes: [], edges: [] },
            status: status || 'draft',
            updated_at: new Date().toISOString(),
        };

        let result;
        if (id) {
            // Update
            result = await supabase
                .from('journeys')
                .update(journeyData)
                .eq('id', id)
                .eq('tenant_id', profile.tenant_id)
                .select()
                .single();
        } else {
            // Create
            result = await supabase
                .from('journeys')
                .insert({ ...journeyData, created_by: user.id })
                .select()
                .single();
        }

        if (result.error) throw result.error;

        const journey = result.data;

        // NEW: Normalization logic for active journeys
        if (status === 'active') {
            const { normalizeJourney } = await import("@/lib/journeys");
            await normalizeJourney(supabase, journey.id, profile.tenant_id, canvas_data);
        }

        return new Response(JSON.stringify(journey), {
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
