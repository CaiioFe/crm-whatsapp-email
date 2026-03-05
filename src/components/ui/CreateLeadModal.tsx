"use client";

import { useState } from "react";
import { X, User, Mail, Phone, Building2, Briefcase, Tag, Save } from "lucide-react";

interface CreateLeadModalProps {
    open: boolean;
    onClose: () => void;
    onSave?: (data: Record<string, string>) => void;
}

const STAGES = [
    { id: "novo", name: "Novo", color: "#6366f1" },
    { id: "contato", name: "Contato", color: "#3b82f6" },
    { id: "qualificado", name: "Qualificado", color: "#f59e0b" },
    { id: "proposta", name: "Proposta", color: "#f97316" },
];

const AVAILABLE_TAGS = [
    { name: "VIP", color: "#f59e0b" },
    { name: "Webinar", color: "#3b82f6" },
    { name: "Ebook", color: "#22c55e" },
    { name: "Trial", color: "#8b5cf6" },
    { name: "Enterprise", color: "#ef4444" },
    { name: "Indicação", color: "#ec4899" },
];

export function CreateLeadModal({ open, onClose, onSave }: CreateLeadModalProps) {
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [phone, setPhone] = useState("");
    const [company, setCompany] = useState("");
    const [position, setPosition] = useState("");
    const [stage, setStage] = useState("novo");
    const [selectedTags, setSelectedTags] = useState<string[]>([]);

    if (!open) return null;

    const handleSave = () => {
        if (!name.trim()) return;
        onSave?.({ name, email, phone, company, position, stage, tags: selectedTags.join(",") });
        // Reset
        setName(""); setEmail(""); setPhone(""); setCompany(""); setPosition("");
        setStage("novo"); setSelectedTags([]);
        onClose();
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

                    {/* Stage */}
                    <div>
                        <label className="text-[10px] font-bold block mb-1.5" style={{ color: "var(--text-muted)" }}>ESTÁGIO INICIAL</label>
                        <div className="flex gap-2 flex-wrap">
                            {STAGES.map((s) => (
                                <button
                                    key={s.id}
                                    type="button"
                                    onClick={() => setStage(s.id)}
                                    className="px-3 py-1.5 rounded-full text-xs font-medium transition-all border"
                                    style={{
                                        background: stage === s.id ? `${s.color}20` : "transparent",
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
                            {AVAILABLE_TAGS.map((tag) => {
                                const isSelected = selectedTags.includes(tag.name);
                                return (
                                    <button
                                        key={tag.name}
                                        type="button"
                                        onClick={() => toggleTag(tag.name)}
                                        className="px-2.5 py-1 rounded-full text-[11px] font-medium transition-all border"
                                        style={{
                                            background: isSelected ? `${tag.color}20` : "transparent",
                                            borderColor: isSelected ? tag.color : "var(--border)",
                                            color: isSelected ? tag.color : "var(--text-muted)",
                                        }}
                                    >
                                        {tag.name}
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                </div>

                {/* Actions */}
                <div className="flex gap-3 mt-6 pt-4 border-t" style={{ borderColor: "var(--border)" }}>
                    <button onClick={onClose} className="btn-secondary text-sm flex-1">Cancelar</button>
                    <button
                        onClick={handleSave}
                        disabled={!name.trim()}
                        className="btn-primary text-sm flex-1"
                        style={{ opacity: name.trim() ? 1 : 0.5 }}
                    >
                        <Save size={14} />
                        Salvar Lead
                    </button>
                </div>
            </div>
        </div>
    );
}
