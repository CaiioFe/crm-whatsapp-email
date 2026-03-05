"use client";

import { createContext, useContext, useState, useCallback, type ReactNode } from "react";
import { X, CheckCircle, AlertTriangle, Info, AlertCircle } from "lucide-react";

// ============================
// Types
// ============================

type ToastType = "success" | "error" | "warning" | "info";

interface Toast {
    id: string;
    type: ToastType;
    title: string;
    description?: string;
    duration?: number;
}

interface ToastContextType {
    toasts: Toast[];
    addToast: (toast: Omit<Toast, "id">) => void;
    removeToast: (id: string) => void;
    success: (title: string, description?: string) => void;
    error: (title: string, description?: string) => void;
    warning: (title: string, description?: string) => void;
    info: (title: string, description?: string) => void;
}

// ============================
// Context
// ============================

const ToastContext = createContext<ToastContextType | null>(null);

export function useToast() {
    const ctx = useContext(ToastContext);
    if (!ctx) throw new Error("useToast must be used within ToastProvider");
    return ctx;
}

// ============================
// Config
// ============================

const TOAST_ICONS: Record<ToastType, typeof CheckCircle> = {
    success: CheckCircle,
    error: AlertCircle,
    warning: AlertTriangle,
    info: Info,
};

const TOAST_COLORS: Record<ToastType, { bg: string; border: string; icon: string; text: string }> = {
    success: { bg: "#f0fdf4", border: "#22c55e", icon: "#22c55e", text: "#166534" },
    error: { bg: "#fef2f2", border: "#ef4444", icon: "#ef4444", text: "#991b1b" },
    warning: { bg: "#fffbeb", border: "#f59e0b", icon: "#f59e0b", text: "#92400e" },
    info: { bg: "#eff6ff", border: "#3b82f6", icon: "#3b82f6", text: "#1e40af" },
};

// ============================
// Provider
// ============================

export function ToastProvider({ children }: { children: ReactNode }) {
    const [toasts, setToasts] = useState<Toast[]>([]);

    const removeToast = useCallback((id: string) => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
    }, []);

    const addToast = useCallback(
        (toast: Omit<Toast, "id">) => {
            const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
            const newToast = { ...toast, id };
            setToasts((prev) => [...prev, newToast]);

            const duration = toast.duration || 4000;
            setTimeout(() => removeToast(id), duration);
        },
        [removeToast]
    );

    const success = useCallback(
        (title: string, description?: string) => addToast({ type: "success", title, description }),
        [addToast]
    );
    const error = useCallback(
        (title: string, description?: string) => addToast({ type: "error", title, description }),
        [addToast]
    );
    const warning = useCallback(
        (title: string, description?: string) => addToast({ type: "warning", title, description }),
        [addToast]
    );
    const info = useCallback(
        (title: string, description?: string) => addToast({ type: "info", title, description }),
        [addToast]
    );

    return (
        <ToastContext.Provider value={{ toasts, addToast, removeToast, success, error, warning, info }}>
            {children}

            {/* Toast Container */}
            <div className="fixed bottom-4 right-4 z-[9999] flex flex-col gap-2 max-w-sm w-full pointer-events-none">
                {toasts.map((toast) => {
                    const Icon = TOAST_ICONS[toast.type];
                    const colors = TOAST_COLORS[toast.type];

                    return (
                        <div
                            key={toast.id}
                            className="pointer-events-auto animate-slide-in rounded-xl shadow-lg border-l-4 px-4 py-3 flex items-start gap-3"
                            style={{
                                background: colors.bg,
                                borderLeftColor: colors.border,
                                boxShadow: "0 8px 30px rgba(0,0,0,0.12)",
                            }}
                        >
                            <Icon size={18} style={{ color: colors.icon }} className="flex-shrink-0 mt-0.5" />
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-semibold" style={{ color: colors.text }}>
                                    {toast.title}
                                </p>
                                {toast.description && (
                                    <p className="text-xs mt-0.5" style={{ color: colors.text, opacity: 0.8 }}>
                                        {toast.description}
                                    </p>
                                )}
                            </div>
                            <button
                                onClick={() => removeToast(toast.id)}
                                className="flex-shrink-0 p-0.5 rounded"
                                style={{ color: colors.text, opacity: 0.5 }}
                            >
                                <X size={14} />
                            </button>
                        </div>
                    );
                })}
            </div>
        </ToastContext.Provider>
    );
}
