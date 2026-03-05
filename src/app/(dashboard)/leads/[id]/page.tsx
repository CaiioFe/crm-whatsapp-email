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
    Send,
    Plus,
    ChevronDown,
    ChevronRight,
    Building2,
    Briefcase,
    Clock,
    Star,
    GitBranch,
} from "lucide-react";
import Link from "next/link";
import { SendWhatsAppModal } from "@/components/ui/SendWhatsAppModal";
import type { InteractionType, Interaction } from "@/types/database";

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
    const params = useParams();
    const router = useRouter();
    const leadId = params.id as string;

    const [lead, setLead] = useState<(Lead & { tags: Tag[] }) | null>(null);
    const [stages, setStages] = useState<any[]>([]);
    const [interactions, setInteractions] = useState<Interaction[]>([]);
    const [enrollmentsList, setEnrollmentsList] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [showWhatsAppModal, setShowWhatsAppModal] = useState(false);

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
            const { data: enrs } = await supabase
                .from('journey_enrollments')
                .select('*, journeys(name), journey_steps(name)')
                .eq('lead_id', leadId)
                .in('status', ['active', 'paused']);
            if (enrs) setEnrollmentsList(enrs);

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
                            Score: {lead.lead_score} — {score.text}
                        </span>
                    </div>
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
                                <InlineEdit value={lead.email || ""} onSave={() => { }} label="Email" />
                            </div>
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <Phone size={14} style={{ color: "var(--text-muted)" }} />
                                    <InlineEdit value={lead.phone || ""} onSave={() => { }} label="Telefone" />
                                </div>
                                {lead.phone && (
                                    <button
                                        onClick={() => setShowWhatsAppModal(true)}
                                        className="p-1.5 rounded-lg bg-green-100 dark:bg-green-900/30 text-green-600 hover:scale-110 transition-transform"
                                        title="Enviar WhatsApp"
                                    >
                                        <MessageCircle size={14} />
                                    </button>
                                )}
                            </div>
                            <div className="flex items-center gap-2">
                                <Building2 size={14} style={{ color: "var(--text-muted)" }} />
                                <InlineEdit value={lead.company || ""} onSave={() => { }} label="Empresa" />
                            </div>
                            <div className="flex items-center gap-2">
                                <Briefcase size={14} style={{ color: "var(--text-muted)" }} />
                                <InlineEdit value={lead.position_title || ""} onSave={() => { }} label="Cargo" />
                            </div>
                            <div className="flex items-center gap-2">
                                <Clock size={14} style={{ color: "var(--text-muted)" }} />
                                <span className="text-sm" style={{ color: "var(--text-secondary)" }}>
                                    Criado em {formatDate(lead.created_at)}
                                </span>
                            </div>
                        </div>
                    </div>

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
                    <div className="card p-5 border-l-4 border-l-brand-primary">
                        <div className="flex items-center justify-between mb-3">
                            <h3 className="font-bold text-xs uppercase tracking-wider" style={{ color: "var(--brand-primary)" }}>
                                AUTOMAÇÃO ATIVA
                            </h3>
                            <GitBranch size={14} style={{ color: "var(--brand-primary)" }} />
                        </div>

                        {enrollmentsList.length > 0 ? (
                            enrollmentsList.map(enr => (
                                <div key={enr.id} className="space-y-3">
                                    <div>
                                        <p className="text-sm font-bold" style={{ color: "var(--text-primary)" }}>{enr.journeys?.name}</p>
                                        <div className="flex items-center gap-2 mt-1">
                                            <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-brand-primary/10 text-brand-primary">
                                                {enr.status === 'active' ? 'Em Progresso' : 'Pausado'}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="p-3 rounded-lg bg-zinc-50 border border-zinc-100 dark:bg-zinc-900/50 dark:border-zinc-800">
                                        <div className="flex items-start gap-2">
                                            <div className="mt-1 w-2 h-2 rounded-full bg-brand-primary animate-pulse" />
                                            <div>
                                                <p className="text-[10px] font-bold text-zinc-400 uppercase">Passo Atual</p>
                                                <p className="text-sm font-bold" style={{ color: "var(--text-primary)" }}>
                                                    {enr.journey_steps?.name || 'Iniciando...'}
                                                </p>
                                            </div>
                                        </div>

                                        {(enr.metadata as any)?.waiting_until && (
                                            <div className="mt-2 pt-2 border-t border-zinc-100 dark:border-zinc-800 flex items-center gap-1.5 text-zinc-500">
                                                <Clock size={12} />
                                                <span className="text-[10px] font-medium">
                                                    Próxima ação: {new Date((enr.metadata as any).waiting_until).toLocaleString('pt-BR')}
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="text-center py-4 px-2 border border-dashed rounded-xl border-zinc-200">
                                <p className="text-xs text-zinc-400 italic">Nenhuma jornada ativa</p>
                                <Link href="/journeys" className="text-[10px] font-bold text-brand-primary hover:underline mt-2 block">
                                    Inscrever em uma jornada
                                </Link>
                            </div>
                        )}
                    </div>

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
                <button
                    className="flex flex-col items-center gap-1 text-[10px]"
                    style={{ color: "var(--text-secondary)" }}
                >
                    <TagIcon size={18} style={{ color: "#8b5cf6" }} />
                    Tag
                </button>
            </div>

            {/* WhatsApp Modal */}
            {lead && (
                <SendWhatsAppModal
                    open={showWhatsAppModal}
                    onClose={() => setShowWhatsAppModal(false)}
                    lead={{ id: lead.id, name: lead.name, phone: lead.phone }}
                />
            )}
        </div>
    );
}
