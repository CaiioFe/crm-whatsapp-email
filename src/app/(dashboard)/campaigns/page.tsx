"use client";

import { useState } from "react";
import { Plus, Mail, Send, FileText, Clock, CheckCircle, BarChart3 } from "lucide-react";
import Link from "next/link";

export default function CampaignsPage() {

    return (
        <div className="animate-fade-in flex flex-col items-center justify-center py-24 text-center">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-6" style={{ background: "var(--brand-primary-light)", color: "var(--brand-primary)" }}>
                <Mail size={32} />
            </div>
            <h1 className="text-2xl font-bold mb-3" style={{ color: "var(--text-primary)" }}>
                Disparos e Campanhas
            </h1>
            <p className="max-w-md mx-auto mb-8" style={{ color: "var(--text-secondary)" }}>
                O módulo responsável pelo envio de broadcast de Emails está em desenvolvimento. Em breve, a sua conta de Email estará linkada aqui para os envios oficiais.
            </p>
            <div className="flex gap-4">
                <Link href="/campaigns/templates/editor" className="btn-secondary">
                    Ver Editor de Email
                </Link>
            </div>
        </div>
    );
}
