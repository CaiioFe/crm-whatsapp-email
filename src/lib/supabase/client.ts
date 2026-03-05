// ============================================================
// CRM WhatsApp & Email — Supabase Client (Browser)
// Configuração do client Supabase para Client Components
// ============================================================

import { createBrowserClient } from '@supabase/ssr';

export function createSupabaseBrowserClient() {
    return createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
}
