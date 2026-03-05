// ============================================================
// CRM WhatsApp & Email — API: Journey Worker
// Triggers the processing of pending 'Wait' steps
// Recommended: Call this every 5-15 minutes via Cron
// ============================================================

import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { processPendingWaits } from "@/lib/journeys";

export async function GET(req: Request) {
    try {
        // Use service role key if available for administrative tasks, 
        // or a dedicated worker key check
        const supabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!, // Admin access for worker
            { auth: { persistSession: false } }
        );

        console.log("[WORKER] Starting journey wait processor...");
        const result = await processPendingWaits(supabase);
        console.log(`[WORKER] Processed ${result.processed} enrollments.`);

        return NextResponse.json({
            success: true,
            timestamp: new Date().toISOString(),
            ...result
        });
    } catch (err) {
        console.error("[WORKER_ERROR]:", err);
        return new Response("Erro interno no worker", { status: 500 });
    }
}
