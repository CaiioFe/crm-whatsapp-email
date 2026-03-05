"use client";

import type { ReactNode } from "react";
import { Inbox, Search, FileText, Users, Mail, MessageCircle, GitBranch } from "lucide-react";

interface EmptyStateProps {
    icon?: typeof Inbox;
    title: string;
    description: string;
    action?: ReactNode;
}

export function EmptyState({ icon: Icon = Inbox, title, description, action }: EmptyStateProps) {
    return (
        <div className="flex flex-col items-center justify-center py-16 px-6 text-center animate-fade-in">
            <div
                className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4"
                style={{ background: "var(--brand-primary-light)" }}
            >
                <Icon size={28} style={{ color: "var(--brand-primary)" }} />
            </div>
            <h3 className="text-lg font-bold mb-1" style={{ color: "var(--text-primary)" }}>
                {title}
            </h3>
            <p className="text-sm max-w-xs" style={{ color: "var(--text-muted)" }}>
                {description}
            </p>
            {action && <div className="mt-4">{action}</div>}
        </div>
    );
}

// ============================
// Pre-built Empty States
// ============================

export function EmptyLeads({ onAction }: { onAction?: () => void }) {
    return (
        <EmptyState
            icon={Users}
            title="Nenhum lead encontrado"
            description="Importe leads via CSV ou crie manualmente para começar."
            action={
                onAction && (
                    <button onClick={onAction} className="btn-primary text-sm">
                        Adicionar Lead
                    </button>
                )
            }
        />
    );
}

export function EmptySearch() {
    return (
        <EmptyState
            icon={Search}
            title="Nenhum resultado"
            description="Tente ajustar os filtros ou termos de busca."
        />
    );
}

export function EmptyCampaigns() {
    return (
        <EmptyState
            icon={Mail}
            title="Nenhuma campanha"
            description="Crie sua primeira campanha de email para engajar seus leads."
        />
    );
}

export function EmptyConversations() {
    return (
        <EmptyState
            icon={MessageCircle}
            title="Nenhuma conversa"
            description="As conversas de WhatsApp aparecerão aqui assim que configurar a integração."
        />
    );
}

export function EmptyJourneys() {
    return (
        <EmptyState
            icon={GitBranch}
            title="Nenhuma jornada"
            description="Crie automações para nutrir leads automaticamente."
        />
    );
}
