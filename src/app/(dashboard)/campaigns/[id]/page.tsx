"use client";

import { BarChart3 } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";

export default function CampaignDetailsPage() {
    const params = useParams();
    const id = params?.id as string;
    return (
        <div className="animate-fade-in flex flex-col items-center justify-center py-24 text-center">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-6" style={{ background: "var(--brand-primary-light)", color: "var(--brand-primary)" }}>
                <BarChart3 size={32} />
            </div>
            <h1 className="text-2xl font-bold mb-3" style={{ color: "var(--text-primary)" }}>
                Estatísticas da Campanha
            </h1>
            <p className="max-w-md mx-auto mb-8" style={{ color: "var(--text-secondary)" }}>
                Em breve, você poderá acompanhar relatórios avançados para campanhas de email e disparos via WhatsApp, incluindo métricas de cliques por mapa de calor.
            </p>
            <div className="flex gap-4">
                <Link href="/campaigns" className="btn-secondary">
                    Voltar para Campanhas
                </Link>
            </div>
        </div>
    );
}
