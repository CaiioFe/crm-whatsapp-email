// ============================================================
// CRM WhatsApp & Email — API: Delete Lead
// Princípio Nº 4: RBAC enforcement (manager+)
// ============================================================

import { NextRequest } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { requirePermission } from "@/lib/rbac";

export async function DELETE(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const id = searchParams.get("id");

        if (!id) {
            return new Response(JSON.stringify({ error: "ID é obrigatório" }), { status: 400 });
        }

        const supabase = await createSupabaseServerClient();

        // RBAC enforcement (managers/admins only)
        await requirePermission('leads.delete');

        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });

        const { data: profile } = await supabase.from('user_profiles').select('tenant_id').eq('user_id', user.id).single();
        if (!profile) return new Response(JSON.stringify({ error: "Profile not found" }), { status: 400 });

        // Delete lead (ensure it belongs to the tenant)
        const { error } = await supabase
            .from('leads')
            .delete()
            .eq('id', id)
            .eq('tenant_id', profile.tenant_id);

        if (error) throw error;

        return new Response(JSON.stringify({ success: true }), {
            status: 200,
            headers: { "Content-Type": "application/json" }
        });

    } catch (err: any) {
        console.error("[LEAD DELETE ERROR]:", err);
        return new Response(
            JSON.stringify({
                error: err.message || "Erro interno ao excluir lead.",
            }),
            { status: 500, headers: { "Content-Type": "application/json" } }
        );
    }
}
