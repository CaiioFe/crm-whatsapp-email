import { NextResponse } from 'next/server'
// A rota do Supabase SSR que recebe o "code" de autorização por URL, troca por uma sessão segura.
import { createSupabaseServerClient } from '@/lib/supabase/server'

export async function GET(request: Request) {
    const { searchParams, origin } = new URL(request.url)
    const code = searchParams.get('code')
    // next é um param opcional caso tenhamos mandado redirectUrl depois de logar
    const next = searchParams.get('next') ?? '/'

    if (code) {
        const supabase = await createSupabaseServerClient()
        const { error } = await supabase.auth.exchangeCodeForSession(code)

        if (!error) {
            return NextResponse.redirect(`${origin}${next}`)
        }
    }

    // Deu erro no callback ou foi negado. Redireciona pro login informando o erro
    return NextResponse.redirect(`${origin}/login?error=Ocorreu um erro no login seguro`)
}
