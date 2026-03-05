"use client";

import { useState, useCallback, useMemo, useEffect, Suspense } from "react";
import {
    ReactFlow,
    Background,
    Controls,
    MiniMap,
    addEdge,
    useNodesState,
    useEdgesState,
    Handle,
    Position,
    type Connection,
    type Node,
    type Edge,
    type NodeProps,
    MarkerType,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import {
    ArrowLeft,
    Save,
    Play,
    Mail,
    MessageCircle,
    Clock,
    GitBranch,
    Tag,
    Users,
    Webhook,
    Bell,
    Zap,
    Trash2,
    Plus,
    Loader2,
} from "lucide-react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { useToast } from "@/components/ui/Toast";

// ============================
// Custom Node Types
// ============================

const NODE_CONFIGS: Record<string, { label: string; icon: typeof Mail; color: string; bg: string }> = {
    trigger: { label: "Trigger", icon: Zap, color: "#f59e0b", bg: "#fef3c7" },
    send_email: { label: "Enviar Email", icon: Mail, color: "#3b82f6", bg: "#dbeafe" },
    send_whatsapp: { label: "Enviar WhatsApp", icon: MessageCircle, color: "#22c55e", bg: "#dcfce7" },
    wait: { label: "Esperar", icon: Clock, color: "#8b5cf6", bg: "#f3e8ff" },
    condition: { label: "Condição", icon: GitBranch, color: "#f97316", bg: "#ffedd5" },
    add_tag: { label: "Adicionar Tag", icon: Tag, color: "#06b6d4", bg: "#cffafe" },
    change_stage: { label: "Mover Estágio", icon: Users, color: "#6366f1", bg: "#e0e7ff" },
    webhook: { label: "Webhook", icon: Webhook, color: "#64748b", bg: "#f1f5f9" },
    notify_team: { label: "Notificar Equipe", icon: Bell, color: "#ec4899", bg: "#fce7f3" },
};

function JourneyNode({ data, selected }: NodeProps) {
    const config = NODE_CONFIGS[data.nodeType as string] || NODE_CONFIGS.trigger;
    const Icon = config.icon;
    const isCondition = data.nodeType === "condition";

    return (
        <div
            className={`rounded-xl shadow-lg border-2 transition-all ${selected ? "ring-2 ring-offset-2" : ""}`}
            style={{
                borderColor: selected ? config.color : `${config.color}40`,
                background: "#ffffff",
                minWidth: 200,
                "--tw-ring-color": config.color,
            } as React.CSSProperties}
        >
            {data.nodeType !== "trigger" && (
                <Handle type="target" position={Position.Top} style={{ background: config.color, width: 10, height: 10 }} />
            )}

            {/* Header */}
            <div className="px-4 py-2.5 flex items-center gap-2 border-b" style={{ background: config.bg, borderColor: `${config.color}30` }}>
                <Icon size={14} style={{ color: config.color }} />
                <span className="text-xs font-bold" style={{ color: config.color }}>{config.label}</span>
            </div>

            {/* Body */}
            <div className="px-4 py-3">
                <p className="text-sm font-medium" style={{ color: "#1e293b" }}>{(data.label as string) || "Sem título"}</p>
                {(data.description as string) && (
                    <p className="text-xs mt-1" style={{ color: "#94a3b8" }}>{data.description as string}</p>
                )}
            </div>

            {/* Metrics */}
            {(data.entered as number) > 0 && (
                <div className="px-4 py-2 border-t flex gap-3 text-[10px]" style={{ borderColor: "#f1f5f9" }}>
                    <span style={{ color: "#64748b" }}>Entrou: <b>{data.entered as number}</b></span>
                    <span style={{ color: "#22c55e" }}>Saiu: <b>{data.completed as number}</b></span>
                </div>
            )}

            {isCondition ? (
                <>
                    <Handle type="source" position={Position.Bottom} id="yes" style={{ background: "#22c55e", width: 10, height: 10, left: "30%" }} />
                    <Handle type="source" position={Position.Bottom} id="no" style={{ background: "#ef4444", width: 10, height: 10, left: "70%" }} />
                </>
            ) : (
                <Handle type="source" position={Position.Bottom} style={{ background: config.color, width: 10, height: 10 }} />
            )}
        </div>
    );
}

// ============================
// Initial Flow Data
// ============================

const INITIAL_NODES: Node[] = [
    {
        id: "trigger-1",
        type: "journeyNode",
        position: { x: 400, y: 100 },
        data: { nodeType: "trigger", label: "Novo Lead Criado", description: "Inicia quando um lead entra no sistema", entered: 0, completed: 0 },
    },
];

const INITIAL_EDGES: Edge[] = [];

// ============================
// Palette
// ============================

const PALETTE_ITEMS = [
    { type: "send_email", label: "Email" },
    { type: "send_whatsapp", label: "WhatsApp" },
    { type: "wait", label: "Esperar" },
    { type: "condition", label: "Condição" },
    { type: "add_tag", label: "Tag" },
    { type: "change_stage", label: "Estágio" },
    { type: "webhook", label: "Webhook" },
    { type: "notify_team", label: "Notificar" },
];

// ============================
// Page Component
// ============================

function JourneyEditorContent() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const { success, error, info } = useToast();

    const [id, setId] = useState<string | null>(searchParams.get("id"));
    const [nodes, setNodes, onNodesChange] = useNodesState(INITIAL_NODES);
    const [edges, setEdges, onEdgesChange] = useEdgesState(INITIAL_EDGES);
    const [selectedNode, setSelectedNode] = useState<Node | null>(null);
    const [journeyName, setJourneyName] = useState("Nova Jornada Automática");
    const [description, setDescription] = useState("");
    const [exitCriteria, setExitCriteria] = useState<any[]>([]);
    const [isSaving, setIsSaving] = useState(false);
    const [isLoading, setIsLoading] = useState(!!id);

    const [emailTemplates, setEmailTemplates] = useState<any[]>([]);
    const [pipelineStages, setPipelineStages] = useState<any[]>([]);

    const nodeTypes = useMemo(() => ({ journeyNode: JourneyNode }), []);

    // Load Journey & Data
    useEffect(() => {
        const loadResources = async () => {
            try {
                // Fetch Templates
                const tRes = await fetch('/api/email-templates');
                if (tRes.ok) setEmailTemplates(await tRes.json());

                // Fetch Stages
                const { createSupabaseBrowserClient } = await import("@/lib/supabase/client");
                const supabase = createSupabaseBrowserClient();
                const { data: stages } = await supabase.from('pipeline_stages').select('*').order('position');
                if (stages) setPipelineStages(stages);

                if (!id) return;

                const res = await fetch(`/api/journeys/get?id=${id}`);
                if (!res.ok) throw new Error("Erro ao carregar");
                const data = await res.json();

                setJourneyName(data.name);
                setDescription(data.description || "");
                setExitCriteria(data.exit_criteria || []);
                if (data.canvas_data) {
                    setNodes(data.canvas_data.nodes || INITIAL_NODES);
                    setEdges(data.canvas_data.edges || INITIAL_EDGES);
                }
            } catch (err) {
                error("Erro", "Não foi possível carregar os dados.");
            } finally {
                setIsLoading(false);
            }
        };

        loadResources();
    }, [id, error, setNodes, setEdges]);

    const onConnect = useCallback(
        (connection: Connection) => {
            setEdges((eds) =>
                addEdge({
                    ...connection,
                    markerEnd: { type: MarkerType.ArrowClosed },
                    style: { stroke: "#94a3b8", strokeWidth: 2 }
                }, eds)
            );
        },
        [setEdges]
    );

    const addNode = useCallback(
        (type: string) => {
            const config = NODE_CONFIGS[type];
            const newNode: Node = {
                id: `${type}-${Date.now()}`,
                type: "journeyNode",
                position: { x: 300 + (nodes.length % 3) * 50, y: (nodes.length) * 160 },
                data: {
                    nodeType: type,
                    label: config.label,
                    description: "Configurar...",
                    entered: 0,
                    completed: 0,
                },
            };
            setNodes((nds) => [...nds, newNode]);
            setSelectedNode(newNode);
            info("Node adicionado", `Ação de ${config.label} incluída.`);
        },
        [nodes.length, setNodes, info]
    );

    const deleteNode = useCallback(
        (nodeId: string) => {
            setNodes((nds) => nds.filter((n) => n.id !== nodeId));
            setEdges((eds) => eds.filter((e) => e.source !== nodeId && e.target !== nodeId));
            if (selectedNode?.id === nodeId) setSelectedNode(null);
            success("Removido", "Node excluído com sucesso.");
        },
        [setNodes, setEdges, selectedNode, success]
    );

    const onNodeClick = useCallback((_: React.MouseEvent, node: Node) => {
        setSelectedNode(node);
    }, []);

    const updateNodeData = useCallback(
        (nodeId: string, updates: Record<string, unknown>) => {
            setNodes((nds) =>
                nds.map((n) => (n.id === nodeId ? { ...n, data: { ...n.data, ...updates } } : n))
            );
        },
        [setNodes]
    );

    const handleSave = async (status: string = 'draft') => {
        setIsSaving(true);
        try {
            const body = {
                id,
                name: journeyName,
                description,
                canvas_data: { nodes, edges },
                exit_criteria: exitCriteria,
                status
            };

            const res = await fetch("/api/journeys/save", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(body),
            });

            if (!res.ok) throw new Error("Erro ao salvar");
            const data = await res.json();

            if (!id) {
                setId(data.id);
                window.history.replaceState(null, "", `?id=${data.id}`);
            }

            success("Sucesso", status === 'active' ? "Jornada ativada com sucesso!" : "Progresso salvo com sucesso.");
        } catch (err) {
            error("Erro ao salvar", "Ocorreu um problema ao persistir a jornada.");
        } finally {
            setIsSaving(false);
        }
    };

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
                <Loader2 className="animate-spin text-brand-primary" size={40} />
                <p className="text-sm font-medium text-zinc-500">Carregando jornada...</p>
            </div>
        );
    }

    return (
        <div className="animate-fade-in" style={{ height: "calc(100vh - 120px)" }}>
            {/* Header */}
            <div className="flex items-center justify-between mb-4 flex-wrap gap-2 px-2">
                <div className="flex items-center gap-4">
                    <Link href="/journeys" className="p-2.5 rounded-xl hover:bg-zinc-100 transition-colors" style={{ color: "var(--text-secondary)" }}>
                        <ArrowLeft size={18} />
                    </Link>
                    <div className="flex flex-col">
                        <input
                            value={journeyName}
                            onChange={(e) => setJourneyName(e.target.value)}
                            className="text-lg font-black bg-transparent border-none outline-none focus:ring-1 focus:ring-brand-primary/20 rounded px-1 transition-all"
                            placeholder="Nome da Jornada"
                            style={{ color: "var(--text-primary)" }}
                        />
                        <span className="text-[10px] font-bold text-zinc-400 px-1 uppercase tracking-widest">
                            {id ? `ID: #${id.substring(0, 8)}` : "Novo Rascunho"}
                        </span>
                    </div>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={() => handleSave('draft')}
                        disabled={isSaving}
                        className="btn-secondary text-xs h-9"
                    >
                        {isSaving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                        Salvar Rascunho
                    </button>
                    <button
                        onClick={() => handleSave('active')}
                        disabled={isSaving}
                        className="btn-primary text-xs h-9"
                    >
                        <Play size={14} />
                        Ativar Jornada
                    </button>
                </div>
            </div>

            <div className="flex gap-4" style={{ height: "calc(100% - 60px)" }}>
                {/* Palette */}
                <div className="w-44 flex-shrink-0 hidden lg:block">
                    <div className="card p-4 h-full overflow-y-auto border-dashed border-2">
                        <h3 className="text-[11px] font-black mb-4 uppercase tracking-[0.2em]" style={{ color: "var(--text-muted)" }}>Componentes</h3>
                        <div className="space-y-2">
                            {PALETTE_ITEMS.map((item) => {
                                const config = NODE_CONFIGS[item.type];
                                const Icon = config.icon;
                                return (
                                    <button
                                        key={item.type}
                                        onClick={() => addNode(item.type)}
                                        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-[11px] font-bold transition-all border border-transparent hover:shadow-md group"
                                        style={{ backgroundColor: "var(--surface)", color: "var(--text-secondary)" }}
                                        onMouseEnter={(e) => {
                                            e.currentTarget.style.borderColor = config.color;
                                            e.currentTarget.style.backgroundColor = `${config.color}08`;
                                            e.currentTarget.style.color = config.color;
                                        }}
                                        onMouseLeave={(e) => {
                                            e.currentTarget.style.borderColor = "transparent";
                                            e.currentTarget.style.backgroundColor = "var(--surface)";
                                            e.currentTarget.style.color = "var(--text-secondary)";
                                        }}
                                    >
                                        <div className="p-1.5 rounded-lg border border-white/5 transition-colors group-hover:border-current">
                                            <Icon size={14} />
                                        </div>
                                        {item.label}
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                </div>

                {/* Canvas */}
                <div className="flex-1 card overflow-hidden rounded-2xl border-2 shadow-inner relative">
                    <ReactFlow
                        nodes={nodes}
                        edges={edges}
                        onNodesChange={onNodesChange}
                        onEdgesChange={onEdgesChange}
                        onConnect={onConnect}
                        onNodeClick={onNodeClick}
                        nodeTypes={nodeTypes}
                        fitView
                        snapToGrid
                        snapGrid={[15, 15]}
                        defaultEdgeOptions={{
                            type: "smoothstep",
                            style: { strokeWidth: 2, stroke: "#3b82f6" },
                        }}
                    >
                        <Background color="#cbd5e1" gap={30} size={1.5} />
                        <Controls position="bottom-right" className="!bg-white !shadow-xl !rounded-lg !border-none overflow-hidden" />
                        <MiniMap
                            nodeColor={(n) => {
                                const config = NODE_CONFIGS[n.data?.nodeType as string];
                                return config?.color || "#94a3b8";
                            }}
                            maskColor="rgba(0,0,0,0.05)"
                            className="!bg-white/80 !backdrop-blur-sm !border !border-white/20 !rounded-xl !shadow-lg"
                        />
                    </ReactFlow>
                </div>

                {/* Properties Panel or Global Settings */}
                <div className="w-80 flex-shrink-0 animate-in slide-in-from-right duration-300">
                    <div className="card p-5 h-full overflow-y-auto shadow-2xl border-brand-primary/10">
                        {!selectedNode ? (
                            /* Global Settings */
                            <div className="space-y-6">
                                <div className="flex items-center gap-2 mb-6 pb-4 border-b border-zinc-100 dark:border-zinc-800">
                                    <GitBranch size={16} className="text-brand-primary" />
                                    <h3 className="text-xs font-black uppercase tracking-widest text-zinc-500">Configurações Gerais</h3>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400 block px-1">Nome da Jornada</label>
                                    <input
                                        value={journeyName}
                                        onChange={(e) => setJourneyName(e.target.value)}
                                        className="w-full px-4 py-3 rounded-xl border text-sm font-bold focus:ring-2 focus:ring-brand-primary/20 outline-none"
                                        style={{ background: "var(--surface)", borderColor: "var(--border)" }}
                                    />
                                </div>

                                <div className="space-y-4 pt-4">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400 block px-1">Critérios de Saída Automática</label>
                                    <p className="text-[10px] text-zinc-400 px-1 leading-relaxed">
                                        Remover o lead desta jornada automaticamente se ele alcançar um destes estados:
                                    </p>

                                    <div className="space-y-2">
                                        {pipelineStages.map(stage => {
                                            const isChecked = exitCriteria.some(c => c.type === 'stage_changed' && c.target_stage_id === stage.id);
                                            return (
                                                <label key={stage.id} className="flex items-center gap-3 p-3 rounded-xl border border-zinc-100 bg-zinc-50/50 cursor-pointer hover:border-brand-primary/30 transition-all">
                                                    <input
                                                        type="checkbox"
                                                        checked={isChecked}
                                                        onChange={(e) => {
                                                            if (e.target.checked) {
                                                                setExitCriteria([...exitCriteria, { type: 'stage_changed', target_stage_id: stage.id }]);
                                                            } else {
                                                                setExitCriteria(exitCriteria.filter(c => !(c.type === 'stage_changed' && c.target_stage_id === stage.id)));
                                                            }
                                                        }}
                                                        className="w-4 h-4 rounded-lg accent-brand-primary"
                                                    />
                                                    <div className="flex items-center gap-2">
                                                        <div className="w-2 h-2 rounded-full" style={{ background: stage.color }} />
                                                        <span className="text-xs font-bold text-zinc-700">{stage.name}</span>
                                                    </div>
                                                </label>
                                            );
                                        })}
                                    </div>
                                </div>
                            </div>
                        ) : (
                            /* Node Properties */
                            <div className="space-y-5">
                                <div className="flex items-center justify-between mb-6 pb-4 border-b border-zinc-100 dark:border-zinc-800">
                                    <div className="flex items-center gap-2">
                                        <Zap size={16} className="text-brand-primary" />
                                        <h3 className="text-xs font-black uppercase tracking-widest text-zinc-500">Configuração</h3>
                                    </div>
                                    <button
                                        onClick={() => deleteNode(selectedNode.id)}
                                        className="p-2 hover:bg-red-50 hover:text-red-500 rounded-lg transition-colors text-zinc-400"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400 block px-1">TIPO DE BLOCO</label>
                                    <div
                                        className="flex items-center gap-2 px-3 py-2 rounded-xl border"
                                        style={{
                                            background: `${NODE_CONFIGS[selectedNode.data.nodeType as string]?.bg}40`,
                                            borderColor: `${NODE_CONFIGS[selectedNode.data.nodeType as string]?.color}30`,
                                            color: NODE_CONFIGS[selectedNode.data.nodeType as string]?.color,
                                        }}
                                    >
                                        {(() => {
                                            const Icon = NODE_CONFIGS[selectedNode.data.nodeType as string]?.icon || Zap;
                                            return <Icon size={14} />;
                                        })()}
                                        <span className="text-xs font-bold uppercase">
                                            {NODE_CONFIGS[selectedNode.data.nodeType as string]?.label}
                                        </span>
                                    </div>
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400 block px-1">Título Exibido</label>
                                    <input
                                        value={selectedNode.data.label as string}
                                        onChange={(e) => updateNodeData(selectedNode.id, { label: e.target.value })}
                                        placeholder="Ex: Enviar Boas-vindas"
                                        className="w-full px-4 py-3 rounded-xl border text-sm font-medium focus:ring-2 focus:ring-brand-primary/20 transition-all outline-none"
                                        style={{ background: "var(--surface)", borderColor: "var(--border)", color: "var(--text-primary)" }}
                                    />
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400 block px-1">Notas Internas</label>
                                    <textarea
                                        value={(selectedNode.data.description as string) || ""}
                                        onChange={(e) => updateNodeData(selectedNode.id, { description: e.target.value })}
                                        placeholder="Descreva o que este passo faz..."
                                        className="w-full px-4 py-3 rounded-xl border text-sm h-20 resize-none focus:ring-2 focus:ring-brand-primary/20 transition-all outline-none"
                                        style={{ background: "var(--surface)", borderColor: "var(--border)", color: "var(--text-primary)" }}
                                    />
                                </div>

                                <div className="pt-4 border-t border-zinc-100 dark:border-zinc-800 space-y-4">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400 block px-1 mb-2">Configuração da Ação</label>

                                    {selectedNode.data.nodeType === "trigger" && (
                                        <div className="space-y-3">
                                            <select
                                                value={(selectedNode.data.triggerType as string) || "lead_created"}
                                                onChange={(e) => updateNodeData(selectedNode.id, { triggerType: e.target.value })}
                                                className="w-full px-3 py-2.5 rounded-xl border text-sm font-bold bg-transparent"
                                                style={{ borderColor: "var(--border)" }}
                                            >
                                                <option value="lead_created">Gatilho: Novo Lead Criado</option>
                                                <option value="tag_added">Gatilho: Tag Adicionada</option>
                                                <option value="stage_changed">Gatilho: Mudança de Estágio</option>
                                                <option value="manual">Gatilho: Manual / API</option>
                                            </select>
                                        </div>
                                    )}

                                    {selectedNode.data.nodeType === "wait" && (
                                        <div className="flex gap-2">
                                            <input
                                                type="number"
                                                value={(selectedNode.data.waitValue as number) || 3}
                                                onChange={(e) => updateNodeData(selectedNode.id, { waitValue: parseInt(e.target.value) || 0 })}
                                                className="w-20 px-3 py-2.5 rounded-xl border text-sm font-bold text-center"
                                                style={{ background: "var(--surface)", borderColor: "var(--border)" }}
                                            />
                                            <select
                                                value={(selectedNode.data.waitUnit as string) || "days"}
                                                onChange={(e) => updateNodeData(selectedNode.id, { waitUnit: e.target.value })}
                                                className="flex-1 px-3 py-2.5 rounded-xl border text-sm font-bold bg-transparent"
                                                style={{ borderColor: "var(--border)" }}
                                            >
                                                <option value="minutes">Minutos</option>
                                                <option value="hours">Horas</option>
                                                <option value="days">Dias</option>
                                                <option value="weeks">Semanas</option>
                                            </select>
                                        </div>
                                    )}

                                    {selectedNode.data.nodeType === "send_email" && (
                                        <div className="space-y-3">
                                            <select
                                                value={(selectedNode.data.templateId as string) || ""}
                                                onChange={(e) => updateNodeData(selectedNode.id, { templateId: e.target.value })}
                                                className="w-full px-3 py-2.5 rounded-xl border text-sm font-bold bg-transparent"
                                                style={{ borderColor: "var(--border)" }}
                                            >
                                                <option value="">Selecionar Template...</option>
                                                {emailTemplates.map(tpl => (
                                                    <option key={tpl.id} value={tpl.id}>Template: {tpl.name}</option>
                                                ))}
                                            </select>
                                            {(selectedNode.data.templateId as string) && (
                                                <Link
                                                    href={`/campaigns/templates/editor?id=${selectedNode.data.templateId as string}`}
                                                    className="w-full py-2 text-[10px] font-bold text-brand-primary uppercase tracking-widest hover:bg-brand-primary/5 rounded-lg transition-colors block text-center"
                                                >
                                                    Editar Template Escolhido →
                                                </Link>
                                            )}
                                            <Link
                                                href="/campaigns/templates/editor"
                                                className="w-full py-2 text-[10px] font-bold text-zinc-400 uppercase tracking-widest hover:bg-zinc-50 rounded-lg transition-colors block text-center"
                                            >
                                                Criar Novo Template
                                            </Link>
                                        </div>
                                    )}

                                    {selectedNode.data.nodeType === "condition" && (
                                        <div className="space-y-3">
                                            <select
                                                value={(selectedNode.data.conditionType as string) || "field_match"}
                                                onChange={(e) => updateNodeData(selectedNode.id, { conditionType: e.target.value })}
                                                className="w-full px-3 py-2.5 rounded-xl border text-sm font-bold bg-transparent"
                                                style={{ borderColor: "var(--border)" }}
                                            >
                                                <option value="field_match">Se Campo coincidir</option>
                                                <option value="tag_present">Se possui Tag</option>
                                                <option value="score_threshold">Se Score for maior que...</option>
                                            </select>
                                        </div>
                                    )}

                                    {selectedNode.data.nodeType === "change_stage" && (
                                        <select
                                            value={(selectedNode.data.stageId as string) || ""}
                                            onChange={(e) => updateNodeData(selectedNode.id, { stageId: e.target.value })}
                                            className="w-full px-3 py-2.5 rounded-xl border text-sm font-bold bg-transparent"
                                            style={{ borderColor: "var(--border)" }}
                                        >
                                            <option value="">Selecionar Estágio...</option>
                                            {pipelineStages.map(stage => (
                                                <option key={stage.id} value={stage.id}>Mover para: {stage.name}</option>
                                            ))}
                                        </select>
                                    )}

                                    {selectedNode.data.nodeType === "send_whatsapp" && (
                                        <div className="space-y-4">
                                            <div className="space-y-1.5">
                                                <div className="flex items-center justify-between px-1">
                                                    <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Conteúdo da Mensagem</label>
                                                    <span className="text-[9px] font-bold text-brand-primary uppercase">Variáveis Ativas</span>
                                                </div>
                                                <textarea
                                                    value={(selectedNode.data.content as string) || ""}
                                                    onChange={(e) => updateNodeData(selectedNode.id, { content: e.target.value })}
                                                    placeholder="Olá {{nome}}, tudo bem? Vimos que você se interessou pela {{empresa}}..."
                                                    className="w-full px-4 py-3 rounded-xl border text-sm h-32 resize-none focus:ring-2 focus:ring-brand-primary/20 transition-all outline-none"
                                                    style={{ background: "var(--surface)", borderColor: "var(--border)", color: "var(--text-primary)" }}
                                                />
                                                <div className="flex flex-wrap gap-1 mt-2">
                                                    {['nome', 'empresa', 'email', 'estagio'].map(v => (
                                                        <button
                                                            key={v}
                                                            onClick={() => {
                                                                const current = (selectedNode.data.content as string) || "";
                                                                updateNodeData(selectedNode.id, { content: current + `{{${v}}}` });
                                                            }}
                                                            className="text-[9px] font-bold px-2 py-1 rounded bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 transition-colors"
                                                        >
                                                            + {v}
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>

                                            <div className="p-3 bg-blue-50/50 rounded-xl border border-blue-100">
                                                <p className="text-[10px] text-blue-600 leading-tight">
                                                    <b>Dica:</b> Use parágrafos curtos e emojis para aumentar o engajamento no WhatsApp.
                                                </p>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Metrics Card */}
                                {(selectedNode.data.entered as number) > 0 && (
                                    <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800">
                                        <p className="text-[9px] font-black uppercase tracking-widest text-zinc-400 mb-3 text-center">Desempenho Real</p>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="text-center">
                                                <span className="block text-xl font-black text-brand-primary line-clamp-1">{selectedNode.data.entered as number}</span>
                                                <span className="text-[9px] font-bold text-zinc-500 uppercase">Input</span>
                                            </div>
                                            <div className="text-center">
                                                <span className="block text-xl font-black text-emerald-500 line-clamp-1">{selectedNode.data.completed as number}</span>
                                                <span className="text-[9px] font-bold text-zinc-500 uppercase">Output</span>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

export default function JourneyEditorPage() {
    return (
        <Suspense fallback={
            <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
                <Loader2 className="animate-spin text-brand-primary" size={40} />
                <p className="text-sm font-medium text-zinc-500">Preparando editor de jornadas...</p>
            </div>
        }>
            <JourneyEditorContent />
        </Suspense>
    );
}
