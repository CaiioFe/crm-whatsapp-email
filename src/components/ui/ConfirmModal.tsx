"use client";

import { AlertTriangle, X } from "lucide-react";

interface ConfirmModalProps {
    open: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title: string;
    description: string;
    confirmText?: string;
    cancelText?: string;
    variant?: "danger" | "warning" | "info";
}

const VARIANTS = {
    danger: { bg: "#fef2f2", color: "#ef4444", btnBg: "#ef4444" },
    warning: { bg: "#fffbeb", color: "#f59e0b", btnBg: "#f59e0b" },
    info: { bg: "#eff6ff", color: "#3b82f6", btnBg: "#3b82f6" },
};

export function ConfirmModal({
    open,
    onClose,
    onConfirm,
    title,
    description,
    confirmText = "Confirmar",
    cancelText = "Cancelar",
    variant = "danger",
}: ConfirmModalProps) {
    if (!open) return null;

    const v = VARIANTS[variant];

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ background: "rgba(0,0,0,0.5)" }}
            onClick={onClose}
        >
            <div className="card p-6 w-full max-w-sm animate-slide-in" onClick={(e) => e.stopPropagation()}>
                <div className="flex items-start gap-4">
                    <div
                        className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
                        style={{ background: v.bg }}
                    >
                        <AlertTriangle size={20} style={{ color: v.color }} />
                    </div>
                    <div className="flex-1">
                        <h3 className="font-bold text-base" style={{ color: "var(--text-primary)" }}>
                            {title}
                        </h3>
                        <p className="text-sm mt-1" style={{ color: "var(--text-secondary)" }}>
                            {description}
                        </p>
                    </div>
                    <button onClick={onClose} className="p-1 rounded" style={{ color: "var(--text-muted)" }}>
                        <X size={16} />
                    </button>
                </div>

                <div className="flex gap-3 mt-5">
                    <button onClick={onClose} className="btn-secondary text-sm flex-1">
                        {cancelText}
                    </button>
                    <button
                        onClick={() => { onConfirm(); onClose(); }}
                        className="flex-1 py-2 px-4 rounded-xl text-white text-sm font-medium transition-all"
                        style={{ background: v.btnBg }}
                    >
                        {confirmText}
                    </button>
                </div>
            </div>
        </div>
    );
}
