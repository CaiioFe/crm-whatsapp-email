// ============================================================
// CRM WhatsApp & Email — API: Manual Journey Enrollment
// US 03.1 — Endpoint para inscrever um lead manualmente
// ============================================================

import { NextRequest } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { requirePermission } from "@/lib/rbac";
import { enrollLeadInJourney } from "@/lib/journeys";

export async function POST(request: NextRequest) {
    try {
        const supabase = await createSupabaseServerClient();

        // RBAC enforcement (Need permission to edit/manage journeys)
        await requirePermission('journeys.activate');

        const body = await request.json();
        const { leadId, journeyId } = body;

        if (!leadId || !journeyId) {
            return new Response(JSON.stringify({ error: "Parâmetros insuficientes" }), { status: 400 });
        }

        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });

        const { data: profile } = await supabase.from('user_profiles').select('tenant_id').eq('user_id', user.id).single();
        if (!profile) return new Response(JSON.stringify({ error: "Profile not found" }), { status: 400 });

        const enrollment = await enrollLeadInJourney(supabase, profile.tenant_id, leadId, journeyId);

        return new Response(JSON.stringify(enrollment), {
            status: 200,
            headers: { "Content-Type": "application/json" }
        });

    } catch (err: any) {
        console.error("[JOURNEY ENROLL ERROR]:", err);
        return new Response(
            JSON.stringify({
                error: err.message || "Erro interno ao inscrever lead.",
            }),
            { status: 500, headers: { "Content-Type": "application/json" } }
        );
    }
}
