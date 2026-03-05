"use client";

import { useState } from "react";
import {
    ArrowLeft,
    Plus,
    MessageCircle,
    Check,
    Clock,
    X,
    Copy,
    Send,
    Eye,
    Edit3,
    Trash2,
} from "lucide-react";
import Link from "next/link";

export default function WhatsAppTemplatesPage() {
    return (
        <div className="animate-fade-in flex flex-col items-center justify-center py-24 text-center">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-6" style={{ background: "var(--brand-primary-light)", color: "var(--brand-primary)" }}>
                <Edit3 size={32} />
            </div>
            <h1 className="text-2xl font-bold mb-3" style={{ color: "var(--text-primary)" }}>
                Templates WhatsApp (HSM)
            </h1>
            <p className="max-w-md mx-auto mb-8" style={{ color: "var(--text-secondary)" }}>
                A criação de templates pré-aprovados pela Meta estará disponível nativamente nesta tela. Em breve você poderá conectar sua carteira BSP e gerenciar suas aprovações direto por aqui.
            </p>
            <div className="flex gap-4">
                <Link href="/whatsapp" className="btn-secondary">
                    Voltar para WhatsApp
                </Link>
            </div>
        </div>
    );
}
