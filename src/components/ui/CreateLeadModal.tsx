"use client";

import { useState } from "react";
import { X, User, Mail, Phone, Building2, Briefcase, Tag, Save, Instagram, BarChart3, Loader2 } from "lucide-react";

interface CreateLeadModalProps {
    open: boolean;
    onClose: () => void;
    onSave?: (data: Record<string, any>) => Promise<void>;
    stages?: any[];
    availableTags?: any[];
}

export function CreateLeadModal({ open, onClose, onSave, stages = [], availableTags = [] }: CreateLeadModalProps) {
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [phone, setPhone] = useState("");
    const [company, setCompany] = useState("");
    const [position, setPosition] = useState("");
    const [instagram, setInstagram] = useState("");
    const [revenue, setRevenue] = useState("");
    const [stage, setStage] = useState(stages[0]?.id || "");
    const [selectedTags, setSelectedTags] = useState<string[]>([]);
    const [isSaving, setIsSaving] = useState(false);

    // Update stage if stages load later
    useState(() => {
        if (stages.length > 0 && !stage) setStage(stages[0].id);
    });

    if (!open) return null;

    const handleSave = async () => {
        if (!name.trim() || isSaving) return;
        setIsSaving(true);
        try {
            await onSave?.({ name, email, phone, company, position, instagram, revenue, stage, tags: selectedTags.join(",") });
            // Reset
            setName(""); setEmail(""); setPhone(""); setCompany(""); setPosition("");
            setInstagram(""); setRevenue("");
            setStage(stages[0]?.id || ""); setSelectedTags([]);
            onClose();
        } catch (err) {
            console.error("Failed to save lead:", err);
        } finally {
            setIsSaving(false);
        }
    };

    const toggleTag = (tag: string) => {
        setSelectedTags((prev) =>
            prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
        );
    };

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ background: "rgba(0,0,0,0.5)" }}
            onClick={onClose}
        >
            <div
                className="card p-6 w-full max-w-lg animate-slide-in max-h-[90vh] overflow-y-auto"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex items-center justify-between mb-5">
                    <h2 className="text-lg font-bold flex items-center gap-2" style={{ color: "var(--text-primary)" }}>
                        <User size={20} style={{ color: "var(--brand-primary)" }} />
                        Novo Lead
                    </h2>
                    <button onClick={onClose} className="p-1.5 rounded-lg" style={{ color: "var(--text-muted)" }}>
                        <X size={18} />
                    </button>
                </div>

                <div className="space-y-3">
                    {/* Name */}
                    <div>
                        <label className="text-[10px] font-bold block mb-1" style={{ color: "var(--text-muted)" }}>NOME *</label>
                        <div className="relative">
                            <User size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "var(--text-muted)" }} />
                            <input
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="Nome do lead"
                                className="w-full pl-9 pr-3 py-2.5 rounded-lg border text-sm"
                                style={{ background: "var(--surface)", borderColor: "var(--border)", color: "var(--text-primary)" }}
                                autoFocus
                            />
                        </div>
                    </div>

                    {/* Email & Phone */}
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="text-[10px] font-bold block mb-1" style={{ color: "var(--text-muted)" }}>EMAIL</label>
                            <div className="relative">
                                <Mail size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "var(--text-muted)" }} />
                                <input
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="email@exemplo.com"
                                    type="email"
                                    className="w-full pl-9 pr-3 py-2.5 rounded-lg border text-sm"
                                    style={{ background: "var(--surface)", borderColor: "var(--border)", color: "var(--text-primary)" }}
                                />
                            </div>
                        </div>
                        <div>
                            <label className="text-[10px] font-bold block mb-1" style={{ color: "var(--text-muted)" }}>TELEFONE</label>
                            <div className="relative">
                                <Phone size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "var(--text-muted)" }} />
                                <input
                                    value={phone}
                                    onChange={(e) => setPhone(e.target.value)}
                                    placeholder="+55 11 99999-0000"
                                    className="w-full pl-9 pr-3 py-2.5 rounded-lg border text-sm"
                                    style={{ background: "var(--surface)", borderColor: "var(--border)", color: "var(--text-primary)" }}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Company & Position */}
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="text-[10px] font-bold block mb-1" style={{ color: "var(--text-muted)" }}>EMPRESA</label>
                            <div className="relative">
                                <Building2 size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "var(--text-muted)" }} />
                                <input
                                    value={company}
                                    onChange={(e) => setCompany(e.target.value)}
                                    placeholder="Nome da empresa"
                                    className="w-full pl-9 pr-3 py-2.5 rounded-lg border text-sm"
                                    style={{ background: "var(--surface)", borderColor: "var(--border)", color: "var(--text-primary)" }}
                                />
                            </div>
                        </div>
                        <div>
                            <label className="text-[10px] font-bold block mb-1" style={{ color: "var(--text-muted)" }}>CARGO</label>
                            <div className="relative">
                                <Briefcase size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "var(--text-muted)" }} />
                                <input
                                    value={position}
                                    onChange={(e) => setPosition(e.target.value)}
                                    placeholder="Cargo/função"
                                    className="w-full pl-9 pr-3 py-2.5 rounded-lg border text-sm"
                                    style={{ background: "var(--surface)", borderColor: "var(--border)", color: "var(--text-primary)" }}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Instagram & Revenue */}
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="text-[10px] font-bold block mb-1" style={{ color: "var(--text-muted)" }}>INSTAGRAM</label>
                            <div className="relative">
                                <Instagram size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "var(--text-muted)" }} />
                                <input
                                    value={instagram}
                                    onChange={(e) => setInstagram(e.target.value)}
                                    placeholder="@usuario"
                                    className="w-full pl-9 pr-3 py-2.5 rounded-lg border text-sm"
                                    style={{ background: "var(--surface)", borderColor: "var(--border)", color: "var(--text-primary)" }}
                                />
                            </div>
                        </div>
                        <div>
                            <label className="text-[10px] font-bold block mb-1" style={{ color: "var(--text-muted)" }}>FATURAMENTO</label>
                            <div className="relative">
                                <BarChart3 size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "var(--text-muted)" }} />
                                <input
                                    value={revenue}
                                    onChange={(e) => setRevenue(e.target.value)}
                                    placeholder="Ex: 50k - 100k"
                                    className="w-full pl-9 pr-3 py-2.5 rounded-lg border text-sm"
                                    style={{ background: "var(--surface)", borderColor: "var(--border)", color: "var(--text-primary)" }}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Stage */}
                    <div>
                        <label className="text-[10px] font-bold block mb-1.5" style={{ color: "var(--text-muted)" }}>ESTÁGIO INICIAL</label>
                        <div className="flex gap-2 flex-wrap">
                            {stages.map((s) => (
                                <button
                                    key={s.id}
                                    type="button"
                                    onClick={() => setStage(s.id)}
                                    className="px-3 py-1.5 rounded-full text-[11px] font-bold transition-all border uppercase tracking-wider"
                                    style={{
                                        background: stage === s.id ? `${s.color}15` : "transparent",
                                        borderColor: stage === s.id ? s.color : "var(--border)",
                                        color: stage === s.id ? s.color : "var(--text-secondary)",
                                    }}
                                >
                                    {s.name}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Tags */}
                    <div>
                        <label className="text-[10px] font-bold block mb-1.5" style={{ color: "var(--text-muted)" }}>
                            <Tag size={10} className="inline mr-1" />
                            TAGS
                        </label>
                        <div className="flex gap-2 flex-wrap">
                            {availableTags.map((tag) => {
                                const isSelected = selectedTags.includes(tag.name);
                                return (
                                    <button
                                        key={tag.name}
                                        type="button"
                                        onClick={() => toggleTag(tag.name)}
                                        className="px-2.5 py-1 rounded-full text-[10px] font-black transition-all border uppercase tracking-widest"
                                        style={{
                                            background: isSelected ? `${tag.color || '#8b5cf6'}15` : "transparent",
                                            borderColor: isSelected ? (tag.color || '#8b5cf6') : "var(--border)",
                                            color: isSelected ? (tag.color || '#8b5cf6') : "var(--text-muted)",
                                        }}
                                    >
                                        {tag.name}
                                    </button>
                                );
                            })}
                            {availableTags.length === 0 && <span className="text-[10px] text-zinc-400 italic">Nenhuma tag cadastrada</span>}
                        </div>
                    </div>
                </div>

                {/* Actions */}
                <div className="flex gap-3 mt-6 pt-4 border-t" style={{ borderColor: "var(--border)" }}>
                    <button onClick={onClose} className="btn-secondary text-sm flex-1">Cancelar</button>
                    <button
                        onClick={handleSave}
                        disabled={!name.trim() || isSaving}
                        className="btn-primary text-sm flex-1 h-11"
                        style={{ opacity: name.trim() && !isSaving ? 1 : 0.5 }}
                    >
                        {isSaving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                        {isSaving ? "Salvando..." : "Salvar Lead"}
                    </button>
                </div>
            </div>
        </div>
    );
}
