// ============================================================
// CRM WhatsApp & Email — API: Evolution API Proxy
// ============================================================

import { NextRequest } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ action: string }> }
) {
    try {
        const { action } = await params;
        const supabase = await createSupabaseServerClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });

        const { data: profile } = await supabase.from('user_profiles').select('tenant_id').eq('user_id', user.id).single();
        if (!profile) return new Response(JSON.stringify({ error: "Profile not found" }), { status: 400 });

        // Get config
        const { data: config } = await supabase
            .from('whatsapp_provider_configs')
            .select('*')
            .eq('tenant_id', profile.tenant_id)
            .eq('provider', 'evolution')
            .single();

        if (!config || !config.api_url || !config.api_key_encrypted) {
            return new Response(JSON.stringify({ error: "Evolution API not configured" }), { status: 400 });
        }

        const body = await request.json();
        const baseUrl = config.api_url.replace(/\/$/, "");

        if (action === "create-instance") {
            const response = await fetch(`${baseUrl}/instance/create`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "apikey": config.api_key_encrypted
                },
                body: JSON.stringify({
                    instanceName: config.instance_name,
                    token: profile.tenant_id, // Use tenant_id as token
                    number: config.phone_number,
                    qrcode: true
                })
            });

            const data = await response.json();
            return new Response(JSON.stringify(data), { status: response.status });
        }

        if (action === "send-message") {
            const { number, text } = body;
            const instance = config.instance_name;

            const response = await fetch(`${baseUrl}/message/sendText/${instance}`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "apikey": config.api_key_encrypted
                },
                body: JSON.stringify({
                    number: number,
                    options: { delay: 1200, presence: "composing" },
                    textMessage: { text: text }
                })
            });

            const data = await response.json();
            return new Response(JSON.stringify(data), { status: response.status });
        }

        return new Response(JSON.stringify({ error: "Invalid action" }), { status: 400 });

    } catch (err) {
        return new Response(JSON.stringify({ error: String(err) }), { status: 500 });
    }
}

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ action: string }> }
) {
    try {
        const { action } = await params;
        const supabase = await createSupabaseServerClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });

        const { data: profile } = await supabase.from('user_profiles').select('tenant_id').eq('user_id', user.id).single();

        const { data: config } = await supabase
            .from('whatsapp_provider_configs')
            .select('*')
            .eq('tenant_id', profile?.tenant_id)
            .eq('provider', 'evolution')
            .single();

        if (!config) return new Response(JSON.stringify({ error: "Not configured" }), { status: 400 });

        const baseUrl = config.api_url.replace(/\/$/, "");

        if (action === "connect") {
            console.log(`[EVOLUTION PROXY] Checking connection for instance: ${config.instance_name}`);
            const response = await fetch(`${baseUrl}/instance/connect/${config.instance_name}`, {
                headers: { "apikey": config.api_key_encrypted }
            });

            const data = await response.json();
            console.log(`[EVOLUTION PROXY] Response:`, data);

            return new Response(JSON.stringify(data), { status: response.status });
        }

        return new Response(JSON.stringify({ error: "Invalid action" }), { status: 400 });
    } catch (err) {
        return new Response(JSON.stringify({ error: String(err) }), { status: 500 });
    }
}
