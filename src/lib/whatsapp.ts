import { SupabaseClient } from "@supabase/supabase-js";

export async function logOutboundWhatsAppMessage(
    supabase: SupabaseClient,
    tenantId: string,
    phone: string,
    textContent: string,
    providerMessageId: string,
    leadId?: string,
    leadName?: string
) {
    try {
        const cleanPhone = phone.replace(/\D/g, "");

        // Find existing conversation
        let { data: convo } = await supabase
            .from('whatsapp_conversations')
            .select('id, lead_id, lead_name')
            .eq('tenant_id', tenantId)
            .eq('phone', cleanPhone)
            .single();

        if (!convo) {
            // Find lead if not provided
            let finalLeadId = leadId;
            let finalLeadName = leadName || cleanPhone;

            if (!finalLeadId) {
                const { data: lead } = await supabase
                    .from('leads')
                    .select('id, name')
                    .eq('tenant_id', tenantId)
                    .ilike('phone', `%${cleanPhone}%`)
                    .limit(1)
                    .single();
                if (lead) {
                    finalLeadId = lead.id;
                    finalLeadName = lead.name;
                }
            }

            const { data: newConvo, error: convoError } = await supabase
                .from('whatsapp_conversations')
                .insert({
                    tenant_id: tenantId,
                    lead_id: finalLeadId || null,
                    phone: cleanPhone,
                    lead_name: finalLeadName,
                    last_message_text: textContent,
                    last_message_at: new Date().toISOString(),
                    unread_count: 0
                })
                .select('id, lead_id, lead_name')
                .single();
            if (convoError) throw convoError;
            convo = newConvo;
        } else {
            await supabase
                .from('whatsapp_conversations')
                .update({
                    last_message_text: textContent,
                    last_message_at: new Date().toISOString()
                })
                .eq('id', convo.id);
        }

        if (convo) {
            await supabase.from('whatsapp_messages').insert({
                conversation_id: convo.id,
                tenant_id: tenantId,
                direction: 'outbound',
                message_type: 'text',
                body: textContent,
                status: 'delivered'
            });
        }
    } catch (e) {
        console.error("Failed to log outbound WA message locally:", e);
    }
}
