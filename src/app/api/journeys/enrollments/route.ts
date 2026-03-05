import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function GET() {
    try {
        const cookieStore = await cookies();
        const supabase = createServerClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
            {
                cookies: {
                    get(name: string) { return cookieStore.get(name)?.value },
                },
            }
        );

        // Authenticate user
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return new Response("Não autorizado", { status: 401 });

        // Get profile and tenant
        const { data: profile } = await supabase
            .from('profiles')
            .select('tenant_id')
            .eq('id', user.id)
            .single();

        if (!profile) return new Response("Perfil não encontrado", { status: 404 });

        // Fetch active enrollments with joins
        const { data: enrollments, error } = await supabase
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

        if (error) throw error;

        return NextResponse.json(enrollments);
    } catch (err) {
        console.error("[API_ENROLLMENTS] Error:", err);
        return new Response("Erro interno", { status: 500 });
    }
}
