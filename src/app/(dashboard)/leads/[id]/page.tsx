"use client";

import { useState, useMemo, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import type { Lead, Tag } from "@/types/database";
import {
    ArrowLeft,
    Mail,
    Phone,
    MessageCircle,
    StickyNote,
    Tag as TagIcon,
    ArrowRightLeft,
    TrendingUp,
    Download,
    Edit3,
    Check,
    X,
    Plus,
    ChevronDown,
    ChevronRight,
    Building2,
    Briefcase,
    Clock,
    Star,
    GitBranch,
    Instagram,
    Globe,
    BarChart3,
    MapPin,
    ArrowRight,
    Zap,
    Trash2,
    Send,
} from "lucide-react";
import Link from "next/link";
import { SendWhatsAppModal } from "@/components/ui/SendWhatsAppModal";
import { EnrollJourneyModal } from "@/components/ui/EnrollJourneyModal";
import { ConfirmModal } from "@/components/ui/ConfirmModal";
import { useToast } from "@/components/ui/Toast";
import type { InteractionType, Interaction } from "@/types/database";
import { useFeatureFlag } from "@/components/layout/FeatureFlagProvider";

// ============================================================
// Interaction Icon & Color Map
// ============================================================
const INTERACTION_CONFIG: Record<
    InteractionType,
    { icon: typeof Mail; color: string; bg: string; label: string }
> = {
    email_sent: { icon: Mail, color: "#3b82f6", bg: "#dbeafe", label: "Email enviado" },
    email_received: { icon: Mail, color: "#6366f1", bg: "#e0e7ff", label: "Email recebido" },
    email_opened: { icon: Mail, color: "#22c55e", bg: "#dcfce7", label: "Email aberto" },
    email_clicked: { icon: TrendingUp, color: "#22c55e", bg: "#dcfce7", label: "Email clicado" },
    email_bounced: { icon: X, color: "#ef4444", bg: "#fee2e2", label: "Email bounced" },
    whatsapp_sent: { icon: MessageCircle, color: "#22c55e", bg: "#dcfce7", label: "WhatsApp enviado" },
    whatsapp_received: { icon: MessageCircle, color: "#16a34a", bg: "#bbf7d0", label: "WhatsApp recebido" },
    whatsapp_read: { icon: MessageCircle, color: "#3b82f6", bg: "#dbeafe", label: "WhatsApp lido" },
    whatsapp_replied: { icon: MessageCircle, color: "#8b5cf6", bg: "#ede9fe", label: "WhatsApp respondido" },
    note: { icon: StickyNote, color: "#f59e0b", bg: "#fef3c7", label: "Nota" },
    stage_change: { icon: ArrowRightLeft, color: "#8b5cf6", bg: "#ede9fe", label: "Mudança de estágio" },
    tag_change: { icon: TagIcon, color: "#06b6d4", bg: "#cffafe", label: "Tag alterada" },
    score_change: { icon: TrendingUp, color: "#f97316", bg: "#ffedd5", label: "Score alterado" },
    import: { icon: Download, color: "#64748b", bg: "#f1f5f9", label: "Importado" },
};

function formatDate(dateStr: string): string {
    const d = new Date(dateStr);
    return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" });
}

function formatTime(dateStr: string): string {
    const d = new Date(dateStr);
    return d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
}

function scoreLabel(score: number): { text: string; color: string; bg: string } {
    if (score >= 71) return { text: "Quente 🔥", color: "#dc2626", bg: "#fee2e2" };
    if (score >= 31) return { text: "Morno ☀️", color: "#d97706", bg: "#fef3c7" };
    return { text: "Frio ❄️", color: "#3b82f6", bg: "#dbeafe" };
}

// ============================================================
// Inline Editable Field
// ============================================================
function InlineEdit({
    value,
    onSave,
    label,
}: {
    value: string;
    onSave: (val: string) => void;
    label: string;
}) {
    const [editing, setEditing] = useState(false);
    const [draft, setDraft] = useState(value);

    if (editing) {
        return (
            <div className="flex items-center gap-1">
                <input
                    autoFocus
                    value={draft}
                    onChange={(e) => setDraft(e.target.value)}
                    className="text-sm px-2 py-1 rounded border flex-1"
                    style={{
                        background: "var(--surface)",
                        borderColor: "var(--brand-primary)",
                        color: "var(--text-primary)",
                    }}
                    onKeyDown={(e) => {
                        if (e.key === "Enter") {
                            onSave(draft);
                            setEditing(false);
                        }
                        if (e.key === "Escape") {
                            setDraft(value);
                            setEditing(false);
                        }
                    }}
                />
                <button
                    onClick={() => { onSave(draft); setEditing(false); }}
                    className="p-1 rounded"
                    style={{ color: "var(--color-success)" }}
                >
                    <Check size={14} />
                </button>
                <button
                    onClick={() => { setDraft(value); setEditing(false); }}
                    className="p-1 rounded"
                    style={{ color: "var(--color-error)" }}
                >
                    <X size={14} />
                </button>
            </div>
        );
    }

    return (
        <div
            className="group flex items-center gap-2 cursor-pointer rounded px-1 -mx-1 py-0.5 transition-colors"
            onClick={() => setEditing(true)}
            style={{ color: "var(--text-primary)" }}
            onMouseEnter={(e) => (e.currentTarget.style.background = "var(--surface-hover)")}
            onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
        >
            <span className="text-sm">{value || <span style={{ color: "var(--text-muted)" }}>—</span>}</span>
            <Edit3
                size={12}
                className="opacity-0 group-hover:opacity-100 transition-opacity"
                style={{ color: "var(--text-muted)" }}
            />
        </div>
    );
}

// ============================================================
// Timeline Item
// ============================================================
function TimelineItem({ interaction }: { interaction: Interaction }) {
    const config = INTERACTION_CONFIG[interaction.type] || INTERACTION_CONFIG.note;
    const Icon = config.icon;

    return (
        <div className="flex gap-3 animate-fade-in">
            {/* Icon */}
            <div className="flex flex-col items-center">
                <div
                    className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
                    style={{ background: config.bg, color: config.color }}
                >
                    <Icon size={14} />
                </div>
                <div className="w-0.5 flex-1 mt-1" style={{ background: "var(--border-light)" }} />
            </div>

            {/* Content */}
            <div className="flex-1 pb-6">
                <div className="flex items-center justify-between mb-0.5">
                    <p className="font-medium text-sm" style={{ color: "var(--text-primary)" }}>
                        {interaction.title}
                    </p>
                    <span className="text-[10px] flex-shrink-0 ml-2" style={{ color: "var(--text-muted)" }}>
                        {formatTime(interaction.created_at)}
                    </span>
                </div>
                {interaction.body && (
                    <p className="text-xs mt-1 leading-relaxed" style={{ color: "var(--text-secondary)" }}>
                        {interaction.body}
                    </p>
                )}
                <p className="text-[10px] mt-1" style={{ color: "var(--text-muted)" }}>
                    {formatDate(interaction.created_at)}
                </p>
            </div>
        </div>
    );
}

// ============================================================
// MAIN PAGE
// ============================================================
export default function LeadProfilePage() {
    const isJourneyEnabled = useFeatureFlag('journey_engine');
    const params = useParams();
    const router = useRouter();
    const leadId = params.id as string;

    const [lead, setLead] = useState<(Lead & { tags: Tag[] }) | null>(null);
    const [stages, setStages] = useState<any[]>([]);
    const [interactions, setInteractions] = useState<Interaction[]>([]);
    const [enrollmentsList, setEnrollmentsList] = useState<any[]>([]);
    const [availableJourneys, setAvailableJourneys] = useState<any[]>([]);
    const [isEnrolling, setIsEnrolling] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [showWhatsAppModal, setShowWhatsAppModal] = useState(false);
    const [showEnrollModal, setShowEnrollModal] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    useEffect(() => {
        const fetchLead = async () => {
            const { createSupabaseBrowserClient } = await import("@/lib/supabase/client");
            const supabase = createSupabaseBrowserClient();

            // fetch stages
            const { data: pipeline } = await supabase.from('pipelines').select('id').limit(1).single();
            if (pipeline) {
                const { data: stgs } = await supabase.from('pipeline_stages').select('*').eq('pipeline_id', pipeline.id).order('position');
                if (stgs) setStages(stgs);
            }

            // fetch lead
            const { data: l, error } = await supabase.from('leads').select('*, lead_tags(tags(*))').eq('id', leadId).single();
            if (l) {
                setLead({ ...l, tags: l.lead_tags ? l.lead_tags.map((lt: any) => lt.tags) : [] } as any);
            } else {
                console.error("Lead not found", error);
            }
            // fetch interactions
            const { data: inters, error: iErr } = await supabase.from('interactions').select('*').eq('lead_id', leadId).order('created_at', { ascending: false });
            if (inters) setInteractions(inters as Interaction[]);

            // fetch journey enrollments
            try {
                const res = await fetch('/api/journeys/enrollments');
                if (res.ok) {
                    const data = await res.json();
                    setEnrollmentsList(data.filter((e: any) =>
                        e.leads?.id === leadId
                    ));
                }
            } catch (err) {
                console.error("Failed to fetch enrollments", err);
            }

            // fetch available active journeys
            try {
                const res = await fetch('/api/journeys/list');
                if (res.ok) {
                    const data = await res.json();
                    setAvailableJourneys(data.filter((j: any) => j.status === 'active'));
                }
            } catch (err) {
                console.error("Failed to fetch available journeys", err);
            }

            setIsLoading(false);
        };
        fetchLead();
    }, [leadId]);

    const currentStage = useMemo(
        () => stages.find((s) => s.id === lead?.current_stage_id),
        [lead, stages]
    );

    const [noteText, setNoteText] = useState("");
    const [showAddNote, setShowAddNote] = useState(false);
    const [showStageSelect, setShowStageSelect] = useState(false);
    const [mobileSection, setMobileSection] = useState<Set<string>>(new Set(["info", "timeline"]));
    const { success: toastSuccess, error: toastError } = useToast();

    const enrollInJourney = async (journeyId: string) => {
        if (!journeyId) return;
        setIsEnrolling(true);
        try {
            const res = await fetch("/api/journeys/enroll", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ leadId, journeyId })
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Erro ao inscrever");
            toastSuccess("Sucesso", "Lead inscrito na jornada com sucesso!");

            // Fetch updated journey enrollments
            try {
                const resEnd = await fetch('/api/journeys/enrollments');
                if (resEnd.ok) {
                    const data = await resEnd.json();
                    setEnrollmentsList(data.filter((e: any) =>
                        e.leads?.id === leadId
                    ));
                }
            } catch (err) {
                console.error(err);
            }

        } catch (err: any) {
            toastError("Erro", err.message);
        } finally {
            setIsEnrolling(false);
        }
    };
    const terminateJourney = async (enrollmentId: string) => {
        if (!confirm("Tem certeza que deseja terminar esta automação para este lead?")) return;

        try {
            const res = await fetch("/api/journeys/enrollments/update-status", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ enrollmentId, status: 'dropped' })
            });

            if (!res.ok) throw new Error("Erro ao encerrar jornada");

            toastSuccess("Sucesso", "Automação encerrada.");

            // Update list from server
            const resList = await fetch('/api/journeys/enrollments');
            if (resList.ok) {
                const data = await resList.json();
                setEnrollmentsList(data.filter((e: any) => e.leads?.id === leadId));
            }
        } catch (err: any) {
            toastError("Erro", err.message);
        }
    };

    const handleUpdateLead = async (updates: Partial<Lead>) => {
        try {
            const { createSupabaseBrowserClient } = await import("@/lib/supabase/client");
            const supabase = createSupabaseBrowserClient();

            const { error } = await supabase
                .from('leads')
                .update(updates)
                .eq('id', leadId);

            if (error) throw error;

            setLead(prev => prev ? { ...prev, ...updates } : null);
            toastSuccess("Sucesso", "Informações atualizadas");
        } catch (err: any) {
            console.error("Update error:", err);
            toastError("Erro", "Não foi possível atualizar o lead");
        }
    };

    const handleDeleteLead = async () => {
        setIsDeleting(true);
        try {
            const res = await fetch(`/api/leads/delete?id=${leadId}`, { method: "DELETE" });
            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || "Erro ao excluir lead");
            }
            toastSuccess("Excluído", "O lead foi removido com sucesso.");
            router.push("/leads");
        } catch (err: any) {
            toastError("Erro", err.message);
            setIsDeleting(false);
        }
    };

    const handleUpdateCustomField = async (key: string, value: any) => {
        try {
            const { createSupabaseBrowserClient } = await import("@/lib/supabase/client");
            const supabase = createSupabaseBrowserClient();

            const newCustomFields = { ...(lead?.custom_fields as any || {}), [key]: value };

            const { error } = await supabase
                .from('leads')
                .update({ custom_fields: newCustomFields })
                .eq('id', leadId);

            if (error) throw error;

            setLead(prev => prev ? { ...prev, custom_fields: newCustomFields } : null);
            toastSuccess("Sucesso", `${key} atualizado`);
        } catch (err: any) {
            toastError("Erro", "Não foi possível atualizar o campo");
        }
    };

    if (isLoading) {
        return <div className="text-center py-16">Carregando...</div>;
    }

    if (!lead) {
        return (
            <div className="animate-fade-in text-center py-16">
                <p className="text-lg font-semibold" style={{ color: "var(--text-secondary)" }}>
                    Lead não encontrado
                </p>
                <Link href="/leads" className="btn-primary mt-4 inline-flex">
                    Voltar ao Pipeline
                </Link>
            </div>
        );
    }

    const score = scoreLabel(lead.lead_score);

    const toggleSection = (section: string) => {
        setMobileSection((prev) => {
            const next = new Set(prev);
            if (next.has(section)) next.delete(section);
            else next.add(section);
            return next;
        });
    };

    return (
        <div className="animate-fade-in">
            {/* Header */}
            <div className="flex items-center gap-3 mb-6">
                <button
                    onClick={() => router.push("/leads")}
                    className="p-2 rounded-lg"
                    style={{ color: "var(--text-secondary)" }}
                >
                    <ArrowLeft size={20} />
                </button>
                <div className="flex-1">
                    <h1 className="text-xl md:text-2xl font-bold">{lead.name}</h1>
                    <div className="flex items-center gap-3 mt-1">
                        {currentStage && (
                            <span
                                className="text-xs font-medium px-2.5 py-0.5 rounded-full"
                                style={{ background: `${currentStage.color}20`, color: currentStage.color }}
                            >
                                {currentStage.name}
                            </span>
                        )}
                        <span
                            className="text-xs font-bold px-2.5 py-0.5 rounded-full"
                            style={{ background: score.bg, color: score.color }}
                        >
                            {score.text}
                        </span>
                    </div>
                </div>
                <div className="flex gap-2">
                    {isJourneyEnabled && (
                        <button
                            onClick={() => setShowEnrollModal(true)}
                            className="btn-primary flex items-center gap-2 !h-10 !px-4 text-xs"
                        >
                            <Zap size={16} />
                            <span className="hidden sm:inline">Atribuir Jornada</span>
                        </button>
                    )}
                    <button
                        onClick={() => setShowDeleteModal(true)}
                        className="p-2.5 rounded-xl hover:bg-red-50 hover:text-red-500 transition-all text-zinc-400 border border-transparent hover:border-red-100"
                        title="Excluir Lead"
                    >
                        <Trash2 size={18} />
                    </button>
                </div>
            </div>

            {/* Layout: sidebar + timeline */}
            <div className="flex flex-col md:flex-row gap-6">
                {/* Left: Lead Info */}
                <div className="w-full md:w-[360px] flex-shrink-0 space-y-4">
                    {/* Contact Card */}
                    <div className="card p-5">
                        <button
                            className="flex items-center justify-between w-full md:hidden mb-3"
                            onClick={() => toggleSection("info")}
                        >
                            <h3 className="font-semibold text-sm" style={{ color: "var(--text-secondary)" }}>
                                INFORMAÇÕES
                            </h3>
                            {mobileSection.has("info") ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                        </button>
                        <h3 className="font-semibold text-sm mb-3 hidden md:block" style={{ color: "var(--text-secondary)" }}>
                            INFORMAÇÕES
                        </h3>

                        <div className={`space-y-3 ${mobileSection.has("info") ? "" : "hidden md:block"}`}>
                            <div className="flex items-center gap-2">
                                <Mail size={14} style={{ color: "var(--text-muted)" }} />
                                <InlineEdit value={lead.email || ""} onSave={(val) => handleUpdateLead({ email: val })} label="Email" />
                            </div>
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <Phone size={14} style={{ color: "var(--text-muted)" }} />
                                    <InlineEdit value={lead.phone || ""} onSave={(val) => handleUpdateLead({ phone: val })} label="Telefone" />
                                </div>
                                {lead.phone && (
                                    <div className="flex gap-1.5">
                                        <button
                                            onClick={() => setShowWhatsAppModal(true)}
                                            className="p-1.5 rounded-lg bg-green-100 dark:bg-green-900/30 text-green-600 hover:scale-110 transition-transform"
                                            title="WhatsApp Manual"
                                        >
                                            <MessageCircle size={14} />
                                        </button>
                                        {isJourneyEnabled && (
                                            <button
                                                onClick={() => setShowEnrollModal(true)}
                                                className="p-1.5 rounded-lg bg-brand-primary/10 text-brand-primary hover:scale-110 transition-transform"
                                                title="Acionar Automação/Campanha"
                                            >
                                                <Zap size={14} />
                                            </button>
                                        )}
                                    </div>
                                )}
                            </div>
                            <div className="flex items-center gap-2">
                                <Building2 size={14} style={{ color: "var(--text-muted)" }} />
                                <InlineEdit value={lead.company || ""} onSave={(val) => handleUpdateLead({ company: val })} label="Empresa" />
                            </div>
                            <div className="flex items-center gap-2">
                                <Briefcase size={14} style={{ color: "var(--text-muted)" }} />
                                <InlineEdit value={lead.position_title || ""} onSave={(val) => handleUpdateLead({ position_title: val })} label="Cargo" />
                            </div>

                            {/* Instagram & Revenue - PROMOTED FIELDS */}
                            <div className="flex items-center gap-4 py-3 px-3 mt-4 rounded-xl bg-gradient-to-r from-brand-primary/5 to-transparent border border-brand-primary/10">
                                <div className="flex items-center gap-3 flex-1 min-w-0">
                                    <div className="p-2 rounded-lg bg-pink-500/10 text-pink-500">
                                        <Instagram size={16} />
                                    </div>
                                    <div className="flex flex-col min-w-0">
                                        <span className="text-[10px] font-black uppercase text-zinc-400">Instagram</span>
                                        <InlineEdit
                                            value={(lead.custom_fields as any)?.instagram || ""}
                                            onSave={(val) => handleUpdateCustomField('instagram', val)}
                                            label="Instagram"
                                        />
                                    </div>
                                </div>
                                <div className="w-px h-8 bg-zinc-100/50" />
                                <div className="flex items-center gap-3 flex-1 min-w-0">
                                    <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-500">
                                        <TrendingUp size={16} />
                                    </div>
                                    <div className="flex flex-col min-w-0">
                                        <span className="text-[10px] font-black uppercase text-zinc-400">Faturamento</span>
                                        <InlineEdit
                                            value={(lead.custom_fields as any)?.faturamento || ""}
                                            onSave={(val) => handleUpdateCustomField('faturamento', val)}
                                            label="Faturamento"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-center gap-2 pt-2">
                                <Clock size={14} style={{ color: "var(--text-muted)" }} />
                                <span className="text-[10px] font-bold text-zinc-400 uppercase w-20">Criado</span>
                                <span className="text-sm" style={{ color: "var(--text-secondary)" }}>
                                    {formatDate(lead.created_at)}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Source & Custom Fields */}
                    {(lead.source || Object.keys(lead.custom_fields || {}).length > 0) && (
                        <div className="card p-5">
                            <h3 className="font-semibold text-sm mb-4" style={{ color: "var(--text-secondary)" }}>
                                DADOS ADICIONAIS
                            </h3>
                            <div className="space-y-4">
                                {lead.source && (
                                    <div className="flex items-start gap-3">
                                        <div className="p-2 rounded-lg bg-zinc-50 dark:bg-zinc-900/50 mt-0.5">
                                            <Globe size={14} className="text-zinc-400" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Origem</p>
                                            <p className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>
                                                {lead.source} {lead.source_detail && `— ${lead.source_detail}`}
                                            </p>
                                        </div>
                                    </div>
                                )}

                                {Object.entries(lead.custom_fields || {}).map(([key, value]) => {
                                    if (!value) return null;

                                    let Icon = StickyNote;
                                    const lowerKey = key.toLowerCase();
                                    if (lowerKey.includes('instagram')) Icon = Instagram;
                                    if (lowerKey.includes('faturamento')) Icon = BarChart3;
                                    if (lowerKey.includes('cidade') || lowerKey.includes('país') || lowerKey.includes('região')) Icon = MapPin;
                                    if (lowerKey.includes('site') || lowerKey.includes('url')) Icon = Globe;

                                    return (
                                        <div key={key} className="flex items-start gap-3">
                                            <div className="p-2 rounded-lg bg-zinc-50 dark:bg-zinc-900/50 mt-0.5">
                                                <Icon size={14} className="text-zinc-400" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">{key}</p>
                                                <p className="text-sm font-medium break-words" style={{ color: "var(--text-primary)" }}>
                                                    {String(value)}
                                                </p>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {/* Tags */}
                    <div className="card p-5">
                        <h3 className="font-semibold text-sm mb-3" style={{ color: "var(--text-secondary)" }}>
                            TAGS
                        </h3>
                        <div className="flex flex-wrap gap-2">
                            {lead.tags.map((tag) => (
                                <span
                                    key={tag.id}
                                    className="text-xs font-medium px-3 py-1 rounded-full flex items-center gap-1"
                                    style={{ background: `${tag.color}20`, color: tag.color }}
                                >
                                    {tag.name}
                                    <button className="ml-1 hover:opacity-70">
                                        <X size={10} />
                                    </button>
                                </span>
                            ))}
                            <button
                                className="text-xs px-3 py-1 rounded-full border border-dashed flex items-center gap-1"
                                style={{ borderColor: "var(--border)", color: "var(--text-muted)" }}
                            >
                                <Plus size={10} />
                                Adicionar
                            </button>
                        </div>
                    </div>

                    {/* Journey Status */}
                    {isJourneyEnabled && (
                        <div className="card p-5 border-l-4 border-l-brand-primary">
                            <div className="flex items-center justify-between mb-3">
                                <h3 className="font-bold text-xs uppercase tracking-wider" style={{ color: "var(--brand-primary)" }}>
                                    AUTOMAÇÃO ATIVA
                                </h3>
                                <GitBranch size={14} style={{ color: "var(--brand-primary)" }} />
                            </div>

                            {enrollmentsList.length > 0 ? (
                                enrollmentsList.map(enr => (
                                    <div key={enr.id} className="space-y-3 mb-6 last:mb-0 pb-4 border-b border-zinc-100 last:border-0 dark:border-white/5">
                                        <div className="flex items-center justify-between">
                                            <p className="text-xs font-bold truncate pr-2" style={{ color: "var(--text-primary)" }}>{enr.journeys?.name}</p>
                                            <div className="flex items-center gap-2">
                                                <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full flex-shrink-0 ${enr.status === 'active' ? 'bg-emerald-100 text-emerald-600' :
                                                    enr.status === 'paused' ? 'bg-amber-100 text-amber-600' :
                                                        enr.status === 'completed' ? 'bg-blue-100 text-blue-600' :
                                                            'bg-zinc-100 text-zinc-500'
                                                    }`}>
                                                    {enr.status === 'active' ? 'Ativo' :
                                                        enr.status === 'paused' ? 'Pausado' :
                                                            enr.status === 'completed' ? 'Finalizado' : 'Interrompido'}
                                                </span>
                                                {['active', 'paused'].includes(enr.status) && (
                                                    <button
                                                        onClick={() => terminateJourney(enr.id)}
                                                        className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-50 transition-colors"
                                                        title="Terminar Automação"
                                                    >
                                                        <X size={14} />
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                        <div className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-900/40 border border-zinc-100 dark:border-white/5">
                                            <p className="text-[9px] font-bold text-zinc-400 uppercase mb-1">Passo Atual</p>
                                            <p className="text-xs font-bold" style={{ color: "var(--text-primary)" }}>
                                                {enr.journey_steps?.name || 'Iniciando...'}
                                            </p>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="flex flex-col items-center justify-center py-8 px-4 border-2 border-dashed rounded-2xl border-zinc-100 dark:border-white/5 bg-zinc-50/30 dark:bg-white/5">
                                    <GitBranch size={24} className="text-zinc-200 mb-2" />
                                    <p className="text-xs text-zinc-400 font-medium text-center">Nenhuma automação em curso para este lead.</p>
                                </div>
                            )}

                            {availableJourneys.length > 0 && (
                                <div className="mt-4 pt-4 border-t border-zinc-100/50">
                                    <button
                                        onClick={() => setShowEnrollModal(true)}
                                        disabled={isEnrolling}
                                        className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-brand-primary text-white text-xs font-black uppercase tracking-widest hover:scale-[1.02] active:scale-[0.98] transition-all shadow-lg shadow-brand-primary/20 disabled:opacity-50"
                                    >
                                        <Plus size={14} />
                                        Atribuir Jornada
                                    </button>
                                    <p className="text-[10px] text-zinc-400 text-center mt-3 font-medium uppercase tracking-tight">O lead iniciará imediatamente o primeiro passo.</p>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Score Breakdown */}
                    <div className="card p-5">
                        <h3 className="font-semibold text-sm mb-3" style={{ color: "var(--text-secondary)" }}>
                            LEAD SCORE
                        </h3>
                        <div className="flex items-center gap-3 mb-4">
                            <div
                                className="w-14 h-14 rounded-xl flex items-center justify-center text-xl font-bold"
                                style={{ background: score.bg, color: score.color }}
                            >
                                {lead.lead_score}
                            </div>
                            <div>
                                <p className="font-semibold text-sm" style={{ color: "var(--text-primary)" }}>
                                    {score.text}
                                </p>
                                <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                                    Baseado em 4 fatores
                                </p>
                            </div>
                        </div>
                        <div className="space-y-4">
                            <p className="text-sm" style={{ color: "var(--text-secondary)", lineHeight: 1.6 }}>
                                O lead score atual do {lead.name} é de <b>{lead.lead_score}</b>.
                            </p>
                            <div className="p-3 rounded-lg flex items-center gap-3" style={{ background: "var(--surface-hover)", color: "var(--text-muted)" }}>
                                <Star size={16} />
                                <span className="text-xs">
                                    O cálculo do score dinâmico por ações específicas estará disponível em breve.
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Stage Change */}
                    <div className="card p-5">
                        <h3 className="font-semibold text-sm mb-3" style={{ color: "var(--text-secondary)" }}>
                            ESTÁGIO
                        </h3>
                        {!showStageSelect ? (
                            <button
                                onClick={() => setShowStageSelect(true)}
                                className="w-full flex items-center justify-between px-3 py-2 rounded-lg border"
                                style={{ borderColor: "var(--border)", color: "var(--text-primary)" }}
                            >
                                <div className="flex items-center gap-2">
                                    <div
                                        className="w-3 h-3 rounded-full"
                                        style={{ background: currentStage?.color }}
                                    />
                                    <span className="text-sm font-medium">{currentStage?.name}</span>
                                </div>
                                <ChevronDown size={14} />
                            </button>
                        ) : (
                            <div className="space-y-1">
                                {stages.sort((a, b) => a.position - b.position).map((stage) => (
                                    <button
                                        key={stage.id}
                                        onClick={() => setShowStageSelect(false)}
                                        className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors"
                                        style={{
                                            background: stage.id === currentStage?.id ? `${stage.color}15` : "transparent",
                                            color: "var(--text-primary)",
                                        }}
                                        onMouseEnter={(e) => (e.currentTarget.style.background = `${stage.color}15`)}
                                        onMouseLeave={(e) => {
                                            if (stage.id !== currentStage?.id)
                                                e.currentTarget.style.background = "transparent";
                                        }}
                                    >
                                        <div className="w-3 h-3 rounded-full" style={{ background: stage.color }} />
                                        {stage.name}
                                        {stage.id === currentStage?.id && (
                                            <Check size={14} className="ml-auto" style={{ color: stage.color }} />
                                        )}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Right: Timeline */}
                <div className="flex-1 min-w-0">
                    <div className="card p-5">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="font-semibold text-sm" style={{ color: "var(--text-secondary)" }}>
                                TIMELINE DE ATIVIDADE
                            </h3>
                            <button
                                onClick={() => setShowAddNote(!showAddNote)}
                                className="btn-primary text-xs py-1.5 px-3"
                            >
                                <StickyNote size={12} />
                                Adicionar Nota
                            </button>
                        </div>

                        {/* Add Note Form */}
                        {showAddNote && (
                            <div className="mb-6 p-4 rounded-lg animate-fade-in" style={{ background: "var(--surface-hover)" }}>
                                <textarea
                                    autoFocus
                                    value={noteText}
                                    onChange={(e) => setNoteText(e.target.value)}
                                    placeholder="Escreva uma nota sobre este lead..."
                                    className="w-full p-3 rounded-lg border text-sm resize-none h-24"
                                    style={{
                                        background: "var(--surface)",
                                        borderColor: "var(--border)",
                                        color: "var(--text-primary)",
                                    }}
                                />
                                <div className="flex justify-end gap-2 mt-2">
                                    <button
                                        onClick={() => { setShowAddNote(false); setNoteText(""); }}
                                        className="btn-secondary text-xs py-1.5 px-3"
                                    >
                                        Cancelar
                                    </button>
                                    <button
                                        onClick={() => { setShowAddNote(false); setNoteText(""); }}
                                        disabled={!noteText.trim()}
                                        className="btn-primary text-xs py-1.5 px-3"
                                    >
                                        <Send size={12} />
                                        Salvar Nota
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* Timeline */}
                        <div>
                            {interactions.map((interaction) => (
                                <TimelineItem key={interaction.id} interaction={interaction} />
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* Mobile Quick Actions (sticky bottom) */}
            <div
                className="fixed bottom-0 left-0 right-0 md:hidden border-t p-3 flex justify-around z-30"
                style={{ background: "var(--surface)", borderColor: "var(--border)" }}
            >
                <button
                    className="flex flex-col items-center gap-1 text-[10px]"
                    style={{ color: "var(--text-secondary)" }}
                >
                    <Mail size={18} style={{ color: "var(--color-info)" }} />
                    Email
                </button>
                <button
                    onClick={() => setShowWhatsAppModal(true)}
                    className="flex flex-col items-center gap-1 text-[10px]"
                    style={{ color: "var(--text-secondary)" }}
                >
                    <MessageCircle size={18} style={{ color: "#22c55e" }} />
                    WhatsApp
                </button>
                <button
                    onClick={() => setShowAddNote(true)}
                    className="flex flex-col items-center gap-1 text-[10px]"
                    style={{ color: "var(--text-secondary)" }}
                >
                    <StickyNote size={18} style={{ color: "#f59e0b" }} />
                    Nota
                </button>
                {isJourneyEnabled && (
                    <button
                        onClick={() => setShowEnrollModal(true)}
                        className="flex flex-col items-center gap-1 text-[10px]"
                        style={{ color: "var(--text-secondary)" }}
                    >
                        <Zap size={18} style={{ color: "var(--brand-primary)" }} />
                        Jornada
                    </button>
                )}
                <button
                    className="flex flex-col items-center gap-1 text-[10px]"
                    style={{ color: "var(--text-secondary)" }}
                >
                    <TagIcon size={18} style={{ color: "#8b5cf6" }} />
                    Tag
                </button>
            </div>

            {/* Modals */}
            {lead && (
                <>
                    <SendWhatsAppModal
                        open={showWhatsAppModal}
                        onClose={() => setShowWhatsAppModal(false)}
                        lead={{ id: lead.id, name: lead.name, phone: lead.phone }}
                    />
                    <EnrollJourneyModal
                        open={showEnrollModal}
                        onClose={() => setShowEnrollModal(false)}
                        onEnroll={enrollInJourney}
                        leadName={lead.name}
                        enrolledJourneyIds={enrollmentsList
                            .filter(e => ['active', 'paused'].includes(e.status))
                            .map(e => e.journeys?.id)}
                    />
                    <ConfirmModal
                        open={showDeleteModal}
                        onClose={() => setShowDeleteModal(false)}
                        onConfirm={handleDeleteLead}
                        title="Excluir Lead"
                        description={`Tem certeza que deseja excluir ${lead.name}? Esta ação não pode ser desfeita.`}
                        confirmText={isDeleting ? "Excluindo..." : "Excluir Permanentemente"}
                    />
                </>
            )}
        </div >
    );
}
