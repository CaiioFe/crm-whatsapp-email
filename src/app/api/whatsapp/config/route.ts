// ============================================================
// CRM WhatsApp & Email — API: WhatsApp Config
// ============================================================

import { NextRequest } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function GET() {
    try {
        const supabase = await createSupabaseServerClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });

        const { data: profile } = await supabase.from('user_profiles').select('tenant_id').eq('user_id', user.id).single();
        if (!profile) return new Response(JSON.stringify({ error: "Profile not found" }), { status: 400 });

        const { data: configs, error } = await supabase
            .from('whatsapp_provider_configs')
            .select('*')
            .eq('tenant_id', profile.tenant_id);

        if (error) throw error;

        return new Response(JSON.stringify(configs), {
            status: 200,
            headers: { "Content-Type": "application/json" }
        });

    } catch (err) {
        return new Response(JSON.stringify({ error: String(err) }), { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    try {
        const supabase = await createSupabaseServerClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });

        const { data: profile } = await supabase.from('user_profiles').select('tenant_id').eq('user_id', user.id).single();
        if (!profile) return new Response(JSON.stringify({ error: "Profile not found" }), { status: 400 });

        const body = await request.json();
        const { provider, api_url, api_key, instance_name, is_enabled } = body;

        const { data, error } = await supabase
            .from('whatsapp_provider_configs')
            .upsert({
                tenant_id: profile.tenant_id,
                provider,
                api_url,
                api_key_encrypted: api_key, // For now, storing as-is, should be encrypted in prod
                instance_name,
                is_enabled,
                updated_at: new Date().toISOString()
            }, { onConflict: 'tenant_id, provider' })
            .select()
            .single();

        if (error) throw error;

        return new Response(JSON.stringify(data), {
            status: 200,
            headers: { "Content-Type": "application/json" }
        });

    } catch (err) {
        return new Response(JSON.stringify({ error: String(err) }), { status: 500 });
    }
}
