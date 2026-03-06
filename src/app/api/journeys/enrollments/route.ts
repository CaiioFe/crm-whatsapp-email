import { NextRequest } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { requirePermission } from "@/lib/rbac";

export async function GET(request: NextRequest) {
    try {
        const supabase = await createSupabaseServerClient();

        // RBAC
        await requirePermission('journeys.view');

        // Authenticate user
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return new Response("Não autorizado", { status: 401 });

        // Get profile and tenant
        const { data: profile } = await supabase
            .from('user_profiles')
            .select('tenant_id')
            .eq('user_id', user.id)
            .single();

        if (!profile) return new Response("Perfil não encontrado", { status: 404 });

        const { searchParams } = new URL(request.url);
        const journeyId = searchParams.get('journey_id');

        let query = supabase
            .from('journey_enrollments')
            .select(`
                id,
                status,
                created_at,
                leads ( id, name, email, phone ),
                journeys ( id, name ),
                journey_steps ( id, name, step_type )
            `)
            .eq('tenant_id', profile.tenant_id)
            .order('created_at', { ascending: false });

        if (journeyId) {
            query = query.eq('journey_id', journeyId);
        }

        const { data: enrollments, error } = await query;

        if (error) throw error;

        return new Response(JSON.stringify(enrollments), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });
    } catch (err) {
        console.error("[API_ENROLLMENTS] Error:", err);
        return new Response("Erro interno", { status: 500 });
    }
}
