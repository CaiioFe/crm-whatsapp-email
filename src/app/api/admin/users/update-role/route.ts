import { NextRequest } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { requirePermission } from "@/lib/rbac";

export async function POST(request: NextRequest) {
    try {
        const supabase = await createSupabaseServerClient();

        // RBAC enforcement (Need admin for user management)
        await requirePermission('admin.manage');

        const { userId, role } = await request.json();

        if (!userId || !role) {
            return new Response(JSON.stringify({ error: "userId and role are required" }), { status: 400 });
        }

        const validRoles = ['viewer', 'operator', 'manager', 'admin'];
        if (!validRoles.includes(role)) {
            return new Response(JSON.stringify({ error: "Invalid role" }), { status: 400 });
        }

        // Perform update
        const { error } = await supabase
            .from('user_profiles')
            .update({ role })
            .eq('user_id', userId);

        if (error) {
            return new Response(JSON.stringify({ error: error.message }), { status: 400 });
        }

        return new Response(JSON.stringify({ success: true, role }), {
            status: 200,
            headers: { "Content-Type": "application/json" }
        });

    } catch (err: any) {
        return new Response(
            JSON.stringify({ error: err.message || "Internal error" }),
            { status: 500 }
        );
    }
}
