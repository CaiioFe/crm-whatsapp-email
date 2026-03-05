import { NextRequest, NextResponse } from "next/server";
import { createSupabaseBrowserClient } from "@/lib/supabase/client"; // Note: In API we should use service client for webhooks typically, but for this demo browser client might work if session is handled. Wait, API routes should use createRouteHandlerClient.

import { createClient } from "@supabase/supabase-js";

// Webhooks come from external Evolution API, so we need a service role client to bypass RLS and identify the tenant based on the instance name or meta data.
const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { event, instance, data } = body;

        console.log(`[WHATSAPP WEBHOOK] Event: ${event} from Instance: ${instance}`);

        // 1. Find the tenant_id associated with this instance
        const { data: config, error: configError } = await supabaseAdmin
            .from('whatsapp_provider_configs')
            .select('tenant_id')
            .eq('instance_name', instance)
            .single();

        if (configError || !config) {
            console.error(`[WHATSAPP WEBHOOK] Config not found for instance ${instance}`);
            return NextResponse.json({ error: "Instance not registered" }, { status: 404 });
        }

        const tenantId = config.tenant_id;

        // 2. Handle Message Received
        if (event === "messages.upsert" && data.messages?.[0]) {
            const msg = data.messages[0];
            const fromMe = msg.key.fromMe || false;
            const remoteJid = msg.key.remoteJid;
            const pushName = msg.pushName || "WhatsApp User";
            const textContent = msg.message?.conversation || msg.message?.extendedTextMessage?.text || "";

            if (!remoteJid) return NextResponse.json({ ok: true });

            const phone = remoteJid.replace("@s.whatsapp.net", "");

            // 1. Find or create conversation
            let { data: convo } = await supabaseAdmin
                .from('whatsapp_conversations')
                .select('id')
                .eq('tenant_id', tenantId)
                .eq('phone', phone)
                .single();

            if (!convo) {
                // Find lead for cross-ref
                const { data: lead } = await supabaseAdmin
                    .from('leads')
                    .select('id, name')
                    .eq('tenant_id', tenantId)
                    .ilike('phone', `%${phone}%`)
                    .limit(1)
                    .single();

                const { data: newConvo, error: convoError } = await supabaseAdmin
                    .from('whatsapp_conversations')
                    .insert({
                        tenant_id: tenantId,
                        lead_id: lead?.id || null,
                        phone: phone,
                        lead_name: lead?.name || pushName,
                        last_message_text: textContent,
                        last_message_at: new Date().toISOString()
                    })
                    .select('id')
                    .single();

                if (convoError) {
                    console.error("[WHATSAPP WEBHOOK] Convo Error:", convoError);
                    return NextResponse.json({ error: "Failed to create convo" }, { status: 500 });
                }
                convo = newConvo;
            } else {
                // Update conversation stats
                await supabaseAdmin
                    .from('whatsapp_conversations')
                    .update({
                        last_message_text: textContent,
                        last_message_at: new Date().toISOString(),
                        unread_count: fromMe ? 0 : 1 // Simple logic for unread
                    })
                    .eq('id', convo.id);
            }

            // 2. Insert message
            const { error: msgError } = await supabaseAdmin.from('whatsapp_messages').insert({
                conversation_id: convo.id,
                tenant_id: tenantId,
                direction: fromMe ? 'outbound' : 'inbound',
                body: textContent,
                provider_message_id: msg.key.id,
                status: 'delivered', // Evolution usually delivers immediately if we receive it
                metadata: msg
            });

            if (msgError) {
                console.error("[WHATSAPP WEBHOOK] Error inserting message:", msgError);
            }

            // Find lead for interactions if we haven't already
            let leadId = null;
            if (convo) {
                const { data: convoDetails } = await supabaseAdmin.from('whatsapp_conversations').select('lead_id').eq('id', convo.id).single();
                leadId = convoDetails?.lead_id;
            }

            // Also log as interaction if it's a lead
            if (leadId && !fromMe) {
                await supabaseAdmin.from('interactions').insert({
                    tenant_id: tenantId,
                    lead_id: leadId,
                    type: 'whatsapp_received',
                    title: 'WhatsApp Recebido',
                    body: textContent.substring(0, 200)
                });
            }
        }

        // 3. Handle Instance Status change
        if (event === "connection.update") {
            const status = data.state === "open" ? "connected" : "error";
            await supabaseAdmin
                .from('whatsapp_provider_configs')
                .update({ status })
                .eq('instance_name', instance)
                .eq('tenant_id', tenantId);
        }

        return NextResponse.json({ ok: true });
    } catch (err) {
        console.error("[WHATSAPP WEBHOOK] Fatal Error:", err);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
