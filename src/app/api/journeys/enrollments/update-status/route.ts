// ============================================================
// CRM WhatsApp & Email — API: Update Enrollment Status
// Allows manual control over a specific lead's journey progress
// ============================================================

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { requirePermission } from "@/lib/rbac";

export async function POST(req: Request) {
    try {
        const { enrollmentId, status } = await req.json();

        if (!enrollmentId || !status) {
            return new Response("ID e Status são obrigatórios", { status: 400 });
        }

        const supabase = await createSupabaseServerClient();
        await requirePermission('journeys.edit');

        // Authenticate user
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return new Response("Não autorizado", { status: 401 });

        // Get profile and tenant to ensure ownership
        const { data: profile } = await supabase
            .from('user_profiles')
            .select('tenant_id')
            .eq('user_id', user.id)
            .single();

        if (!profile) return new Response("Perfil não encontrado", { status: 404 });

        // Update enrollment
        const { error } = await supabase
            .from('journey_enrollments')
            .update({
                status,
                updated_at: new Date().toISOString(),
                // If dropping/completing, set the timestamp
                ...(status === 'dropped' ? { dropped_at: new Date().toISOString() } : {}),
                ...(status === 'completed' ? { completed_at: new Date().toISOString() } : {})
            })
            .eq('id', enrollmentId)
            .eq('tenant_id', profile.tenant_id);

        if (error) throw error;

        return new Response(JSON.stringify({ success: true }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });
    } catch (err) {
        console.error("[API_UPDATE_ENROLLMENT] Error:", err);
        return new Response("Erro interno", { status: 500 });
    }
}
