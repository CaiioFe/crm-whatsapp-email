// ============================================================
// CRM WhatsApp & Email — API: Import Leads
// US 01.2 — Endpoint de importação com streaming progress
//
// POST /api/leads/import
// Body: { rows, mapping, duplicateStrategy }
// Response: NDJSON streaming (progress updates)
// ============================================================

import { NextRequest } from "next/server";
import { validateLeadRow } from "@/lib/import-parser";
import { createSupabaseServerClient } from "@/lib/supabase/server";

interface ImportRequestBody {
    rows: Record<string, string>[];
    mapping: Record<string, string>;
    duplicateStrategy: "skip" | "update";
    tagName?: string;
}

export async function POST(request: NextRequest) {
    try {
        const body: ImportRequestBody = await request.json();
        const { rows, mapping, duplicateStrategy, tagName } = body;

        if (!rows || !Array.isArray(rows) || rows.length === 0) {
            return new Response(
                JSON.stringify({ error: "Nenhum dado para importar" }),
                { status: 400, headers: { "Content-Type": "application/json" } }
            );
        }

        const supabase = await createSupabaseServerClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return new Response(JSON.stringify({ error: "Você precisa estar logado." }), { status: 401 });
        }

        const { data: profile } = await supabase.from('user_profiles').select('tenant_id').eq('user_id', user.id).single();
        if (!profile) {
            return new Response(JSON.stringify({ error: "Perfil de usuário não encontrado." }), { status: 400 });
        }

        const tenantId = profile.tenant_id;

        // Try to get default pipeline/stage
        let defaultStageId = null;
        const { data: pipeline } = await supabase.from('pipelines').select('id').eq('tenant_id', tenantId).order('created_at').limit(1).single();
        if (pipeline) {
            const { data: stage } = await supabase.from('pipeline_stages').select('id').eq('pipeline_id', pipeline.id).order('position').limit(1).single();
            if (stage) defaultStageId = stage.id;
        }

        let tagId = null;
        if (tagName) {
            const { data: existingTag } = await supabase.from('tags').select('id').eq('tenant_id', tenantId).eq('name', tagName).single();
            if (existingTag) {
                tagId = existingTag.id;
            } else {
                const { data: newTag } = await supabase.from('tags').insert({ tenant_id: tenantId, name: tagName, color: '#8b5cf6' }).select('id').single();
                if (newTag) tagId = newTag.id;
            }
        }

        // Create streaming response
        const stream = new ReadableStream({
            async start(controller) {
                const encoder = new TextEncoder();
                const BATCH_SIZE = 50; // Use small batches
                let created = 0;
                let updated = 0;
                let errors = 0;
                const errorDetails: { row: number; field: string; message: string }[] = [];

                const totalRows = rows.length;
                const batches = Math.ceil(totalRows / BATCH_SIZE);

                for (let batchIdx = 0; batchIdx < batches; batchIdx++) {
                    const start = batchIdx * BATCH_SIZE;
                    const end = Math.min(start + BATCH_SIZE, totalRows);
                    const batch = rows.slice(start, end);

                    for (let i = 0; i < batch.length; i++) {
                        const row = batch[i];
                        const rowIndex = start + i + 2; // +2 for header + 1-indexed

                        // Validate row
                        const validation = validateLeadRow(row, mapping, rowIndex);
                        if (!validation.valid) {
                            errors++;
                            errorDetails.push(...validation.errors);
                            continue;
                        }

                        const leadData: Record<string, any> = {
                            tenant_id: tenantId,
                            custom_fields: {},
                            current_stage_id: defaultStageId,
                            lead_score: 0,
                            source: 'csv_import'
                        };

                        for (const [csvCol, leadField] of Object.entries(mapping)) {
                            if (leadField && row[csvCol]) {
                                if (leadField.startsWith('custom:')) {
                                    leadData.custom_fields[leadField.replace('custom:', '')] = row[csvCol].trim();
                                } else {
                                    leadData[leadField] = row[csvCol].trim();
                                }
                            }
                        }

                        // Verify duplicate
                        let existingLead = null;
                        if (leadData.email) {
                            const { data } = await supabase.from('leads').select('id, custom_fields').eq('tenant_id', tenantId).eq('email', leadData.email).single();
                            if (data) existingLead = data;
                        }
                        if (!existingLead && leadData.phone) {
                            const { data } = await supabase.from('leads').select('id, custom_fields').eq('tenant_id', tenantId).eq('phone', leadData.phone).single();
                            if (data) existingLead = data;
                        }

                        let insertedLeadId = null;

                        if (existingLead) {
                            if (duplicateStrategy === 'skip') {
                                updated++; // counts as touched/skipped
                                insertedLeadId = existingLead.id;
                            } else {
                                const mergedCustom = { ...existingLead.custom_fields, ...leadData.custom_fields };
                                const updatePayload: Record<string, any> = { ...leadData, custom_fields: mergedCustom };
                                delete updatePayload['tenant_id']; // don't update immutable fields if you want to be safe

                                const { error: upErr } = await supabase.from('leads').update(updatePayload).eq('id', existingLead.id);
                                if (upErr) {
                                    errors++;
                                    errorDetails.push({ row: rowIndex, field: "db", message: upErr.message });
                                } else {
                                    updated++;
                                    insertedLeadId = existingLead.id;
                                }
                            }
                        } else {
                            const { data: newLead, error: insErr } = await supabase.from('leads').insert(leadData).select('id').single();
                            if (insErr) {
                                errors++;
                                errorDetails.push({ row: rowIndex, field: "db", message: insErr.message });
                            } else if (newLead) {
                                created++;
                                insertedLeadId = newLead.id;

                                // Trigger Journey Enrollment
                                const { enrollLeadsInJourneys } = await import("@/lib/journeys");
                                enrollLeadsInJourneys(supabase, tenantId, 'lead_created', newLead.id).catch(e => {
                                    console.error("Failed to enroll lead in journey:", e);
                                });
                            }
                        }

                        // Attach tag if specified
                        if (insertedLeadId && tagId) {
                            await supabase.from('lead_tags').insert({ lead_id: insertedLeadId, tag_id: tagId }).select().single();
                        }
                    }

                    // Send progress update
                    const progress = Math.round(((batchIdx + 1) / batches) * 100);
                    const progressData = JSON.stringify({
                        progress,
                        created,
                        updated,
                        errors,
                        errorDetails: errorDetails.slice(0, 50),
                        done: false,
                    });
                    controller.enqueue(encoder.encode(progressData + "\n"));
                }

                // Send final result
                const finalData = JSON.stringify({
                    progress: 100,
                    created,
                    updated,
                    errors,
                    errorDetails: errorDetails.slice(0, 50),
                    done: true,
                });
                controller.enqueue(encoder.encode(finalData + "\n"));
                controller.close();
            },
        });

        return new Response(stream, {
            headers: {
                "Content-Type": "application/x-ndjson",
                "Transfer-Encoding": "chunked",
            },
        });
    } catch (err) {
        return new Response(
            JSON.stringify({
                error: err instanceof Error ? err.message : "Erro interno do servidor",
            }),
            { status: 500, headers: { "Content-Type": "application/json" } }
        );
    }
}
