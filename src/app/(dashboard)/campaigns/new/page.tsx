"use client";

import { Mail } from "lucide-react";
import Link from "next/link";

export default function NewCampaignPage() {
    return (
        <div className="animate-fade-in flex flex-col items-center justify-center py-24 text-center">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-6" style={{ background: "var(--brand-primary-light)", color: "var(--brand-primary)" }}>
                <Mail size={32} />
            </div>
            <h1 className="text-2xl font-bold mb-3" style={{ color: "var(--text-primary)" }}>
                Nova Campanha
            </h1>
            <p className="max-w-md mx-auto mb-8" style={{ color: "var(--text-secondary)" }}>
                O módulo de criação de novas campanhas está sendo reestruturado para suportar o novo editor arrasta e solta. Em breve estará disponível!
            </p>
            <div className="flex gap-4">
                <Link href="/campaigns" className="btn-secondary">
                    Voltar para Campanhas
                </Link>
            </div>
        </div>
    );
}
