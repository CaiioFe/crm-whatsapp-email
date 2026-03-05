import { Users, Upload, TrendingUp, Mail, MessageCircle, GitBranch, ArrowRight, Clock, Zap } from "lucide-react";
import Link from "next/link";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export default async function DashboardPage() {
    const supabase = await createSupabaseServerClient();

    // Fetch Total Leads
    const { count: totalLeads } = await supabase.from('leads').select('*', { count: 'exact', head: true });

    // Fetch Pipeline & Stages to count funnel
    const { data: pipeline } = await supabase.from('pipelines').select('id').order('created_at').limit(1).single();

    let funnelData: { name: string; count: number; color: string; pct: number }[] = [];
    let stagesMap: Record<string, any> = {};

    if (pipeline) {
        const { data: stages } = await supabase.from('pipeline_stages').select('*').eq('pipeline_id', pipeline.id).order('position');
        if (stages && stages.length > 0) {
            const colors = ["#6366f1", "#3b82f6", "#f59e0b", "#f97316", "#22c55e", "#8b5cf6"];
            const { data: leads } = await supabase.from('leads').select('current_stage_id');
            const total = leads?.length || 0;

            stages.forEach(stage => {
                stagesMap[stage.id] = stage;
            });

            const counts = stages.map(st => {
                const count = (leads || []).filter(l => l.current_stage_id === st.id).length;
                return {
                    id: st.id,
                    name: st.name,
                    count
                };
            });

            const maxCount = Math.max(...counts.map(c => c.count), 1);
            funnelData = counts.map((st, i) => ({
                name: st.name,
                count: st.count,
                color: stagesMap[st.id]?.color || colors[i % colors.length],
                pct: Math.round((st.count / maxCount) * 100)
            }));
        }
    }

    // Fetch Recent Leads
    const { data: recentLeadsData } = await supabase.from('leads')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(5);

    const recentLeads = (recentLeadsData || []).map(lead => {
        const stage = lead.current_stage_id ? stagesMap[lead.current_stage_id] : null;
        return {
            name: lead.name,
            company: lead.company || "-",
            stage: stage ? stage.name : "Sem estágio",
            score: lead.lead_score || 0,
            stageColor: stage ? stage.color : "#94a3b8"
        };
    });

    const RECENT_ACTIVITIES = [
        { type: "stage", text: "Você acessou o sistema com sucesso", time: "agora", color: "#f59e0b" },
    ];

    return (
        <div className="animate-fade-in">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-2xl md:text-3xl font-bold">Dashboard</h1>
                    <p style={{ color: "var(--text-secondary)" }} className="text-sm">
                        Bem-vindo ao CRM Hub — visão geral do seu pipeline
                    </p>
                </div>
                <div className="flex gap-2">
                    <Link href="/leads/import" className="btn-secondary text-sm hidden md:flex">
                        <Upload size={16} />
                        Importar
                    </Link>
                    <Link href="/campaigns/templates/editor" className="btn-primary text-sm">
                        <Mail size={16} />
                        <span className="hidden md:inline">Nova Campanha</span>
                    </Link>
                </div>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                {[
                    { label: "Total Leads", value: totalLeads || 0, change: "Em tempo real", icon: Users, color: "var(--brand-primary)" },
                    { label: "Taxa Conversão", value: "0%", change: "N/A", icon: TrendingUp, color: "var(--color-success)" },
                    { label: "Emails Enviados", value: "0", change: "Mensal", icon: Mail, color: "var(--color-info)" },
                    { label: "Jornadas Ativas", value: "0", change: "N/A", icon: Zap, color: "var(--brand-secondary)" },
                ].map((stat) => {
                    const Icon = stat.icon;
                    return (
                        <div key={stat.label} className="card p-5">
                            <div className="flex items-center justify-between mb-2">
                                <Icon size={18} style={{ color: stat.color }} />
                                <span className="text-xs font-medium" style={{ color: "var(--color-success)" }}>
                                    {stat.change}
                                </span>
                            </div>
                            <p className="text-2xl font-bold" style={{ color: stat.color }}>
                                {stat.value}
                            </p>
                            <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>
                                {stat.label}
                            </p>
                        </div>
                    );
                })}
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
                {[
                    { href: "/leads", label: "Pipeline", desc: "Kanban de leads", icon: Users, bg: "var(--brand-primary-light)", color: "var(--brand-primary)" },
                    { href: "/campaigns", label: "Campanhas", desc: "Email marketing", icon: Mail, bg: "#dbeafe", color: "#2563eb" },
                    { href: "/whatsapp", label: "WhatsApp", desc: "Inbox & mensagens", icon: MessageCircle, bg: "#dcfce7", color: "#166534" },
                    { href: "/journeys", label: "Jornadas", desc: "Automações", icon: GitBranch, bg: "#f3e8ff", color: "#7c3aed" },
                ].map((action) => {
                    const Icon = action.icon;
                    return (
                        <Link
                            key={action.href}
                            href={action.href}
                            className="card card-hover p-4 flex items-center gap-3 no-underline"
                        >
                            <div
                                className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
                                style={{ background: action.bg, color: action.color }}
                            >
                                <Icon size={20} />
                            </div>
                            <div className="min-w-0">
                                <h3 className="font-semibold text-sm" style={{ color: "var(--text-primary)" }}>
                                    {action.label}
                                </h3>
                                <p className="text-xs truncate" style={{ color: "var(--text-muted)" }}>
                                    {action.desc}
                                </p>
                            </div>
                        </Link>
                    );
                })}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                {/* Pipeline Funnel Mini */}
                <div className="card p-5">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="font-semibold text-sm" style={{ color: "var(--text-secondary)" }}>
                            FUNIL DO PIPELINE
                        </h2>
                        <Link href="/leads" className="text-xs flex items-center gap-1" style={{ color: "var(--brand-primary)" }}>
                            Ver pipeline <ArrowRight size={12} />
                        </Link>
                    </div>
                    <div className="space-y-2.5">
                        {funnelData.length === 0 ? (
                            <p className="text-sm text-center py-4" style={{ color: "var(--text-muted)" }}>
                                Nenhum estágio configurado.
                            </p>
                        ) : (
                            funnelData.map((s) => (
                                <div key={s.name}>
                                    <div className="flex justify-between text-xs mb-0.5">
                                        <span style={{ color: "var(--text-primary)" }}>{s.name}</span>
                                        <span className="font-bold" style={{ color: s.color }}>{s.count}</span>
                                    </div>
                                    <div className="w-full h-2 rounded-full" style={{ background: "var(--surface-hover)" }}>
                                        <div className="h-full rounded-full transition-all duration-700" style={{ width: `${s.pct}%`, background: s.color }} />
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* Recent Activity */}
                <div className="card p-5">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="font-semibold text-sm" style={{ color: "var(--text-secondary)" }}>
                            ATIVIDADE RECENTE
                        </h2>
                        <Link href="/analytics" className="text-xs flex items-center gap-1" style={{ color: "var(--brand-primary)" }}>
                            Ver tudo <ArrowRight size={12} />
                        </Link>
                    </div>
                    <div className="space-y-3">
                        {RECENT_ACTIVITIES.map((act, i) => (
                            <div key={i} className="flex items-center gap-3">
                                <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: act.color }} />
                                <p className="text-sm flex-1" style={{ color: "var(--text-primary)" }}>{act.text}</p>
                                <span className="text-xs flex items-center gap-1 flex-shrink-0" style={{ color: "var(--text-muted)" }}>
                                    <Clock size={10} />
                                    {act.time}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Recent Leads Table */}
            <div className="card overflow-hidden">
                <div className="px-5 py-4 flex items-center justify-between border-b" style={{ borderColor: "var(--border-light)" }}>
                    <h2 className="font-semibold text-sm" style={{ color: "var(--text-secondary)" }}>
                        LEADS RECENTES
                    </h2>
                    <Link href="/leads" className="text-xs flex items-center gap-1" style={{ color: "var(--brand-primary)" }}>
                        Ver todos <ArrowRight size={12} />
                    </Link>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr style={{ background: "var(--surface-hover)" }}>
                                <th className="text-left px-5 py-2.5 font-semibold text-xs" style={{ color: "var(--text-muted)" }}>Lead</th>
                                <th className="text-left px-5 py-2.5 font-semibold text-xs hidden md:table-cell" style={{ color: "var(--text-muted)" }}>Empresa</th>
                                <th className="text-center px-5 py-2.5 font-semibold text-xs" style={{ color: "var(--text-muted)" }}>Estágio</th>
                                <th className="text-right px-5 py-2.5 font-semibold text-xs" style={{ color: "var(--text-muted)" }}>Score</th>
                            </tr>
                        </thead>
                        <tbody>
                            {recentLeads.length === 0 ? (
                                <tr>
                                    <td colSpan={4} className="px-5 py-6 text-center text-sm" style={{ color: "var(--text-muted)" }}>
                                        Nenhum lead encontrado.
                                    </td>
                                </tr>
                            ) : (
                                recentLeads.map((lead) => (
                                    <tr key={lead.name} style={{ borderBottom: "1px solid var(--border-light)" }}>
                                        <td className="px-5 py-3 font-medium" style={{ color: "var(--text-primary)" }}>{lead.name}</td>
                                        <td className="px-5 py-3 hidden md:table-cell" style={{ color: "var(--text-secondary)" }}>{lead.company}</td>
                                        <td className="px-5 py-3 text-center">
                                            <span className="text-xs font-medium px-2.5 py-1 rounded-full border" style={{ borderColor: lead.stageColor, color: lead.stageColor }}>
                                                {lead.stage}
                                            </span>
                                        </td>
                                        <td className="px-5 py-3 text-right font-bold" style={{ color: lead.score >= 70 ? "var(--color-success)" : lead.score >= 40 ? "var(--color-warning)" : "var(--color-error)" }}>
                                            {lead.score}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
