import { NextRequest } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { requirePermission } from "@/lib/rbac";
import { executeStep } from "@/lib/journeys";

export async function POST(request: NextRequest) {
    try {
        const supabase = await createSupabaseServerClient();

        // RBAC enforcement
        await requirePermission('journeys.edit');

        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });

        const body = await request.json();
        const { enrollment_id, target_step_id } = body;

        if (!enrollment_id || !target_step_id) {
            return new Response(JSON.stringify({ error: "Missing parameters" }), { status: 400 });
        }

        // 1. Verify and update
        const { error } = await supabase
            .from('journey_enrollments')
            .update({
                current_step_id: target_step_id,
                waiting_until: null,
                status: 'active', // Ensure it's active instead of paused
                updated_at: new Date().toISOString()
            })
            .eq('id', enrollment_id);

        if (error) throw error;

        // We don't mark target_step_id as completed because we WANT the engine to execute it.
        // Instead, we just trigger the engine immediately!

        // Execute the new step synchronously before closing the request to ensure Vercel doesn't kill it.
        await executeStep(supabase, enrollment_id);

        return new Response(JSON.stringify({ success: true }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });
    } catch (err: any) {
        console.error("[MOVE_STEP] Error:", err);
        return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: { 'Content-Type': 'application/json' } });
    }
}
