"use client";

import { useState, useCallback, useEffect } from "react";
import {
    Type,
    Image,
    MousePointer2,
    Minus,
    Columns,
    MoveVertical,
    Plus,
    Trash2,
    ChevronUp,
    ChevronDown,
    Eye,
    Save,
    ArrowLeft,
    Variable,
    Send,
    Loader2,
} from "lucide-react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { useToast } from "@/components/ui/Toast";
import {
    createDefaultTemplate,
    renderTemplate,
    TEMPLATE_VARIABLES,
    type EmailBlock,
    type EmailTemplate,
} from "@/lib/email/templates";

const BLOCK_TYPES = [
    { type: "text" as const, label: "Texto", icon: Type, defaultContent: { text: "<p>Seu texto aqui...</p>" } },
    { type: "image" as const, label: "Imagem", icon: Image, defaultContent: { src: "https://placehold.co/600x200/e2e8f0/64748b?text=Imagem", alt: "" } },
    { type: "button" as const, label: "Botão", icon: MousePointer2, defaultContent: { text: "Clique aqui", url: "#" } },
    { type: "divider" as const, label: "Divisor", icon: Minus, defaultContent: {} },
    { type: "columns" as const, label: "Colunas", icon: Columns, defaultContent: { left: "Coluna 1", right: "Coluna 2" } },
    { type: "spacer" as const, label: "Espaço", icon: MoveVertical, defaultContent: {} },
];

function EmailEditorContent() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const { success, error: toastError } = useToast();
    const templateId = searchParams.get("id");

    const [template, setTemplate] = useState<EmailTemplate>(
        createDefaultTemplate("loading")
    );
    const [selectedBlockId, setSelectedBlockId] = useState<string | null>(null);
    const [viewMode, setViewMode] = useState<"edit" | "preview">("edit");
    const [showVariables, setShowVariables] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [isLoading, setIsLoading] = useState(!!templateId);

    // Load from DB
    useEffect(() => {
        if (!templateId) return;
        const load = async () => {
            try {
                const res = await fetch(`/api/email-templates/${templateId}`);
                if (!res.ok) throw new Error("Erro ao carregar");
                const data = await res.json();
                setTemplate(data);
            } catch (err) {
                toastError("Erro", "Não foi possível carregar o template.");
            } finally {
                setIsLoading(false);
            }
        };
        load();
    }, [templateId, toastError]);

    const selectedBlock = template.blocks.find((b) => b.id === selectedBlockId);

    const updateTemplate = useCallback(
        (updates: Partial<EmailTemplate>) => {
            setTemplate((prev) => ({ ...prev, ...updates, updated_at: new Date().toISOString() }));
        },
        []
    );

    const handleSave = async () => {
        setIsSaving(true);
        try {
            const res = await fetch("/api/email-templates", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(template),
            });
            if (!res.ok) throw new Error("Falha ao salvar");
            const data = await res.json();

            if (!templateId) {
                router.replace(`/campaigns/templates/editor?id=${data.id}`);
            }

            success("Sucesso", "Template salvo com sucesso!");
        } catch (err) {
            toastError("Erro", "Erro ao salvar template.");
        } finally {
            setIsSaving(false);
        }
    };

    const addBlock = useCallback(
        (type: EmailBlock["type"], content: Record<string, string>) => {
            const newBlock: EmailBlock = {
                id: `block-${Date.now()}`,
                type,
                content,
                style: type === "button"
                    ? { backgroundColor: "#6366f1", color: "#ffffff", textAlign: "center", borderRadius: "8px" }
                    : type === "divider"
                        ? { borderColor: "#e2e8f0" }
                        : type === "spacer"
                            ? { height: "24px" }
                            : {},
            };
            updateTemplate({ blocks: [...template.blocks, newBlock] });
            setSelectedBlockId(newBlock.id);
        },
        [template.blocks, updateTemplate]
    );

    const removeBlock = useCallback(
        (blockId: string) => {
            updateTemplate({ blocks: template.blocks.filter((b) => b.id !== blockId) });
            if (selectedBlockId === blockId) setSelectedBlockId(null);
        },
        [template.blocks, selectedBlockId, updateTemplate]
    );

    const moveBlock = useCallback(
        (blockId: string, direction: "up" | "down") => {
            const blocks = [...template.blocks];
            const idx = blocks.findIndex((b) => b.id === blockId);
            if (direction === "up" && idx > 0) {
                [blocks[idx - 1], blocks[idx]] = [blocks[idx], blocks[idx - 1]];
            } else if (direction === "down" && idx < blocks.length - 1) {
                [blocks[idx + 1], blocks[idx]] = [blocks[idx], blocks[idx + 1]];
            }
            updateTemplate({ blocks });
        },
        [template.blocks, updateTemplate]
    );

    const updateBlockContent = useCallback(
        (blockId: string, content: Record<string, string>) => {
            updateTemplate({
                blocks: template.blocks.map((b) =>
                    b.id === blockId ? { ...b, content: { ...b.content, ...content } } : b
                ),
            });
        },
        [template.blocks, updateTemplate]
    );

    const updateBlockStyle = useCallback(
        (blockId: string, style: Record<string, string>) => {
            updateTemplate({
                blocks: template.blocks.map((b) =>
                    b.id === blockId ? { ...b, style: { ...b.style, ...style } } : b
                ),
            });
        },
        [template.blocks, updateTemplate]
    );

    // Preview HTML
    const previewHtml = renderTemplate(template, {
        nome: "João Silva",
        empresa: "TechNova",
        email: "joao@technova.com",
        telefone: "+55 11 99999-9999",
        cargo: "Gerente Comercial",
        estagio: "Qualificado",
    });

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
                <Loader2 className="animate-spin text-brand-primary" size={32} />
                <p className="text-sm font-medium text-zinc-500">Abrindo template...</p>
            </div>
        );
    }

    return (
        <div className="animate-fade-in">
            {/* Header */}
            <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
                <div className="flex items-center gap-3">
                    <button onClick={() => router.back()} className="p-2 rounded-lg" style={{ color: "var(--text-secondary)" }}>
                        <ArrowLeft size={20} />
                    </button>
                    <input
                        value={template.name}
                        onChange={(e) => updateTemplate({ name: e.target.value })}
                        className="text-xl font-bold bg-transparent border-none outline-none focus:ring-2 focus:ring-brand-primary/20 rounded-lg px-2"
                        style={{ color: "var(--text-primary)" }}
                    />
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={() => setViewMode(viewMode === "edit" ? "preview" : "edit")}
                        className="btn-secondary text-sm"
                    >
                        <Eye size={16} />
                        {viewMode === "edit" ? "Preview" : "Editar"}
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={isSaving}
                        className="btn-primary text-sm shadow-xl shadow-brand-primary/20 min-w-[100px]"
                    >
                        {isSaving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                        Salvar
                    </button>
                </div>
            </div>

            {/* Subject line */}
            <div className="card p-4 mb-4">
                <label className="text-xs font-semibold mb-1 block" style={{ color: "var(--text-secondary)" }}>
                    Assunto do Email
                </label>
                <div className="relative">
                    <input
                        value={template.subject}
                        onChange={(e) => updateTemplate({ subject: e.target.value })}
                        placeholder="Ex: Olá {{nome}}, temos uma novidade!"
                        className="w-full text-sm px-3 py-2.5 rounded-xl border focus:ring-4 focus:ring-brand-primary/5 outline-none transition-all"
                        style={{ background: "var(--surface)", borderColor: "var(--border)", color: "var(--text-primary)" }}
                    />
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1">
                        <Variable size={12} className="text-zinc-400" />
                        <span className="text-[10px] font-bold text-zinc-300 uppercase tracking-tighter">Variáveis OK</span>
                    </div>
                </div>
            </div>

            {viewMode === "preview" ? (
                /* Preview Mode */
                <div className="card p-0 overflow-hidden border-2 rounded-2xl shadow-2xl">
                    <div className="px-6 py-4 border-b flex items-center justify-between bg-zinc-50 dark:bg-zinc-900" style={{ borderColor: "var(--border)" }}>
                        <div className="flex items-center gap-2">
                            <Eye size={14} className="text-zinc-400" />
                            <span className="text-xs font-bold uppercase tracking-widest text-zinc-500">
                                Visualização Estática (Dados Mockados)
                            </span>
                        </div>
                        <button
                            onClick={() => setShowVariables(!showVariables)}
                            className="bg-white dark:bg-zinc-800 px-3 py-1.5 rounded-lg border text-[10px] font-black uppercase tracking-widest flex items-center gap-2 hover:shadow-md transition-all"
                            style={{ borderColor: "var(--border)", color: "var(--brand-primary)" }}
                        >
                            <Variable size={12} />
                            Ver Variáveis Ativas
                        </button>
                    </div>
                    {showVariables && (
                        <div className="px-4 py-2 border-b flex flex-wrap gap-2" style={{ background: "var(--surface-hover)", borderColor: "var(--border)" }}>
                            {TEMPLATE_VARIABLES.map((v) => (
                                <span key={v.key} className="badge" style={{ background: "var(--brand-primary-light)", color: "var(--brand-primary)" }}>
                                    {"{{" + v.key + "}}"} = {v.example}
                                </span>
                            ))}
                        </div>
                    )}
                    <iframe
                        srcDoc={previewHtml}
                        className="w-full border-none"
                        style={{ height: "600px", background: "#f8fafc" }}
                        title="Email Preview"
                    />
                </div>
            ) : (
                /* Edit Mode */
                <div className="flex flex-col md:flex-row gap-4">
                    {/* Block Palette */}
                    <div className="w-full md:w-48 flex-shrink-0">
                        <div className="card p-3">
                            <h3 className="text-xs font-semibold mb-3" style={{ color: "var(--text-secondary)" }}>
                                BLOCOS
                            </h3>
                            <div className="grid grid-cols-3 md:grid-cols-2 gap-2">
                                {BLOCK_TYPES.map((bt) => {
                                    const Icon = bt.icon;
                                    return (
                                        <button
                                            key={bt.type}
                                            onClick={() => addBlock(bt.type, bt.defaultContent as Record<string, string>)}
                                            className="flex flex-col items-center gap-1.5 p-3 rounded-lg border text-xs transition-all"
                                            style={{ borderColor: "var(--border)", color: "var(--text-secondary)" }}
                                            onMouseEnter={(e) => {
                                                e.currentTarget.style.borderColor = "var(--brand-primary)";
                                                e.currentTarget.style.background = "var(--brand-primary-light)";
                                            }}
                                            onMouseLeave={(e) => {
                                                e.currentTarget.style.borderColor = "var(--border)";
                                                e.currentTarget.style.background = "transparent";
                                            }}
                                        >
                                            <Icon size={18} />
                                            {bt.label}
                                        </button>
                                    );
                                })}
                            </div>

                            {/* Variables */}
                            <h3 className="text-xs font-semibold mt-4 mb-2" style={{ color: "var(--text-secondary)" }}>
                                VARIÁVEIS
                            </h3>
                            <div className="space-y-1">
                                {TEMPLATE_VARIABLES.map((v) => (
                                    <button
                                        key={v.key}
                                        onClick={() => navigator.clipboard.writeText(`{{${v.key}}}`)}
                                        className="w-full text-left text-xs px-2 py-1.5 rounded transition-colors"
                                        style={{ color: "var(--text-secondary)" }}
                                        onMouseEnter={(e) => (e.currentTarget.style.background = "var(--surface-hover)")}
                                        onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                                        title="Clique para copiar"
                                    >
                                        <code style={{ color: "var(--brand-primary)" }}>{"{{" + v.key + "}}"}</code>
                                        <span className="ml-1">{v.label}</span>
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Canvas */}
                    <div className="flex-1 min-w-0">
                        <div
                            className="rounded-xl p-4 md:p-8 min-h-[500px]"
                            style={{ background: template.styles.backgroundColor }}
                        >
                            <div
                                className="mx-auto rounded-xl overflow-hidden"
                                style={{
                                    maxWidth: template.styles.contentWidth,
                                    background: "#ffffff",
                                    boxShadow: "var(--shadow-md)",
                                }}
                            >
                                {template.blocks.map((block, idx) => (
                                    <div
                                        key={block.id}
                                        className={`relative group cursor-pointer transition-all ${selectedBlockId === block.id ? "ring-2 ring-offset-1" : ""
                                            }`}
                                        style={{
                                            "--tw-ring-color": "var(--brand-primary)",
                                        } as React.CSSProperties}
                                        onClick={() => setSelectedBlockId(block.id)}
                                    >
                                        {/* Block toolbar */}
                                        <div
                                            className="absolute -right-2 top-1/2 -translate-y-1/2 flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-10"
                                        >
                                            <button
                                                onClick={(e) => { e.stopPropagation(); moveBlock(block.id, "up"); }}
                                                className="w-6 h-6 rounded flex items-center justify-center"
                                                style={{ background: "var(--surface)", color: "var(--text-muted)", boxShadow: "var(--shadow-sm)" }}
                                                disabled={idx === 0}
                                            >
                                                <ChevronUp size={12} />
                                            </button>
                                            <button
                                                onClick={(e) => { e.stopPropagation(); moveBlock(block.id, "down"); }}
                                                className="w-6 h-6 rounded flex items-center justify-center"
                                                style={{ background: "var(--surface)", color: "var(--text-muted)", boxShadow: "var(--shadow-sm)" }}
                                                disabled={idx === template.blocks.length - 1}
                                            >
                                                <ChevronDown size={12} />
                                            </button>
                                            <button
                                                onClick={(e) => { e.stopPropagation(); removeBlock(block.id); }}
                                                className="w-6 h-6 rounded flex items-center justify-center"
                                                style={{ background: "#fee2e2", color: "#ef4444", boxShadow: "var(--shadow-sm)" }}
                                            >
                                                <Trash2 size={12} />
                                            </button>
                                        </div>

                                        {/* Block render */}
                                        <div dangerouslySetInnerHTML={{ __html: renderBlockPreview(block) }} />
                                    </div>
                                ))}

                                {/* Add block button */}
                                <button
                                    onClick={() => addBlock("text", { text: "<p>Novo texto...</p>" })}
                                    className="w-full py-4 flex items-center justify-center gap-2 text-sm border-t border-dashed transition-colors"
                                    style={{ borderColor: "var(--border)", color: "var(--text-muted)" }}
                                    onMouseEnter={(e) => { e.currentTarget.style.background = "var(--brand-primary-light)"; e.currentTarget.style.color = "var(--brand-primary)"; }}
                                    onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "var(--text-muted)"; }}
                                >
                                    <Plus size={16} />
                                    Adicionar Bloco
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Properties Panel */}
                    {selectedBlock && (
                        <div className="w-full md:w-64 flex-shrink-0">
                            <div className="card p-4 animate-slide-in">
                                <h3 className="text-xs font-semibold mb-3" style={{ color: "var(--text-secondary)" }}>
                                    PROPRIEDADES — {BLOCK_TYPES.find((b) => b.type === selectedBlock.type)?.label}
                                </h3>

                                {/* Content editors by type */}
                                {selectedBlock.type === "text" && (
                                    <div className="space-y-3">
                                        <div>
                                            <label className="text-xs mb-1 block" style={{ color: "var(--text-muted)" }}>Conteúdo HTML</label>
                                            <textarea
                                                value={selectedBlock.content.text || ""}
                                                onChange={(e) => updateBlockContent(selectedBlock.id, { text: e.target.value })}
                                                className="w-full p-2 rounded border text-xs font-mono h-32 resize-y"
                                                style={{ background: "var(--surface)", borderColor: "var(--border)", color: "var(--text-primary)" }}
                                            />
                                        </div>
                                        <div>
                                            <label className="text-xs mb-1 block" style={{ color: "var(--text-muted)" }}>Cor do texto</label>
                                            <input
                                                type="color"
                                                value={selectedBlock.style?.color || "#333333"}
                                                onChange={(e) => updateBlockStyle(selectedBlock.id, { color: e.target.value })}
                                                className="w-full h-8 rounded cursor-pointer"
                                            />
                                        </div>
                                    </div>
                                )}

                                {selectedBlock.type === "image" && (
                                    <div className="space-y-3">
                                        <div>
                                            <label className="text-xs mb-1 block" style={{ color: "var(--text-muted)" }}>URL da Imagem</label>
                                            <input
                                                value={selectedBlock.content.src || ""}
                                                onChange={(e) => updateBlockContent(selectedBlock.id, { src: e.target.value })}
                                                className="w-full p-2 rounded border text-xs"
                                                style={{ background: "var(--surface)", borderColor: "var(--border)", color: "var(--text-primary)" }}
                                            />
                                        </div>
                                        <div>
                                            <label className="text-xs mb-1 block" style={{ color: "var(--text-muted)" }}>Alt Text</label>
                                            <input
                                                value={selectedBlock.content.alt || ""}
                                                onChange={(e) => updateBlockContent(selectedBlock.id, { alt: e.target.value })}
                                                className="w-full p-2 rounded border text-xs"
                                                style={{ background: "var(--surface)", borderColor: "var(--border)", color: "var(--text-primary)" }}
                                            />
                                        </div>
                                    </div>
                                )}

                                {selectedBlock.type === "button" && (
                                    <div className="space-y-3">
                                        <div>
                                            <label className="text-xs mb-1 block" style={{ color: "var(--text-muted)" }}>Texto do Botão</label>
                                            <input
                                                value={selectedBlock.content.text || ""}
                                                onChange={(e) => updateBlockContent(selectedBlock.id, { text: e.target.value })}
                                                className="w-full p-2 rounded border text-xs"
                                                style={{ background: "var(--surface)", borderColor: "var(--border)", color: "var(--text-primary)" }}
                                            />
                                        </div>
                                        <div>
                                            <label className="text-xs mb-1 block" style={{ color: "var(--text-muted)" }}>URL</label>
                                            <input
                                                value={selectedBlock.content.url || ""}
                                                onChange={(e) => updateBlockContent(selectedBlock.id, { url: e.target.value })}
                                                className="w-full p-2 rounded border text-xs"
                                                style={{ background: "var(--surface)", borderColor: "var(--border)", color: "var(--text-primary)" }}
                                            />
                                        </div>
                                        <div>
                                            <label className="text-xs mb-1 block" style={{ color: "var(--text-muted)" }}>Cor de Fundo</label>
                                            <input
                                                type="color"
                                                value={selectedBlock.style?.backgroundColor || "#6366f1"}
                                                onChange={(e) => updateBlockStyle(selectedBlock.id, { backgroundColor: e.target.value })}
                                                className="w-full h-8 rounded cursor-pointer"
                                            />
                                        </div>
                                    </div>
                                )}

                                {selectedBlock.type === "spacer" && (
                                    <div>
                                        <label className="text-xs mb-1 block" style={{ color: "var(--text-muted)" }}>Altura</label>
                                        <input
                                            type="range"
                                            min={8}
                                            max={80}
                                            value={parseInt(selectedBlock.style?.height || "24")}
                                            onChange={(e) => updateBlockStyle(selectedBlock.id, { height: `${e.target.value}px` })}
                                            className="w-full accent-indigo-500"
                                        />
                                        <span className="text-xs" style={{ color: "var(--text-muted)" }}>{selectedBlock.style?.height || "24px"}</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

import { Suspense } from "react";

export default function EmailEditorPage() {
    return (
        <Suspense fallback={
            <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
                <Loader2 className="animate-spin text-brand-primary" size={32} />
                <p className="text-sm font-medium text-zinc-500">Preparando editor...</p>
            </div>
        }>
            <EmailEditorContent />
        </Suspense>
    );
}

function renderBlockPreview(block: EmailBlock): string {
    switch (block.type) {
        case "text":
            return `<div style="padding: 16px 24px; font-size: ${block.style?.fontSize || "16px"}; color: ${block.style?.color || "#333333"}; line-height: 1.6;">${block.content.text || ""}</div>`;
        case "image":
            return `<div style="padding: 8px 24px; text-align: ${block.style?.textAlign || "center"};"><img src="${block.content.src || "https://placehold.co/600x200"}" alt="${block.content.alt || ""}" style="max-width: 100%; height: auto; border-radius: ${block.style?.borderRadius || "8px"};" /></div>`;
        case "button":
            return `<div style="padding: 16px 24px; text-align: ${block.style?.textAlign || "center"};"><span style="display: inline-block; padding: 12px 32px; background: ${block.style?.backgroundColor || "#6366f1"}; color: ${block.style?.color || "#ffffff"}; border-radius: ${block.style?.borderRadius || "8px"}; font-weight: 600; font-size: 14px;">${block.content.text || "Clique aqui"}</span></div>`;
        case "divider":
            return `<div style="padding: 8px 24px;"><hr style="border: none; border-top: 1px solid ${block.style?.borderColor || "#e2e8f0"};" /></div>`;
        case "spacer":
            return `<div style="height: ${block.style?.height || "24px"}; background: repeating-linear-gradient(45deg, transparent, transparent 5px, #f1f5f9 5px, #f1f5f9 10px);"></div>`;
        case "columns":
            return `<div style="padding: 8px 24px; display: flex; gap: 16px;"><div style="flex: 1; border: 1px dashed #e2e8f0; padding: 8px; border-radius: 4px;">${block.content.left || "Col 1"}</div><div style="flex: 1; border: 1px dashed #e2e8f0; padding: 8px; border-radius: 4px;">${block.content.right || "Col 2"}</div></div>`;
        default:
            return "";
    }
}
