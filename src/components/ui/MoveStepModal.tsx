"use client";

import { useState, useEffect } from "react";
import { X, Map, GitBranch, Search, Loader2, Target } from "lucide-react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

interface JourneyStep {
    id: string;
    name: string;
    step_type: string;
    position_y?: number;
}

interface MoveStepModalProps {
    open: boolean;
    onClose: () => void;
    onMove: (stepId: string) => Promise<void>;
    journeyId: string;
    journeyName: string;
    currentStepId?: string;
}

const STEP_ICONS: Record<string, any> = {
    trigger: Target,
    wait: Loader2,
    send_whatsapp: Target,
    send_email: Target,
    condition: GitBranch,
};

export function MoveStepModal({ open, onClose, onMove, journeyId, journeyName, currentStepId }: MoveStepModalProps) {
    const [steps, setSteps] = useState<JourneyStep[]>([]);
    const [loading, setLoading] = useState(true);
    const [movingId, setMovingId] = useState<string | null>(null);
    const [search, setSearch] = useState("");

    useEffect(() => {
        if (!open || !journeyId) return;

        const loadSteps = async () => {
            setLoading(true);
            try {
                const supabase = createSupabaseBrowserClient();
                const { data, error } = await supabase
                    .from('journey_steps')
                    .select('id, name, step_type, position_y')
                    .eq('journey_id', journeyId)
                    .order('position_y', { ascending: true }); // approximate flow order

                if (!error && data) {
                    setSteps(data);
                }
            } catch (err) {
                console.error("Failed to load steps", err);
            }
            setLoading(false);
        };

        loadSteps();
    }, [open, journeyId]);

    if (!open) return null;

    const filteredSteps = steps.filter(s =>
        (s.name || s.step_type).toLowerCase().includes(search.toLowerCase())
    );

    const handleMove = async (id: string) => {
        setMovingId(id);
        await onMove(id);
        setMovingId(null);
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
                                <Map size={20} />
                            </div>
                            <div>
                                <h2 className="text-lg font-black tracking-tight" style={{ color: "var(--text-primary)" }}>
                                    Mover Lead
                                </h2>
                                <p className="text-xs font-medium" style={{ color: "var(--text-muted)" }}>
                                    Pular ou voltar em <span className="text-brand-primary font-bold">{journeyName}</span>
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
                            placeholder="Buscar passo da jornada..."
                            className="w-full pl-10 pr-4 py-2.5 rounded-xl border-2 text-sm focus:ring-4 focus:ring-brand-primary/5 transition-all outline-none"
                            style={{ background: "var(--surface)", borderColor: "var(--border)", color: "var(--text-primary)" }}
                        />
                    </div>
                </div>

                {/* Body */}
                <div className="max-h-[400px] overflow-y-auto p-4">
                    {loading ? (
                        <div className="py-20 flex flex-col items-center gap-3 text-zinc-400">
                            <Loader2 className="animate-spin" size={24} />
                            <span className="text-xs font-bold uppercase tracking-widest">Buscando etapas...</span>
                        </div>
                    ) : filteredSteps.length === 0 ? (
                        <div className="py-20 text-center px-6">
                            <h3 className="font-bold text-sm" style={{ color: "var(--text-primary)" }}>
                                Nenhum passo encontrado
                            </h3>
                            <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>{search ? "Tente buscar por outro nome." : "Esta jornada não possui passos renderizados."}</p>
                        </div>
                    ) : (
                        <div className="flex flex-col gap-2 relative border-l-2 ml-4 pl-4 border-zinc-100 dark:border-zinc-800">
                            {filteredSteps.map((s) => {
                                const isCurrent = s.id === currentStepId;
                                const StepIcon = STEP_ICONS[s.step_type] || Target;

                                return (
                                    <button
                                        key={s.id}
                                        onClick={() => !isCurrent && handleMove(s.id)}
                                        disabled={!!movingId || isCurrent}
                                        className={`group w-full p-4 rounded-2xl border-2 border-transparent transition-all text-left flex items-center justify-between relative ${isCurrent ? 'bg-zinc-50 dark:bg-zinc-900 opacity-50 cursor-default' : 'hover:border-brand-primary/20 hover:bg-brand-primary/5'}`}
                                    >
                                        {/* Timeline Dot */}
                                        <div className={`absolute -left-[23px] w-3 h-3 rounded-full border-2 border-white dark:border-zinc-950 ${isCurrent ? 'bg-emerald-500' : 'bg-zinc-300 dark:bg-zinc-700'}`} />

                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-lg bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center transition-colors">
                                                <StepIcon size={16} className={isCurrent ? 'text-emerald-500' : 'text-zinc-500 group-hover:text-brand-primary'} />
                                            </div>
                                            <div>
                                                <h4 className="font-bold text-sm transition-colors" style={{ color: "var(--text-primary)" }}>
                                                    {s.name || s.step_type.toUpperCase()}
                                                </h4>
                                                <p className="text-[10px] uppercase font-bold mt-0.5" style={{ color: "var(--text-muted)" }}>
                                                    {isCurrent ? 'ESTÁGIO ATUAL' : s.step_type}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            {movingId === s.id ? (
                                                <Loader2 size={16} className="animate-spin text-brand-primary" />
                                            ) : (
                                                !isCurrent && <span className="text-[10px] font-bold text-brand-primary opacity-0 group-hover:opacity-100 px-2 py-1 bg-brand-primary/10 rounded-lg transition-opacity">
                                                    Mover p/ cá
                                                </span>
                                            )}
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-4 bg-zinc-50 dark:bg-zinc-900/50 border-t border-zinc-100 dark:border-white/5 flex flex-col sm:flex-row items-center justify-between gap-3">
                    <p className="text-[10px] font-medium text-zinc-400 px-2 text-center sm:text-left">
                        Mover um lead interrompe qualquer tempo de espera atual e executa o novo passo imediatamente.
                    </p>
                    <button
                        onClick={onClose}
                        className="w-full sm:w-auto px-4 py-2 text-xs font-black uppercase tracking-widest text-zinc-500 hover:text-zinc-700 transition-colors bg-white dark:bg-zinc-800 border dark:border-zinc-700 rounded-xl sm:border-none sm:bg-transparent"
                    >
                        Fechar
                    </button>
                </div>
            </div>
        </div>
    );
}
