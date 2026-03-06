import {
    Users,
    Upload,
    TrendingUp,
    Mail,
    MessageCircle,
    GitBranch,
    ArrowRight,
    Clock,
    Zap,
    Activity,
    MousePointer2,
    Calendar,
    ChevronRight,
    Star
} from "lucide-react";
import Link from "next/link";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { DashboardStatCard } from "@/components/dashboard/DashboardStatCard";

export default async function DashboardPage() {
    const supabase = await createSupabaseServerClient();

    // Parallel Fetches
    const [
        { count: totalLeads },
        { data: pipeline },
        { data: recentLeadsData },
        { count: activeJourneys },
        { data: activeEnrollments }
    ] = await Promise.all([
        supabase.from('leads').select('*', { count: 'exact', head: true }),
        supabase.from('pipelines').select('id, name').order('created_at').limit(1).single(),
        supabase.from('leads').select('*').order('created_at', { ascending: false }).limit(6),
        supabase.from('journeys').select('*', { count: 'exact', head: true }).eq('status', 'active'),
        supabase.from('journey_enrollments').select('id, lead_id, journey_id, enrolled_at').order('enrolled_at', { ascending: false }).limit(4)
    ]);

    let funnelData: { name: string; count: number; color: string; pct: number }[] = [];
    let stagesMap: Record<string, any> = {};

    if (pipeline) {
        const { data: stages } = await supabase.from('pipeline_stages').select('*').eq('pipeline_id', (pipeline as any).id).order('position');
        if (stages && stages.length > 0) {
            const { data: leads } = await supabase.from('leads').select('current_stage_id');
            stages.forEach(stage => { stagesMap[stage.id] = stage; });

            const counts = stages.map(st => {
                const count = (leads || []).filter(l => l.current_stage_id === st.id).length;
                return { id: st.id, name: st.name, count };
            });

            const maxCount = Math.max(...counts.map(c => c.count), 1);
            funnelData = counts.map((st, i) => ({
                name: st.name,
                count: st.count,
                color: stagesMap[st.id]?.color || "#6366f1",
                pct: Math.round((st.count / maxCount) * 100)
            }));
        }
    }

    const recentLeads = (recentLeadsData || []).map(lead => {
        const stage = lead.current_stage_id ? stagesMap[lead.current_stage_id] : null;
        return {
            id: lead.id,
            name: lead.name,
            company: lead.company || "-",
            stage: stage ? stage.name : "Novo",
            score: lead.lead_score || 0,
            stageColor: stage ? stage.color : "#94a3b8"
        };
    });

    return (
        <div className="space-y-8 animate-fade-in p-2 lg:p-6 pb-20">
            {/* Header with Greeting */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-4 border-b border-zinc-100 dark:border-zinc-800">
                <div>
                    <div className="flex items-center gap-2 mb-2">
                        <Star className="text-brand-primary animate-pulse" size={16} fill="currentColor" />
                        <span className="text-[10px] font-black uppercase tracking-widest text-brand-primary">Sua central de crescimento</span>
                    </div>
                    <h1 className="text-4xl font-black text-zinc-900 dark:text-zinc-100 leading-tight">Dashboard Central</h1>
                    <p className="text-zinc-500 mt-2 text-sm font-medium">Você tem {totalLeads} leads protegidos e {activeJourneys || 0} automações rodando.</p>
                </div>
                <div className="flex items-center gap-3">
                    <Link href="/leads/import" className="btn-secondary text-xs h-10 px-4 group">
                        <Upload size={14} className="group-hover:-translate-y-0.5 transition-transform" />
                        Importar Dados
                    </Link>
                    <Link href="/leads" className="btn-primary text-xs h-10 px-4 group shadow-lg shadow-brand-primary/20">
                        <Users size={14} className="group-hover:scale-110 transition-transform" />
                        Gerenciar Pipeline
                    </Link>
                </div>
            </div>

            {/* Premium Stat Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <DashboardStatCard
                    label="Volume de Leads"
                    value={totalLeads || 0}
                    icon={Users}
                    change="+12%"
                    trend="up"
                    color="#6366f1"
                    description="Novos leads acumulados"
                />
                <DashboardStatCard
                    label="Automações Ativas"
                    value={activeJourneys || 0}
                    icon={Zap}
                    change="LIVE"
                    trend="neutral"
                    color="#f59e0b"
                    description="Jornadas em execução"
                />
                <DashboardStatCard
                    label="Taxa de Resposta"
                    value="24.8%"
                    icon={TrendingUp}
                    change="+2.4%"
                    trend="up"
                    color="#22c55e"
                    description="Performance de campanhas"
                />
                <DashboardStatCard
                    label="Agendamentos"
                    value="14"
                    icon={Calendar}
                    change="-5%"
                    trend="down"
                    color="#3b82f6"
                    description="Reuniões para esta semana"
                />
            </div>

            {/* Quick Actions Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                    { href: "/leads", label: "Pipeline", icon: Activity, color: "text-indigo-500", bg: "bg-indigo-50 dark:bg-indigo-500/10" },
                    { href: "/journeys", label: "Automações", icon: GitBranch, color: "text-purple-500", bg: "bg-purple-50 dark:bg-purple-500/10" },
                    { href: "/whatsapp", label: "WhatsApp", icon: MessageCircle, color: "text-emerald-500", bg: "bg-emerald-50 dark:bg-emerald-500/10" },
                    { href: "/campaigns", label: "Campanhas", icon: Mail, color: "text-blue-500", bg: "bg-blue-50 dark:bg-blue-500/10" },
                ].map((action) => (
                    <Link
                        key={action.href}
                        href={action.href}
                        className="group p-4 flex items-center justify-between rounded-2xl border-2 border-transparent hover:border-zinc-200 dark:hover:border-zinc-800 bg-white dark:bg-zinc-900 transition-all card-hover"
                    >
                        <div className="flex items-center gap-3">
                            <div className={`p-2 rounded-xl ${action.bg} ${action.color} group-hover:scale-110 transition-transform`}>
                                <action.icon size={18} />
                            </div>
                            <span className="text-xs font-black uppercase tracking-wider text-zinc-900 dark:text-zinc-100">{action.label}</span>
                        </div>
                        <ChevronRight size={14} className="text-zinc-300 group-hover:translate-x-1 group-hover:text-brand-primary transition-all" />
                    </Link>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Funnel Section */}
                <div className="lg:col-span-2 card p-8 space-y-8">
                    <div className="flex items-center justify-between border-b dark:border-zinc-800 pb-4">
                        <div className="flex items-center gap-3">
                            <TrendingUp size={20} className="text-zinc-400" />
                            <h2 className="font-black text-lg text-zinc-900 dark:text-zinc-100 uppercase tracking-tight">Fluxo do Pipeline</h2>
                        </div>
                        <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Total Leads: {totalLeads}</span>
                    </div>

                    <div className="space-y-6">
                        {funnelData.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-12 text-zinc-400 italic">
                                <MousePointer2 size={32} className="mb-2 opacity-20" />
                                <p className="text-sm">Configure seu pipeline para ver o funil</p>
                            </div>
                        ) : (
                            funnelData.map((s) => (
                                <div key={s.name} className="group cursor-default">
                                    <div className="flex justify-between items-end text-[11px] mb-2">
                                        <div className="flex items-center gap-2">
                                            <div className="w-1.5 h-1.5 rounded-full" style={{ background: s.color }} />
                                            <span className="font-bold uppercase tracking-wider text-zinc-600 dark:text-zinc-400">{s.name}</span>
                                        </div>
                                        <span className="font-black text-sm text-zinc-900 dark:text-zinc-100">{s.count} <span className="text-[10px] text-zinc-400 ml-1">leads</span></span>
                                    </div>
                                    <div className="w-full h-3 rounded-full bg-zinc-50 dark:bg-zinc-800/50 p-0.5 overflow-hidden">
                                        <div
                                            className="h-full rounded-full transition-all duration-1000 shadow-sm opacity-80 group-hover:opacity-100"
                                            style={{ width: `${s.pct}%`, background: s.color }}
                                        />
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* Automation Log / Recent Activity */}
                <div className="space-y-6">
                    <div className="card p-6 space-y-6 relative overflow-hidden">
                        <div className="flex items-center gap-3 border-b dark:border-zinc-800 pb-4 mb-2">
                            <Activity size={18} className="text-brand-primary" />
                            <h2 className="font-black text-sm text-zinc-900 dark:text-zinc-100 uppercase tracking-widest">Atividade Automática</h2>
                        </div>

                        <div className="space-y-4">
                            {activeEnrollments?.map((log: any) => (
                                <div key={log.id} className="flex gap-4 group">
                                    <div className="flex flex-col items-center gap-1 mt-1">
                                        <div className="w-2 h-2 rounded-full bg-brand-primary/40 group-hover:bg-brand-primary transition-colors" />
                                        <div className="w-0.5 flex-1 bg-zinc-100 dark:bg-zinc-800 rounded-full" />
                                    </div>
                                    <div className="flex-1 pb-4">
                                        <p className="text-xs font-bold text-zinc-800 dark:text-zinc-200 leading-snug">
                                            Lead inscrito em <span className="text-brand-primary">Jornada High Ticket</span>
                                        </p>
                                        <span className="text-[9px] font-black uppercase text-zinc-400 flex items-center gap-1 mt-1.5">
                                            <Clock size={10} /> {new Date(log.enrolled_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </span>
                                    </div>
                                </div>
                            ))}
                            {(!activeEnrollments || activeEnrollments.length === 0) && (
                                <p className="text-xs text-center text-zinc-400 py-6 italic">Nenhuma atividade recente.</p>
                            )}
                        </div>
                    </div>

                    {/* Pro Tip Card */}
                    <div className="bg-gradient-to-br from-brand-primary to-indigo-600 rounded-3xl p-6 text-white shadow-xl relative overflow-hidden group">
                        <div className="relative z-10 space-y-3">
                            <div className="flex items-center gap-2">
                                <Zap size={16} className="text-white fill-white" />
                                <span className="text-[10px] font-black uppercase tracking-widest opacity-80">Dica de Especialista</span>
                            </div>
                            <h3 className="text-lg font-bold leading-tight">Melhore seu Lead Score</h3>
                            <p className="text-xs text-zinc-100/80 leading-relaxed font-medium">Leads com faturamento maior que 50k convertem 3x mais rápido se taggeados com VIP na primeira hora.</p>
                            <button className="w-full py-2.5 mt-2 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-[10px] font-black uppercase tracking-widest transition-all">
                                Otimizar Pipeline
                            </button>
                        </div>
                        <Activity size={120} className="absolute -right-6 -bottom-6 opacity-10 group-hover:scale-110 group-hover:rotate-12 transition-transform duration-700" />
                    </div>
                </div>
            </div>

            {/* Recent Leads Unified List */}
            <div className="card overflow-hidden">
                <div className="px-5 py-5 flex items-center justify-between border-b dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50">
                    <div className="flex items-center gap-3">
                        <Users size={18} className="text-zinc-400" />
                        <h2 className="font-black text-sm text-zinc-900 dark:text-zinc-100 uppercase tracking-widest">Monitoramento de Leads Recentes</h2>
                    </div>
                    <Link href="/leads" className="text-[10px] font-black uppercase tracking-widest flex items-center gap-2 text-brand-primary hover:gap-3 transition-all">
                        Ver Todos Leads <ArrowRight size={12} />
                    </Link>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b dark:border-zinc-800">
                                <th className="text-left px-6 py-4 text-[10px] font-black uppercase tracking-widest text-zinc-400">Identificação</th>
                                <th className="text-left px-6 py-4 text-[10px] font-black uppercase tracking-widest text-zinc-400 hidden md:table-cell">Empresa</th>
                                <th className="text-center px-6 py-4 text-[10px] font-black uppercase tracking-widest text-zinc-400">Status No Fluxo</th>
                                <th className="text-right px-6 py-4 text-[10px] font-black uppercase tracking-widest text-zinc-400">Lead Score</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y dark:divide-zinc-800">
                            {recentLeads.length === 0 ? (
                                <tr><td colSpan={4} className="px-6 py-12 text-center text-zinc-400 italic">Nenhum lead em evidência hoje.</td></tr>
                            ) : (
                                recentLeads.map((lead) => (
                                    <tr key={lead.id} className="group hover:bg-zinc-50 dark:hover:bg-zinc-900/50 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col">
                                                <span className="font-bold text-zinc-900 dark:text-zinc-100 group-hover:text-brand-primary transition-colors">{lead.name}</span>
                                                <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-tight">Criado em {new Date().toLocaleDateString()}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 hidden md:table-cell font-medium text-zinc-500 dark:text-zinc-400 uppercase text-[11px] tracking-wider">{lead.company}</td>
                                        <td className="px-6 py-4 text-center">
                                            <span
                                                className="text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-full border shadow-sm inline-block"
                                                style={{ borderColor: lead.stageColor + '20', color: lead.stageColor, background: lead.stageColor + '05' }}
                                            >
                                                {lead.stage}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex flex-col items-end">
                                                <span className={`text-base font-black ${lead.score >= 70 ? "text-emerald-500" : lead.score >= 40 ? "text-amber-500" : "text-rose-500"}`}>
                                                    {lead.score}
                                                </span>
                                                <div className="w-12 h-1 bg-zinc-100 dark:bg-zinc-800 rounded-full mt-1 overflow-hidden">
                                                    <div className={`h-full rounded-full ${lead.score >= 70 ? "bg-emerald-500" : lead.score >= 40 ? "bg-amber-500" : "bg-rose-500"}`} style={{ width: `${lead.score}%` }} />
                                                </div>
                                            </div>
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
