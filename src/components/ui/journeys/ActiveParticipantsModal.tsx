"use client";

import { useState, useEffect } from "react";
import { X, Users, GitBranch, Map, Play, Loader2, Pause, Search } from "lucide-react";
import { useToast } from "@/components/ui/Toast";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { MoveStepModal } from "@/components/ui/MoveStepModal";
import Link from "next/link";

interface Participant {
    id: string;
    status: string;
    created_at: string;
    leads: {
        id: string;
        name: string;
        email: string;
        phone: string;
    };
    journeys: {
        id: string;
        name: string;
    };
    journey_steps?: {
        id: string;
        name: string;
        step_type: string;
    };
}

interface ActiveParticipantsModalProps {
    open: boolean;
    onClose: () => void;
    journeyId: string;
    journeyName: string;
}

export function ActiveParticipantsModal({ open, onClose, journeyId, journeyName }: ActiveParticipantsModalProps) {
    const [participants, setParticipants] = useState<Participant[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");

    // Move Step Flow
    const [moveData, setMoveData] = useState<{ enrollmentId: string, currentStepId?: string } | null>(null);
    const [showMoveModal, setShowMoveModal] = useState(false);

    const { success, error: showError } = useToast();

    const fetchParticipants = async () => {
        setLoading(true);
        try {
            const res = await fetch(`/api/journeys/enrollments?journey_id=${journeyId}`);
            if (res.ok) {
                const data = await res.json();
                setParticipants(data);
            }
        } catch (err) {
            console.error(err);
        }
        setLoading(false);
    };

    useEffect(() => {
        if (open && journeyId) {
            fetchParticipants();
        }
    }, [open, journeyId]);

    const handleTerminate = async (enrollmentId: string) => {
        if (!confirm("Deseja cancelar o fluxo para este lead? Ele não avançará mais.")) return;
        try {
            const res = await fetch('/api/journeys/enrollments/update-status', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id: enrollmentId, status: 'dropped' })
            });
            if (res.ok) {
                success("Automação Cancelada", "Lead foi removido da automação ativa.");
                fetchParticipants();
            } else {
                throw new Error("Erro ao atualizar.");
            }
        } catch (err) {
            showError("Erro", "Falha ao cancelar automação.");
        }
    };

    const handleMoveStep = async (stepId: string) => {
        if (!moveData) return;
        try {
            const res = await fetch('/api/journeys/enrollments/move', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ enrollment_id: moveData.enrollmentId, target_step_id: stepId })
            });

            if (!res.ok) throw new Error("Erro ao mover lead");

            success("Sucesso", "O lead foi movido para a etapa especificada.");
            fetchParticipants();
        } catch (err: any) {
            showError("Erro", err.message || "Erro ao mover lead.");
        }
    };

    if (!open) return null;

    const filteredParticipants = participants
        .filter(p => statusFilter === "all" || p.status === statusFilter)
        .filter(p => !search || p.leads?.name?.toLowerCase().includes(search.toLowerCase()) || p.leads?.email?.toLowerCase().includes(search.toLowerCase()));

    return (
        <>
            <div
                className="fixed inset-0 z-[90] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in"
                onClick={onClose}
            >
                <div
                    className="card p-0 w-full max-w-4xl max-h-[90vh] flex flex-col animate-slide-up overflow-hidden border-none shadow-2xl"
                    onClick={(e) => e.stopPropagation()}
                    style={{ background: "var(--surface)" }}
                >
                    {/* Header */}
                    <div className="p-6 border-b border-zinc-100 dark:border-white/5 bg-gradient-to-r from-brand-primary/5 to-transparent flex-shrink-0">
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-brand-primary/10 flex items-center justify-center text-brand-primary">
                                    <Users size={20} />
                                </div>
                                <div>
                                    <h2 className="text-lg font-black tracking-tight" style={{ color: "var(--text-primary)" }}>
                                        Participantes da Jornada
                                    </h2>
                                    <p className="text-xs font-medium" style={{ color: "var(--text-muted)" }}>
                                        {journeyName}
                                    </p>
                                </div>
                            </div>
                            <button onClick={onClose} className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-xl transition-colors text-zinc-400">
                                <X size={20} />
                            </button>
                        </div>

                        <div className="flex flex-col sm:flex-row gap-3">
                            <div className="relative flex-1">
                                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
                                <input
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    placeholder="Buscar lead por nome ou email..."
                                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border-2 text-sm focus:ring-4 focus:ring-brand-primary/5 transition-all outline-none"
                                    style={{ background: "var(--surface)", borderColor: "var(--border)", color: "var(--text-primary)" }}
                                />
                            </div>
                            <select
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value)}
                                className="w-full sm:w-48 px-4 py-2.5 rounded-xl border-2 text-sm font-bold bg-transparent focus:ring-4 focus:ring-brand-primary/5 outline-none"
                                style={{ borderColor: "var(--border)", color: "var(--text-primary)" }}
                            >
                                <option value="all">Todos os Status</option>
                                <option value="active">Em andamento</option>
                                <option value="completed">Concluídos</option>
                                <option value="dropped">Cancelados</option>
                                <option value="paused">Pausados</option>
                            </select>
                        </div>
                    </div>

                    {/* Table / List */}
                    <div className="flex-1 overflow-y-auto p-4 bg-zinc-50/30 dark:bg-zinc-900/10">
                        {loading ? (
                            <div className="py-20 flex flex-col items-center gap-3 text-zinc-400">
                                <Loader2 className="animate-spin" size={32} />
                                <span className="text-xs font-bold uppercase tracking-widest">Carregando leads...</span>
                            </div>
                        ) : filteredParticipants.length === 0 ? (
                            <div className="py-20 flex flex-col items-center gap-3 text-zinc-400">
                                <Users size={48} className="opacity-20 mb-2" />
                                <p className="text-sm font-medium">Nenhum participante encontrado.</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 gap-3">
                                {filteredParticipants.map(p => (
                                    <div key={p.id} className="card p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border border-zinc-100 hover:border-brand-primary/20 transition-colors">
                                        <div className="flex flex-col gap-1 flex-1">
                                            <div className="flex items-center gap-2">
                                                <Link href={`/leads/${p.leads?.id}`} target="_blank" className="font-bold text-sm hover:underline hover:text-brand-primary transition-colors" style={{ color: "var(--text-primary)" }}>
                                                    {p.leads?.name || "Sem Nome"}
                                                </Link>
                                                <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full ${p.status === 'active' ? 'bg-emerald-100 text-emerald-600' :
                                                    p.status === 'paused' ? 'bg-amber-100 text-amber-600' :
                                                        p.status === 'completed' ? 'bg-blue-100 text-blue-600' :
                                                            'bg-zinc-100 text-zinc-500'
                                                    }`}>
                                                    {p.status === 'active' ? 'Ativo' :
                                                        p.status === 'paused' ? 'Pausado' :
                                                            p.status === 'completed' ? 'Finalizado' : 'Interrompido'}
                                                </span>
                                            </div>
                                            <p className="text-[11px] font-medium" style={{ color: "var(--text-muted)" }}>{p.leads?.email || p.leads?.phone}</p>
                                        </div>

                                        <div className="bg-zinc-50 dark:bg-black/20 px-3 py-2 rounded-lg flex-1 border border-zinc-100 dark:border-white/5">
                                            <p className="text-[9px] font-bold text-zinc-400 uppercase mb-0.5 tracking-wider">Etapa Atual</p>
                                            <div className="flex items-center gap-2">
                                                <GitBranch size={12} className="text-brand-primary opacity-70" />
                                                <span className="text-xs font-bold truncate max-w-[200px]" style={{ color: "var(--text-primary)" }}>{p.journey_steps?.name || 'Iniciando / Finalizado'}</span>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-2 flex-shrink-0">
                                            {['active', 'paused'].includes(p.status) && (
                                                <div className="flex bg-white dark:bg-zinc-800 rounded-lg shadow-sm border border-zinc-200 dark:border-zinc-700 p-0.5 h-full">
                                                    <button
                                                        onClick={() => {
                                                            setMoveData({ enrollmentId: p.id, currentStepId: p.journey_steps?.id });
                                                            setShowMoveModal(true);
                                                        }}
                                                        className="p-1.5 px-3 rounded-md text-zinc-500 hover:text-brand-primary hover:bg-zinc-50 dark:hover:bg-zinc-700 transition-colors flex items-center gap-1.5 border-r border-zinc-100 dark:border-zinc-700 mr-0.5"
                                                        title="Mover de Etapa / Pular"
                                                    >
                                                        <Map size={14} />
                                                        <span className="text-[10px] font-bold uppercase tracking-widest hidden sm:inline">Mover</span>
                                                    </button>
                                                    <button
                                                        onClick={() => handleTerminate(p.id)}
                                                        className="p-1.5 px-3 rounded-md text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-colors flex items-center gap-1.5"
                                                        title="Cancelar Automação"
                                                    >
                                                        <X size={14} />
                                                        <span className="text-[10px] font-bold uppercase tracking-widest hidden sm:inline">Cancelar</span>
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {moveData && showMoveModal && (
                <MoveStepModal
                    open={showMoveModal}
                    onClose={() => { setShowMoveModal(false); setMoveData(null); }}
                    onMove={handleMoveStep}
                    journeyId={journeyId}
                    journeyName={journeyName}
                    currentStepId={moveData.currentStepId}
                />
            )}
        </>
    );
}
