// ============================================================
// CRM WhatsApp & Email — API: Get Email Template
// Path: src/app/api/email-templates/[id]/route.ts
// ============================================================

import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function GET(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;
    const cookieStore = await cookies();
    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                get(name: string) { return cookieStore.get(name)?.value },
                set(name: string, value: string, options: any) { cookieStore.set({ name, value, ...options }) },
                remove(name: string, options: any) { cookieStore.set({ name, value: "", ...options }) },
            },
        }
    );

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return new Response("Unauthorized", { status: 401 });

    const { data: profile } = await supabase
        .from("user_profiles")
        .select("tenant_id")
        .eq("user_id", user.id)
        .single();

    if (!profile) return new Response("Profile not found", { status: 404 });

    const { data, error } = await supabase
        .from("email_templates")
        .select("*")
        .eq("id", id)
        .eq("tenant_id", profile.tenant_id)
        .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json(data);
}
