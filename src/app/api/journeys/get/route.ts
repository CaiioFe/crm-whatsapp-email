// ============================================================
// CRM WhatsApp & Email — API: Get Journey
// US 04.1 — Endpoint para carregar jornada pelo ID
// ============================================================

import { NextRequest } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { requirePermission } from "@/lib/rbac";

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const id = searchParams.get("id");

        if (!id) {
            return new Response(JSON.stringify({ error: "ID is required" }), { status: 400 });
        }

        const supabase = await createSupabaseServerClient();

        // RBAC enforcement
        await requirePermission('journeys.view');

        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });

        const { data: profile } = await supabase.from('user_profiles').select('tenant_id').eq('user_id', user.id).single();
        if (!profile) return new Response(JSON.stringify({ error: "Profile not found" }), { status: 400 });

        const { data, error } = await supabase
            .from('journeys')
            .select('*')
            .eq('id', id)
            .eq('tenant_id', profile.tenant_id)
            .single();

        if (error) throw error;
        if (!data) return new Response(JSON.stringify({ error: "Journey not found" }), { status: 404 });

        return new Response(JSON.stringify(data), {
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
