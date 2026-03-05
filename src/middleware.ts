// ============================================================
// CRM WhatsApp & Email — Middleware Global
// Protege as rotas e injeta a sessão do Supabase nos cookies.
// ============================================================

import { createServerClient } from "@supabase/ssr"
import { NextResponse, type NextRequest } from "next/server"

export async function middleware(request: NextRequest) {
    // Vamos criar uma resposta para passar e atualizar os cookies com `setAll`
    let supabaseResponse = NextResponse.next({
        request,
    })

    // Instancia um cliente otimizado para middleware que força a atualização do token
    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() {
                    return request.cookies.getAll()
                },
                setAll(cookiesToSet) {
                    cookiesToSet.forEach(({ name, value, options }) => request.cookies.set(name, value))
                    supabaseResponse = NextResponse.next({
                        request,
                    })
                    cookiesToSet.forEach(({ name, value, options }) =>
                        supabaseResponse.cookies.set(name, value, options)
                    )
                },
            },
        }
    )

    // Pegar o user para validar
    const {
        data: { user },
    } = await supabase.auth.getUser()

    const url = request.nextUrl.clone()

    // Se NÃO TEM usuário logado e não está nas rotas públicas (como /login, /api), força o retorno pro login.
    if (!user && !url.pathname.startsWith('/login') && !url.pathname.startsWith('/api') && !url.pathname.includes('.')) {
        url.pathname = '/login'
        return NextResponse.redirect(url)
    }

    // Se TEM usuário, mas ele tentou acessar o /login, manda ele de volta pro dashboard
    if (user && url.pathname.startsWith('/login')) {
        url.pathname = '/'
        return NextResponse.redirect(url)
    }

    return supabaseResponse
}

export const config = {
    matcher: [
        /*
         * Intercepta tudo (para proteger o dashboard TODO)
         * Ignorando caminhos estáticos, imagens e _next
         */
        "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
    ],
}
