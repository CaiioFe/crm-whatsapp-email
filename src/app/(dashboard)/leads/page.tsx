"use client";

import { useState, useMemo, useCallback, useEffect } from "react";
import { Upload, Plus, Download, Loader2 } from "lucide-react";
import Link from "next/link";
import { KanbanBoard } from "@/components/pipeline/KanbanBoard";
import { MobileList } from "@/components/pipeline/MobileList";
import {
    PipelineFilters,
    type PipelineFilterState,
} from "@/components/pipeline/PipelineFilters";
import { CreateLeadModal } from "@/components/ui/CreateLeadModal";
import { EnrollJourneyModal } from "@/components/ui/EnrollJourneyModal";
import { useToast } from "@/components/ui/Toast";
import { exportCSV } from "@/lib/export-csv";
import type { Lead, Tag, PipelineStage } from "@/types/database";
import { createSupabaseBrowserClient as createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

type LeadWithTags = Lead & { tags: Tag[] };

export default function LeadsPage() {
    const [leads, setLeads] = useState<LeadWithTags[]>([]);
    const [stages, setStages] = useState<PipelineStage[]>([]);
    const [tags, setTags] = useState<Tag[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const [filters, setFilters] = useState<PipelineFilterState>({
        search: "",
        selectedTags: [],
        scoreMin: 0,
        scoreMax: 100,
    });
    const [isMobile, setIsMobile] = useState(false);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [enrollModalLead, setEnrollModalLead] = useState<{ id: string; name: string } | null>(null);
    const toast = useToast();
    const router = useRouter();

    // Detect mobile
    useEffect(() => {
        const check = () => setIsMobile(window.innerWidth < 768);
        check();
        window.addEventListener("resize", check);
        return () => window.removeEventListener("resize", check);
    }, []);

    // Expose modal trigger to window for LeadCards
    useEffect(() => {
        (window as any).openEnrollModal = (id: string, name: string) => {
            setEnrollModalLead({ id, name });
        };
        return () => { delete (window as any).openEnrollModal; };
    }, []);

    // Fetch Data
    useEffect(() => {
        const fetchData = async () => {
            const supabase = createClient();
            setIsLoading(true);
            try {
                // Parallelize fetches for better speed
                const [tagsRes, pipelineRes, leadsRes] = await Promise.all([
                    supabase.from('tags').select('*'),
                    supabase.from('pipelines').select('id').order('created_at').limit(1).single(),
                    supabase.from('leads').select('*, lead_tags(tags(*))')
                ]);

                if (tagsRes.data) setTags(tagsRes.data);

                if (pipelineRes.data) {
                    const { data: stagesData } = await supabase
                        .from('pipeline_stages')
                        .select('*')
                        .eq('pipeline_id', pipelineRes.data.id)
                        .order('position');
                    if (stagesData) setStages(stagesData);
                }

                if (leadsRes.error) {
                    console.error("Error fetching leads:", leadsRes.error);
                } else if (leadsRes.data) {
                    const mappedLeads = (leadsRes.data as any[]).map(l => ({
                        ...l,
                        tags: l.lead_tags ? l.lead_tags.map((lt: any) => lt.tags).filter(Boolean) : []
                    })) as LeadWithTags[];
                    setLeads(mappedLeads);
                }

            } catch (err) {
                console.error('Fetch error:', err);
                toast.error('Erro de Conexão', 'Não foi possível carregar os dados.');
            } finally {
                setIsLoading(false);
            }
        };

        fetchData();
    }, [toast]);

    // Filter leads
    const filteredLeads = useMemo(() => {
        return leads.filter((lead) => {
            if (filters.search) {
                const q = filters.search.toLowerCase();
                if (
                    !lead.name.toLowerCase().includes(q) &&
                    !(lead.email || "").toLowerCase().includes(q) &&
                    !(lead.company || "").toLowerCase().includes(q)
                ) {
                    return false;
                }
            }

            if (filters.selectedTags.length > 0) {
                const leadTagIds = lead.tags.map((t) => t.id);
                if (!filters.selectedTags.some((t) => leadTagIds.includes(t))) {
                    return false;
                }
            }

            if (lead.lead_score < filters.scoreMin || lead.lead_score > filters.scoreMax) {
                return false;
            }

            return true;
        });
    }, [leads, filters]);

    const handleLeadMoved = useCallback(
        async (leadId: string, fromStageId: string, toStageId: string) => {
            // Optimistic update
            setLeads((prev) =>
                prev.map((l) =>
                    l.id === leadId ? { ...l, current_stage_id: toStageId } : l
                )
            );

            const toStage = stages.find((s) => s.id === toStageId);
            const lead = leads.find((l) => l.id === leadId);

            // Persist to Supabase
            const supabase = createClient();
            const { error } = await supabase.from('leads').update({ current_stage_id: toStageId }).eq('id', leadId);

            if (error) {
                toast.error("Erro", "Não foi possível mover o lead.");
                // Revert
                setLeads((prev) =>
                    prev.map((l) =>
                        l.id === leadId ? { ...l, current_stage_id: fromStageId } : l
                    )
                );
            } else if (lead && toStage) {
                toast.success(`${lead.name} → ${toStage.name}`, "Lead movido com sucesso");
            }
        },
        [leads, stages, toast]
    );

    const handleSwipeMove = useCallback(
        (leadId: string, direction: "left" | "right") => {
            const lead = leads.find((l) => l.id === leadId);
            if (!lead) return;

            const sortedStages = [...stages].sort((a, b) => a.position - b.position);
            const currentIndex = sortedStages.findIndex(
                (s) => s.id === lead.current_stage_id
            );

            let newIndex = currentIndex;
            if (direction === "right" && currentIndex < sortedStages.length - 1) {
                newIndex = currentIndex + 1;
            } else if (direction === "left" && currentIndex > 0) {
                newIndex = currentIndex - 1;
            }

            if (newIndex !== currentIndex) {
                handleLeadMoved(
                    leadId,
                    sortedStages[currentIndex].id,
                    sortedStages[newIndex].id
                );
            }
        },
        [leads, stages, handleLeadMoved]
    );

    const handleLeadClick = useCallback((leadId: string) => {
        router.push(`/leads/${leadId}`);
    }, [router]);

    const handleFiltersChange = useCallback((newFilters: PipelineFilterState) => {
        setFilters(newFilters);
    }, []);

    const handleExportCSV = () => {
        const data = filteredLeads.map((l) => ({
            nome: l.name,
            email: l.email || "",
            telefone: l.phone || "",
            empresa: l.company || "",
            score: l.lead_score,
            estagio: stages.find((s) => s.id === l.current_stage_id)?.name || "",
            tags: l.tags.map((t) => t.name).join("; "),
        }));
        exportCSV(data, `leads-${new Date().toISOString().slice(0, 10)}.csv`);
        toast.success("CSV exportado!", `${data.length} leads exportados`);
    };

    const handleCreateLead = async (data: Record<string, string>) => {
        try {
            const res = await fetch("/api/leads/save", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(data),
            });

            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.error || "Erro ao criar lead");
            }

            const newLead = await res.json();

            // Append to state so it shows up immediately
            setLeads(prev => [{ ...newLead, tags: [] }, ...prev]);

            toast.success("Sucesso", "Lead criado com sucesso!");
            setShowCreateModal(false);
        } catch (err: any) {
            toast.error("Erro", err.message);
        }
    };
    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[50vh] text-muted-foreground gap-4">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
                <p>Carregando leads...</p>
            </div>
        );
    }

    return (
        <div className="animate-fade-in">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
                <div>
                    <h1 className="text-xl md:text-2xl font-bold">Pipeline</h1>
                    <p className="text-sm text-muted-foreground">
                        {filteredLeads.length} leads · {stages.length} estágios
                    </p>
                </div>
                <div className="flex gap-2">
                    <button onClick={handleExportCSV} className="btn-secondary text-sm" title="Exportar CSV">
                        <Download size={16} />
                        <span className="hidden md:inline">Export</span>
                    </button>
                    <Link href="/leads/import" className="btn-secondary text-sm">
                        <Upload size={16} />
                        <span className="hidden md:inline">Importar</span>
                    </Link>
                    <button onClick={() => setShowCreateModal(true)} className="btn-primary text-sm" id="btn-add-lead">
                        <Plus size={16} />
                        <span className="hidden md:inline">Novo Lead</span>
                    </button>
                </div>
            </div>

            {/* Filters */}
            <div className="mb-4">
                <PipelineFilters tags={tags} onFiltersChange={handleFiltersChange} />
            </div>

            {/* Kanban (Desktop) or List (Mobile) */}
            {isMobile ? (
                <MobileList
                    stages={stages}
                    leads={filteredLeads}
                    onLeadClick={handleLeadClick}
                    onSwipeMove={handleSwipeMove}
                />
            ) : (
                <KanbanBoard
                    stages={stages}
                    leads={filteredLeads}
                    onLeadMoved={handleLeadMoved}
                    onLeadClick={handleLeadClick}
                />
            )}

            {/* Create Lead Modal */}
            <CreateLeadModal
                open={showCreateModal}
                onClose={() => setShowCreateModal(false)}
                onSave={handleCreateLead}
                stages={stages}
                availableTags={tags}
            />

            {/* Enroll Journey Modal */}
            {enrollModalLead && (
                <EnrollJourneyModal
                    open={!!enrollModalLead}
                    onClose={() => setEnrollModalLead(null)}
                    leadName={enrollModalLead.name}
                    enrolledJourneyIds={[]} // We don't have current enrollments here easily, but the API handles duplicates
                    onEnroll={async (journeyId) => {
                        try {
                            const res = await fetch("/api/journeys/enroll", {
                                method: "POST",
                                headers: { "Content-Type": "application/json" },
                                body: JSON.stringify({ leadId: enrollModalLead.id, journeyId })
                            });
                            const data = await res.json();
                            if (!res.ok) throw new Error(data.error || "Erro ao inscrever");
                            toast.success("Sucesso", "Lead inscrito na jornada!");
                        } catch (err: any) {
                            toast.error("Erro", err.message);
                        }
                    }}
                />
            )}
        </div>
    );
}
