"use client";

import { useEffect, useState } from "react";
import {
    Plus,
    Play,
    Pause,
    GitBranch,
    Zap,
    MoreHorizontal,
    Clock,
    Target,
    Loader2,
    Search,
    Filter
} from "lucide-react";
import Link from "next/link";
import { useToast } from "@/components/ui/Toast";

interface Journey {
    id: string;
    name: string;
    status: 'draft' | 'active' | 'paused' | 'archived';
    trigger_type: string;
    total_enrolled: number;
    conversion_rate: number;
    updated_at: string;
}

export default function JourneysPage() {
    const [journeys, setJourneys] = useState<Journey[]>([]);
    const [loading, setLoading] = useState(true);
    const { error } = useToast();
    const [view, setView] = useState<'journeys' | 'live'>('journeys');
    const [enrollments, setEnrollments] = useState<any[]>([]);

    useEffect(() => {
        const load = async () => {
            try {
                if (view === 'journeys') {
                    const res = await fetch('/api/journeys/list');
                    if (!res.ok) throw new Error("Erro ao buscar jornadas");
                    const data = await res.json();
                    setJourneys(data);
                } else {
                    const res = await fetch('/api/journeys/enrollments');
                    if (!res.ok) throw new Error("Erro ao buscar execuções");
                    const data = await res.json();
                    setEnrollments(data);
                }
            } catch (err) {
                error("Erro", "Não foi possível carregar os dados.");
            } finally {
                setLoading(false);
            }
        };

        load();
    }, [error, view]);

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'active': return { bg: '#ecfdf5', text: '#059669', border: '#10b98140' };
            case 'paused': return { bg: '#fffbeb', text: '#d97706', border: '#f59e0b40' };
            case 'draft': return { bg: '#f1f5f9', text: '#475569', border: '#94a3b840' };
            case 'completed': return { bg: '#eff6ff', text: '#2563eb', border: '#3b82f640' };
            default: return { bg: '#fef2f2', text: '#dc2626', border: '#ef444440' };
        }
    };

    const getTriggerIcon = (type: string) => {
        return <Zap size={14} className="text-amber-500" />;
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
                <Loader2 className="animate-spin text-brand-primary" size={32} />
                <p className="text-sm font-medium text-zinc-500">Organizando suas automações...</p>
            </div>
        );
    }

    return (
        <div className="animate-fade-in px-2">
            {/* Header section */}
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-2xl md:text-3xl font-black tracking-tight" style={{ color: "var(--text-primary)" }}>
                        Automações
                    </h1>
                    <p className="text-sm mt-1" style={{ color: "var(--text-secondary)" }}>
                        Crie fluxos de conversão automáticos e monitore em tempo real.
                    </p>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={async () => {
                            const res = await fetch('/api/journeys/install-templates', { method: 'POST' });
                            if (res.ok) window.location.reload();
                        }}
                        className="btn-secondary text-[10px] font-black uppercase tracking-widest px-4"
                        style={{ background: "transparent", color: "var(--brand-primary)", borderColor: "var(--brand-primary)" }}
                    >
                        Instalar Modelos
                    </button>
                    <Link href="/journeys/editor" className="btn-primary shadow-lg shadow-brand-primary/20">
                        <Plus size={18} />
                        Nova Jornada
                    </Link>
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                <div className="card p-5 bg-black dark:bg-zinc-900 border-none relative overflow-hidden group">
                    <div className="relative z-10">
                        <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400 mb-1">Leads em Jornadas</p>
                        <h3 className="text-2xl font-black text-white">
                            {journeys.reduce((acc, curr) => acc + (curr.total_enrolled || 0), 0)}
                        </h3>
                    </div>
                    <div className="absolute bottom-[-10px] right-[-10px] opacity-10 group-hover:scale-110 transition-transform">
                        <Zap size={64} className="text-zinc-100" />
                    </div>
                </div>

                <div className="card p-5 bg-white border-zinc-100 relative overflow-hidden group">
                    <div className="relative z-10">
                        <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400 mb-1 text-muted-foreground">Conversão Média</p>
                        <h3 className="text-2xl font-black" style={{ color: "var(--text-primary)" }}>
                            {(journeys.length > 0 ? (journeys.reduce((acc, curr) => acc + (curr.conversion_rate || 0), 0) / journeys.length).toFixed(1) : 0)}%
                        </h3>
                    </div>
                    <div className="absolute bottom-[-10px] right-[-10px] opacity-5 group-hover:scale-110 transition-transform">
                        <Target size={64} className="text-brand-primary" />
                    </div>
                </div>

                <div className="card p-5 bg-white border-zinc-100 relative overflow-hidden group">
                    <div className="relative z-10">
                        <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400 mb-1 text-muted-foreground">Execuções Ativas</p>
                        <h3 className="text-2xl font-black" style={{ color: "var(--text-primary)" }}>
                            {enrollments.filter(e => e.status === 'active').length}
                        </h3>
                    </div>
                    <div className="absolute bottom-[-10px] right-[-10px] opacity-5 group-hover:scale-110 transition-transform">
                        <Play size={64} className="text-brand-primary" />
                    </div>
                </div>

                <div className="card p-5 bg-white border-zinc-100 relative overflow-hidden group">
                    <div className="relative z-10">
                        <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400 mb-1 text-muted-foreground">Jornadas Ativas</p>
                        <h3 className="text-2xl font-black" style={{ color: "var(--text-primary)" }}>
                            {journeys.filter(j => j.status === 'active').length}
                        </h3>
                    </div>
                    <div className="absolute bottom-[-10px] right-[-10px] opacity-5 group-hover:scale-110 transition-transform">
                        <GitBranch size={64} className="text-brand-primary" />
                    </div>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-1 p-1 bg-zinc-100 dark:bg-zinc-900/50 rounded-2xl w-fit mb-8 border border-zinc-200/50 dark:border-white/5">
                <button
                    onClick={() => setView('journeys')}
                    className={`px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${view === 'journeys' ? 'bg-white dark:bg-zinc-800 shadow-xl shadow-black/5 text-brand-primary' : 'text-zinc-500 hover:text-zinc-700'}`}
                >
                    Modelos
                </button>
                <button
                    onClick={() => setView('live')}
                    className={`px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${view === 'live' ? 'bg-white dark:bg-zinc-800 shadow-xl shadow-black/5 text-brand-primary' : 'text-zinc-500 hover:text-zinc-700'}`}
                >
                    Execuções Ao Vivo
                </button>
            </div>

            {/* Controls */}
            {view === 'journeys' && (
                <div className="flex flex-wrap gap-3 mb-6">
                    <div className="relative flex-1 min-w-[200px] max-w-sm">
                        <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" />
                        <input
                            type="text"
                            placeholder="Buscar jornada..."
                            className="w-full pl-11 pr-4 py-3 rounded-2xl border-2 text-sm focus:ring-4 focus:ring-brand-primary/5 transition-all outline-none"
                            style={{ backgroundColor: "var(--surface)", borderColor: "var(--border)" }}
                        />
                    </div>
                </div>
            )}

            {/* List */}
            {view === 'journeys' ? (
                journeys.length === 0 ? (
                    <div className="card border-dashed border-2 py-20 flex flex-col items-center justify-center text-center">
                        <div className="w-16 h-16 rounded-3xl bg-zinc-50 dark:bg-zinc-900 flex items-center justify-center mb-4 text-zinc-300">
                            <GitBranch size={32} />
                        </div>
                        <h3 className="font-bold text-lg">Nenhuma jornada criada</h3>
                        <p className="text-zinc-500 text-sm max-w-xs mt-1 mb-6">
                            Comece a automatizar seus leads agora mesmo criando seu primeiro fluxo visual.
                        </p>
                        <div className="flex gap-3">
                            <Link href="/journeys/editor" className="btn-primary">
                                Começar Agora
                            </Link>
                            <button
                                onClick={async () => {
                                    const res = await fetch('/api/journeys/install-templates', { method: 'POST' });
                                    if (res.ok) window.location.reload();
                                }}
                                className="btn-secondary"
                            >
                                Instalar Modelos Prontos
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {journeys.map((j) => {
                            const statusColors = getStatusColor(j.status);
                            return (
                                <Link
                                    href={`/journeys/editor?id=${j.id}`}
                                    key={j.id}
                                    className="card group hover:scale-[1.02] hover:shadow-xl hover:border-brand-primary transition-all duration-300 p-5 cursor-pointer flex flex-col no-underline"
                                >
                                    <div className="flex items-start justify-between mb-4">
                                        <div
                                            className="text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full border"
                                            style={{ backgroundColor: statusColors.bg, color: statusColors.text, borderColor: statusColors.border }}
                                        >
                                            {j.status}
                                        </div>
                                        <button className="p-1 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg text-zinc-400">
                                            <MoreHorizontal size={16} />
                                        </button>
                                    </div>

                                    <h3 className="font-bold text-base mb-1 group-hover:text-brand-primary transition-colors line-clamp-1" style={{ color: "var(--text-primary)" }}>
                                        {j.name}
                                    </h3>

                                    <div className="flex items-center gap-2 mb-6 text-zinc-400">
                                        {getTriggerIcon(j.trigger_type)}
                                        <span className="text-xs font-medium uppercase tracking-tight">
                                            Gatilho: {j.trigger_type}
                                        </span>
                                    </div>

                                    <div className="mt-auto pt-4 border-t border-zinc-100 dark:border-zinc-800 grid grid-cols-2 gap-4">
                                        <div className="flex flex-col">
                                            <span className="text-[10px] font-bold text-zinc-400 uppercase">leads</span>
                                            <span className="text-lg font-black" style={{ color: "var(--text-primary)" }}>{j.total_enrolled || 0}</span>
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="text-[10px] font-bold text-zinc-400 uppercase">Conversão</span>
                                            <span className="text-lg font-black text-emerald-500">{j.conversion_rate || 0}%</span>
                                        </div>
                                    </div>

                                    <div className="mt-3 flex items-center justify-between">
                                        <div className="flex items-center gap-1.5 text-zinc-400">
                                            <Clock size={10} />
                                            <span className="text-[10px] font-bold">
                                                {new Date(j.updated_at).toLocaleDateString()}
                                            </span>
                                        </div>
                                        <div className="w-8 h-8 rounded-full bg-brand-primary/5 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                            <Play size={14} className="text-brand-primary ml-0.5" />
                                        </div>
                                    </div>
                                </Link>
                            );
                        })}
                    </div>
                )
            ) : (
                <div className="card overflow-hidden border-zinc-200/60 transition-all">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-zinc-50 dark:bg-zinc-900/50">
                                    <th className="p-4 text-[10px] font-black uppercase tracking-widest text-zinc-400 border-b border-zinc-100 dark:border-white/5">Lead</th>
                                    <th className="p-4 text-[10px] font-black uppercase tracking-widest text-zinc-400 border-b border-zinc-100 dark:border-white/5">Jornada</th>
                                    <th className="p-4 text-[10px] font-black uppercase tracking-widest text-zinc-400 border-b border-zinc-100 dark:border-white/5">Passo Atual</th>
                                    <th className="p-4 text-[10px] font-black uppercase tracking-widest text-zinc-400 border-b border-zinc-100 dark:border-white/5">Status</th>
                                    <th className="p-4 text-[10px] font-black uppercase tracking-widest text-zinc-400 border-b border-zinc-100 dark:border-white/5 text-right">Ações</th>
                                </tr>
                            </thead>
                            <tbody>
                                {enrollments.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} className="p-12 text-center text-zinc-400 text-sm italic">
                                            Nenhuma execução ativa no momento.
                                        </td>
                                    </tr>
                                ) : (
                                    enrollments.map((e) => {
                                        const statusColors = getStatusColor(e.status);

                                        const handleUpdateStatus = async (newStatus: string) => {
                                            try {
                                                const res = await fetch('/api/journeys/enrollments/update-status', {
                                                    method: 'POST',
                                                    body: JSON.stringify({ enrollmentId: e.id, status: newStatus })
                                                });
                                                if (!res.ok) throw new Error();
                                                // Refresh view
                                                const updated = enrollments.map(item =>
                                                    item.id === e.id ? { ...item, status: newStatus } : item
                                                );
                                                setEnrollments(updated);
                                            } catch (err) {
                                                error("Erro", "Não foi possível atualizar o status.");
                                            }
                                        };

                                        return (
                                            <tr key={e.id} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-800/20 transition-colors group">
                                                <td className="p-4 border-b border-zinc-100 dark:border-white/5">
                                                    <div className="flex flex-col">
                                                        <span className="font-bold text-sm" style={{ color: "var(--text-primary)" }}>{e.leads?.name}</span>
                                                        <span className="text-[10px] text-zinc-400">{e.leads?.email || e.leads?.phone}</span>
                                                    </div>
                                                </td>
                                                <td className="p-4 border-b border-zinc-100 dark:border-white/5">
                                                    <span className="text-sm font-medium text-zinc-600 dark:text-zinc-400">{e.journeys?.name}</span>
                                                </td>
                                                <td className="p-4 border-b border-zinc-100 dark:border-white/5">
                                                    <div className="flex items-center gap-2">
                                                        {e.status === 'active' && <div className="w-1.5 h-1.5 rounded-full bg-brand-primary animate-pulse" />}
                                                        <span className="text-sm font-bold text-zinc-700 dark:text-zinc-300">
                                                            {e.journey_steps?.name || 'Iniciando...'}
                                                        </span>
                                                    </div>
                                                </td>
                                                <td className="p-4 border-b border-zinc-100 dark:border-white/5">
                                                    <div
                                                        className="inline-flex text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full border"
                                                        style={{ backgroundColor: statusColors.bg, color: statusColors.text, borderColor: statusColors.border }}
                                                    >
                                                        {e.status}
                                                    </div>
                                                </td>
                                                <td className="p-4 border-b border-zinc-100 dark:border-white/5 text-right">
                                                    <div className="flex items-center justify-end gap-1">
                                                        {e.status === 'active' ? (
                                                            <button
                                                                onClick={() => handleUpdateStatus('paused')}
                                                                className="p-2 hover:bg-amber-50 hover:text-amber-600 rounded-xl transition-colors text-zinc-400"
                                                                title="Pausar"
                                                            >
                                                                <Pause size={14} />
                                                            </button>
                                                        ) : e.status === 'paused' ? (
                                                            <button
                                                                onClick={() => handleUpdateStatus('active')}
                                                                className="p-2 hover:bg-emerald-50 hover:text-emerald-600 rounded-xl transition-colors text-zinc-400"
                                                                title="Retomar"
                                                            >
                                                                <Play size={14} />
                                                            </button>
                                                        ) : null}

                                                        {['active', 'paused'].includes(e.status) && (
                                                            <button
                                                                onClick={() => handleUpdateStatus('dropped')}
                                                                className="p-2 hover:bg-red-50 hover:text-red-600 rounded-xl transition-colors text-zinc-400"
                                                                title="Cancelar Jornada"
                                                            >
                                                                <Target size={14} className="rotate-45" />
                                                            </button>
                                                        )}

                                                        <button className="p-2 hover:bg-zinc-100 rounded-xl transition-colors text-zinc-400">
                                                            <MoreHorizontal size={14} />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
}

