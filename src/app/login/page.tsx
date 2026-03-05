"use client";

import { useState } from "react";
import { Mail, Lock, User, Eye, EyeOff, ArrowRight, Zap } from "lucide-react";
import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { useToast } from "@/components/ui/Toast";

export default function LoginPage() {
    const router = useRouter();
    const toast = useToast();
    const supabase = createSupabaseBrowserClient();

    const [mode, setMode] = useState<"login" | "signup" | "forgot">("login");
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [name, setName] = useState("");

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            if (mode === "signup") {
                const { data, error } = await supabase.auth.signUp({
                    email,
                    password,
                    options: {
                        data: {
                            full_name: name,
                        },
                    },
                });

                if (error) throw error;

                toast.success("Conta criada!", "Bem-vindo ao CRM Hub!");

                // Se o Supabase retornar a sessão direto (significa que Email Confirm está desligado lá no painel), a gente já joga pro dashboard
                if (data.session) {
                    router.push("/");
                } else {
                    // Fallback caso ainda passe pela tela de login
                    setMode("login");
                }
            } else if (mode === "login") {
                const { error } = await supabase.auth.signInWithPassword({
                    email,
                    password,
                });

                if (error) throw error;

                toast.success("Login efetuado!", "Redirecionando...");
                router.push("/");
            } else if (mode === "forgot") {
                const { error } = await supabase.auth.resetPasswordForEmail(email);
                if (error) throw error;
                toast.info("Link enviado", "Verifique sua caixa de entrada.");
            }
        } catch (error: any) {
            toast.error("Erro na autenticação", error.message || "Credenciais inválidas");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div
            className="min-h-screen flex items-center justify-center p-4"
            style={{
                background: "linear-gradient(135deg, #1e1b4b 0%, #312e81 30%, #4338ca 60%, #6366f1 100%)",
            }}
        >
            {/* Decorative elements */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div
                    className="absolute w-96 h-96 rounded-full opacity-10 blur-3xl"
                    style={{ background: "#818cf8", top: "10%", left: "10%" }}
                />
                <div
                    className="absolute w-80 h-80 rounded-full opacity-10 blur-3xl"
                    style={{ background: "#c084fc", bottom: "10%", right: "10%" }}
                />
            </div>

            <div className="w-full max-w-md relative">
                {/* Logo */}
                <div className="text-center mb-8">
                    <div className="inline-flex items-center gap-3 mb-3">
                        <div
                            className="w-12 h-12 rounded-xl flex items-center justify-center shadow-lg"
                            style={{ background: "linear-gradient(135deg, #6366f1, #8b5cf6)" }}
                        >
                            <Zap size={24} color="white" />
                        </div>
                        <span className="text-2xl font-bold text-white tracking-tight">CRM Hub</span>
                    </div>
                    <p className="text-sm" style={{ color: "rgba(255,255,255,0.6)" }}>
                        {mode === "login" && "Acesse sua conta para continuar"}
                        {mode === "signup" && "Crie sua conta gratuita"}
                        {mode === "forgot" && "Recupere o acesso à sua conta"}
                    </p>
                </div>

                {/* Card */}
                <div
                    className="rounded-2xl p-8 shadow-2xl"
                    style={{
                        background: "rgba(255,255,255,0.95)",
                        backdropFilter: "blur(20px)",
                    }}
                >
                    <form onSubmit={handleSubmit} className="space-y-4">
                        {/* Name (signup only) */}
                        {mode === "signup" && (
                            <div>
                                <label className="text-xs font-bold block mb-1.5" style={{ color: "#64748b" }}>
                                    NOME COMPLETO
                                </label>
                                <div className="relative">
                                    <User size={16} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "#94a3b8" }} />
                                    <input
                                        type="text"
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        placeholder="Seu nome"
                                        className="w-full pl-10 pr-4 py-3 rounded-xl border text-sm transition-all focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none"
                                        style={{ borderColor: "#e2e8f0", color: "#1e293b" }}
                                        required
                                    />
                                </div>
                            </div>
                        )}

                        {/* Email */}
                        <div>
                            <label className="text-xs font-bold block mb-1.5" style={{ color: "#64748b" }}>
                                EMAIL
                            </label>
                            <div className="relative">
                                <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "#94a3b8" }} />
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="seu@email.com"
                                    className="w-full pl-10 pr-4 py-3 rounded-xl border text-sm transition-all focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none"
                                    style={{ borderColor: "#e2e8f0", color: "#1e293b" }}
                                    required
                                />
                            </div>
                        </div>

                        {/* Password */}
                        {mode !== "forgot" && (
                            <div>
                                <label className="text-xs font-bold block mb-1.5" style={{ color: "#64748b" }}>
                                    SENHA
                                </label>
                                <div className="relative">
                                    <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "#94a3b8" }} />
                                    <input
                                        type={showPassword ? "text" : "password"}
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        placeholder="••••••••"
                                        className="w-full pl-10 pr-12 py-3 rounded-xl border text-sm transition-all focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none"
                                        style={{ borderColor: "#e2e8f0", color: "#1e293b" }}
                                        required
                                        minLength={6}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 p-1"
                                        style={{ color: "#94a3b8" }}
                                    >
                                        {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* Forgot password link */}
                        {mode === "login" && (
                            <div className="text-right">
                                <button
                                    type="button"
                                    onClick={() => setMode("forgot")}
                                    className="text-xs font-medium"
                                    style={{ color: "#6366f1" }}
                                >
                                    Esqueci minha senha
                                </button>
                            </div>
                        )}

                        {/* Submit */}
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full py-3 rounded-xl text-white text-sm font-semibold flex items-center justify-center gap-2 transition-all"
                            style={{
                                background: loading ? "#a5b4fc" : "linear-gradient(135deg, #6366f1, #4f46e5)",
                                boxShadow: loading ? "none" : "0 4px 15px rgba(99,102,241,0.4)",
                            }}
                        >
                            {loading ? (
                                <>
                                    <span className="animate-spin inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full" />
                                    {mode === "login" ? "Entrando..." : mode === "signup" ? "Criando conta..." : "Enviando..."}
                                </>
                            ) : (
                                <>
                                    {mode === "login" && "Entrar"}
                                    {mode === "signup" && "Criar conta gratuita"}
                                    {mode === "forgot" && "Enviar link de recuperação"}
                                    <ArrowRight size={16} />
                                </>
                            )}
                        </button>
                    </form>

                    {/* Toggle mode */}
                    <p className="text-center text-sm mt-6" style={{ color: "#64748b" }}>
                        {mode === "login" && (
                            <>
                                Não tem conta?{" "}
                                <button onClick={() => setMode("signup")} className="font-semibold" style={{ color: "#6366f1" }}>
                                    Criar conta
                                </button>
                            </>
                        )}
                        {mode === "signup" && (
                            <>
                                Já tem conta?{" "}
                                <button onClick={() => setMode("login")} className="font-semibold" style={{ color: "#6366f1" }}>
                                    Fazer login
                                </button>
                            </>
                        )}
                        {mode === "forgot" && (
                            <>
                                Lembrou a senha?{" "}
                                <button onClick={() => setMode("login")} className="font-semibold" style={{ color: "#6366f1" }}>
                                    Voltar ao login
                                </button>
                            </>
                        )}
                    </p>
                </div>

                {/* Footer */}
                <p className="text-center text-xs mt-6" style={{ color: "rgba(255,255,255,0.4)" }}>
                    © 2026 CRM Hub. Todos os direitos reservados.
                </p>
            </div>
        </div>
    );
}
