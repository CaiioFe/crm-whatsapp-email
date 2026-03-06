import { NextRequest } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { requirePermission } from "@/lib/rbac";
import { enrollLeadsInJourneys } from "@/lib/journeys";

export async function POST(request: NextRequest) {
    try {
        const supabase = await createSupabaseServerClient();

        // RBAC enforcement (Need permission to create leads)
        await requirePermission('leads.create');

        const payload = await request.json();
        const { name, email, phone, company, position, position_title, instagram, faturamento, revenue, stage, current_stage_id, tags } = payload;

        if (!name) {
            return new Response(JSON.stringify({ error: "Nome é obrigatório" }), { status: 400 });
        }

        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });

        const { data: profile } = await supabase.from('user_profiles').select('tenant_id').eq('user_id', user.id).single();
        if (!profile) return new Response(JSON.stringify({ error: "Profile not found" }), { status: 400 });

        // 2. Map current_stage_id (if it's a slug or name)
        let stageId = current_stage_id || stage;
        console.log('[API] Processing stageId:', stageId);

        if (stageId && !stageId.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
            const { data: stage } = await supabase
                .from('pipeline_stages')
                .select('id')
                .eq('name', stageId)
                .limit(1)
                .single();

            if (stage) {
                stageId = stage.id;
            } else {
                // Fallback to first available stage
                const { data: firstStage } = await supabase
                    .from('pipeline_stages')
                    .select('id')
                    .order('position', { ascending: true })
                    .limit(1)
                    .single();
                if (firstStage) stageId = firstStage.id;
            }
        }

        console.log('[API] Resolved stageId:', stageId);

        // 3. Prepare Lead Object
        const leadData = {
            tenant_id: profile.tenant_id,
            name: name,
            email: email,
            phone: phone,
            company: company,
            position_title: position_title || position,
            current_stage_id: stageId,
            lead_score: payload.lead_score || 0,
            custom_fields: {
                instagram: instagram || '',
                faturamento: faturamento || revenue || '',
                ...(typeof payload.custom_fields === 'object' ? payload.custom_fields : {})
            },
            source: payload.source || payload.lead_source || 'manual'
        };

        const { data: lead, error: leadError } = await supabase
            .from('leads')
            .insert(leadData)
            .select()
            .single();

        if (leadError) {
            console.error('[API] Error saving lead:', leadError);
            return new Response(JSON.stringify({ error: leadError.message }), { status: 400 });
        }

        console.log('[API] Lead saved successfully:', lead.id);

        // 2. Add Tags if any
        if (tags && (Array.isArray(tags) ? tags.length > 0 : String(tags).length > 0)) {
            const tagNames = Array.isArray(tags)
                ? tags
                : String(tags).split(',').map((t: string) => t.trim()).filter(Boolean);

            console.log('[API] Processing tags:', tagNames);
            // Get or create tags
            for (const tagName of tagNames) {
                let { data: tagData } = await supabase
                    .from('tags')
                    .select('id')
                    .eq('tenant_id', profile.tenant_id)
                    .eq('name', tagName)
                    .single();

                if (!tagData) {
                    const { data: newTag } = await supabase
                        .from('tags')
                        .insert({ tenant_id: profile.tenant_id, name: tagName })
                        .select()
                        .single();
                    tagData = newTag;
                }

                if (tagData) {
                    await supabase.from('lead_tags').insert({
                        lead_id: lead.id,
                        tag_id: tagData.id
                    });

                    // Trigger tag_added journey events if they exist
                    try {
                        await enrollLeadsInJourneys(supabase, profile.tenant_id, 'tag_added', lead.id);
                    } catch (e) {
                        console.error("Error triggering tag_added journey", e);
                    }
                }
            }
        }

        // 4. Enroll in automated journeys AFTER tags are processed
        try {
            console.log('[API] Enrolling lead in journeys...');
            await enrollLeadsInJourneys(supabase, profile.tenant_id, 'lead_created', lead.id);
            console.log('[API] Enrollment completed.');
        } catch (enrollError) {
            console.error('[API] Error in automatic enrollment:', enrollError);
            // Don't fail the whole request if enrollment fails
        }


        return new Response(JSON.stringify(lead), {
            status: 200,
            headers: { "Content-Type": "application/json" }
        });

    } catch (err: any) {
        console.error("[LEAD SAVE ERROR]:", err);
        return new Response(
            JSON.stringify({
                error: err.message || "Erro interno ao salvar lead.",
            }),
            { status: 500, headers: { "Content-Type": "application/json" } }
        );
    }
}
