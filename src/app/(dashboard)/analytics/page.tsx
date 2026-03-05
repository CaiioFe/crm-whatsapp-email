import { BarChart3, TrendingUp, Users, Mail, MessageCircle, GitBranch } from "lucide-react";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function AnalyticsPage() {
    const supabase = await createSupabaseServerClient();

    // Fetch real metrics
    const { count: totalLeads } = await supabase
        .from("leads")
        .select("*", { count: "exact", head: true });

    const { data: stagesData } = await supabase
        .from("leads")
        .select("stage");

    // Process funnel data
    const STAGE_CONFIG = [
        { label: "Novo", id: "novo", color: "#6366f1" },
        { label: "Contato", id: "contato", color: "#3b82f6" },
        { label: "Qualificado", id: "qualificado", color: "#f59e0b" },
        { label: "Proposta", id: "proposta", color: "#f97316" },
        { label: "Convertido", id: "convertido", color: "#22c55e" },
    ];

    const funnelData = STAGE_CONFIG.map(config => {
        const count = stagesData?.filter(l => l.stage === config.id).length || 0;
        const percentage = totalLeads ? Math.round((count / totalLeads) * 100) : 0;
        return {
            stage: config.label,
            count,
            color: config.color,
            percentage
        };
    });

    // Initial zero data for channels since engine is in development
    const CHANNEL_STATS = [
        { channel: "Email", icon: Mail, sent: 0, opened: 0, clicked: 0, color: "#3b82f6" },
        { channel: "WhatsApp", icon: MessageCircle, sent: 0, opened: 0, clicked: 0, color: "#22c55e" },
        { channel: "Jornadas", icon: GitBranch, sent: 0, opened: 0, clicked: 0, color: "#8b5cf6" },
    ];

    return (
        <div className="animate-fade-in">
            <h1 className="text-xl md:text-2xl font-bold mb-1">Analytics</h1>
            <p className="text-sm mb-6" style={{ color: "var(--text-secondary)" }}>
                Métricas e relatórios reais do seu CRM
            </p>

            {/* KPI Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                {[
                    { label: "Total Leads", value: totalLeads || 0, change: "Real time", icon: Users, color: "var(--brand-primary)" },
                    { label: "Taxa Conversão", value: "0%", change: "---", icon: TrendingUp, color: "var(--color-success)" },
                    { label: "Emails Enviados", value: "0", change: "---", icon: Mail, color: "var(--color-info)" },
                    { label: "WhatsApp Msgs", value: "0", change: "---", icon: MessageCircle, color: "#22c55e" },
                ].map((kpi) => {
                    const Icon = kpi.icon;
                    return (
                        <div key={kpi.label} className="card p-5">
                            <div className="flex items-center justify-between mb-2">
                                <Icon size={18} style={{ color: kpi.color }} />
                                <span className="text-[10px] uppercase font-bold" style={{ color: "var(--text-muted)" }}>
                                    {kpi.change}
                                </span>
                            </div>
                            <p className="text-2xl font-bold" style={{ color: kpi.color }}>
                                {kpi.value}
                            </p>
                            <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>
                                {kpi.label}
                            </p>
                        </div>
                    );
                })}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Funnel */}
                <div className="card p-6">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="font-semibold text-sm flex items-center gap-2" style={{ color: "var(--text-secondary)" }}>
                            <BarChart3 size={16} />
                            FUNIL DE CONVERSÃO
                        </h2>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-100 text-blue-700">DADOS REAIS</span>
                    </div>
                    <div className="space-y-3">
                        {funnelData.map((stage) => (
                            <div key={stage.stage}>
                                <div className="flex items-center justify-between mb-1">
                                    <span className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>
                                        {stage.stage}
                                    </span>
                                    <span className="text-sm font-bold" style={{ color: stage.color }}>
                                        {stage.count}
                                    </span>
                                </div>
                                <div className="w-full h-3 rounded-full" style={{ background: "var(--surface-hover)" }}>
                                    <div
                                        className="h-full rounded-full transition-all duration-700"
                                        style={{ width: `${Math.max(5, stage.percentage)}%`, background: stage.color }}
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Channel Performance */}
                <div className="card p-6">
                    <h2 className="font-semibold text-sm mb-4" style={{ color: "var(--text-secondary)" }}>
                        PERFORMANCE POR CANAL
                    </h2>
                    <div className="space-y-4">
                        {CHANNEL_STATS.map((ch) => {
                            const Icon = ch.icon;
                            return (
                                <div key={ch.channel} className="p-4 rounded-lg border border-dashed" style={{ borderColor: "var(--border)" }}>
                                    <div className="flex items-center justify-between mb-3">
                                        <div className="flex items-center gap-2">
                                            <Icon size={16} style={{ color: ch.color }} />
                                            <span className="font-semibold text-sm" style={{ color: "var(--text-primary)" }}>{ch.channel}</span>
                                        </div>
                                        <span className="text-[10px] text-orange-600 font-bold uppercase">Aguardando Disparos</span>
                                    </div>
                                    <div className="grid grid-cols-3 gap-3 text-center opacity-40">
                                        <div>
                                            <p className="text-lg font-bold" style={{ color: "var(--text-primary)" }}>0</p>
                                            <p className="text-[10px]" style={{ color: "var(--text-muted)" }}>Enviados</p>
                                        </div>
                                        <div>
                                            <p className="text-lg font-bold" style={{ color: "var(--color-success)" }}>0%</p>
                                            <p className="text-[10px]" style={{ color: "var(--text-muted)" }}>Aberturas</p>
                                        </div>
                                        <div>
                                            <p className="text-lg font-bold" style={{ color: "var(--color-info)" }}>0%</p>
                                            <p className="text-[10px]" style={{ color: "var(--text-muted)" }}>Cliques</p>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        </div>
    );
}
