"use client";

import { useState, useEffect } from "react";
import { X, GitBranch, Zap, Target, Search, Loader2, Play } from "lucide-react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

interface Journey {
    id: string;
    name: string;
    description: string;
    trigger_type: string;
}

interface EnrollJourneyModalProps {
    open: boolean;
    onClose: () => void;
    onEnroll: (journeyId: string) => Promise<void>;
    leadName: string;
    enrolledJourneyIds: string[];
}

export function EnrollJourneyModal({ open, onClose, onEnroll, leadName, enrolledJourneyIds }: EnrollJourneyModalProps) {
    const [journeys, setJourneys] = useState<Journey[]>([]);
    const [loading, setLoading] = useState(true);
    const [enrollingId, setEnrollingId] = useState<string | null>(null);
    const [search, setSearch] = useState("");

    useEffect(() => {
        if (!open) return;

        const loadJourneys = async () => {
            setLoading(true);
            try {
                const res = await fetch('/api/journeys/list');
                const data = await res.json();
                if (res.ok) {
                    setJourneys(data.filter((j: any) => j.status === 'active') as Journey[]);
                }
            } catch (err) {
                console.error("Failed to load journeys", err);
            }
            setLoading(false);
        };

        loadJourneys();
    }, [open]);

    if (!open) return null;

    const filteredJourneys = journeys.filter(j =>
        j.name.toLowerCase().includes(search.toLowerCase()) &&
        !enrolledJourneyIds.includes(j.id)
    );

    const handleEnroll = async (id: string) => {
        setEnrollingId(id);
        await onEnroll(id);
        setEnrollingId(null);
        onClose();
    };

    return (
        <div
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in"
            onClick={onClose}
        >
            <div
                className="card p-0 w-full max-w-lg animate-slide-up overflow-hidden border-none shadow-2xl"
                onClick={(e) => e.stopPropagation()}
                style={{ background: "var(--surface)" }}
            >
                {/* Header */}
                <div className="p-6 border-b border-zinc-100 dark:border-white/5 bg-gradient-to-r from-brand-primary/5 to-transparent">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-brand-primary/10 flex items-center justify-center text-brand-primary">
                                <GitBranch size={20} />
                            </div>
                            <div>
                                <h2 className="text-lg font-black tracking-tight" style={{ color: "var(--text-primary)" }}>
                                    Atribuir Jornada
                                </h2>
                                <p className="text-xs font-medium" style={{ color: "var(--text-muted)" }}>
                                    Inscrevendo <span className="text-brand-primary font-bold">{leadName}</span> em um fluxo
                                </p>
                            </div>
                        </div>
                        <button onClick={onClose} className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-xl transition-colors text-zinc-400">
                            <X size={20} />
                        </button>
                    </div>

                    <div className="relative">
                        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
                        <input
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Buscar jornada ativa..."
                            className="w-full pl-10 pr-4 py-2.5 rounded-xl border-2 text-sm focus:ring-4 focus:ring-brand-primary/5 transition-all outline-none"
                            style={{ background: "var(--surface)", borderColor: "var(--border)", color: "var(--text-primary)" }}
                        />
                    </div>
                </div>

                {/* Body */}
                <div className="max-h-[400px] overflow-y-auto p-2">
                    {loading ? (
                        <div className="py-20 flex flex-col items-center gap-3 text-zinc-400">
                            <Loader2 className="animate-spin" size={24} />
                            <span className="text-xs font-bold uppercase tracking-widest">Buscando jornadas...</span>
                        </div>
                    ) : filteredJourneys.length === 0 ? (
                        <div className="py-20 text-center px-6">
                            <div className="w-12 h-12 rounded-2xl bg-zinc-50 dark:bg-zinc-900 flex items-center justify-center mx-auto mb-3 text-zinc-300">
                                <Search size={24} />
                            </div>
                            <h3 className="font-bold text-sm" style={{ color: "var(--text-primary)" }}>
                                Nenhuma jornada encontrada
                            </h3>
                            <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>
                                {search ? "Tente buscar por outro nome ou verifique se a jornada está ativa." : "Não há jornadas ativas disponíveis para este lead."}
                            </p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 gap-2">
                            {filteredJourneys.map((j) => (
                                <button
                                    key={j.id}
                                    onClick={() => handleEnroll(j.id)}
                                    disabled={!!enrollingId}
                                    className="group w-full p-4 rounded-2xl border-2 border-transparent hover:border-brand-primary/20 hover:bg-brand-primary/5 transition-all text-left flex items-center justify-between"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-lg bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center group-hover:bg-brand-primary group-hover:text-white transition-colors">
                                            <Zap size={16} className={j.trigger_type === 'manual' ? 'text-amber-500 group-hover:text-white' : ''} />
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-sm group-hover:text-brand-primary transition-colors" style={{ color: "var(--text-primary)" }}>
                                                {j.name}
                                            </h4>
                                            <p className="text-[10px] line-clamp-1 mt-0.5" style={{ color: "var(--text-muted)" }}>
                                                {j.description || "Sem descrição disponível."}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        {enrollingId === j.id ? (
                                            <Loader2 size={16} className="animate-spin text-brand-primary" />
                                        ) : (
                                            <Play size={14} className="text-zinc-300 group-hover:text-brand-primary group-hover:translate-x-1 transition-all" />
                                        )}
                                    </div>
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-4 bg-zinc-50 dark:bg-zinc-900/50 border-t border-zinc-100 dark:border-white/5 flex items-center justify-between">
                    <p className="text-[10px] font-bold text-zinc-400 px-2">
                        {filteredJourneys.length} JORNADAS DISPONÍVEIS
                    </p>
                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-xs font-black uppercase tracking-widest text-zinc-500 hover:text-zinc-700 transition-colors"
                    >
                        Fechar
                    </button>
                </div>
            </div>
        </div>
    );
}
