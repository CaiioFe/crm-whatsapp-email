"use client";

import { useState } from "react";
import { useEffect } from "react";
import {
    Mail,
    MessageCircle,
    Building2,
    CheckCircle,
    XCircle,
    Loader2,
    Eye,
    EyeOff,
    TestTube2,
    QrCode,
    RefreshCw,
    Save
} from "lucide-react";
import { toast } from "react-hot-toast";

interface ProviderConfig {
    provider: string;
    enabled: boolean;
    apiKey: string;
    fromEmail: string;
    fromName: string;
    status: "unconfigured" | "testing" | "connected" | "error" | "qr_pending";
    apiUrl?: string;
    instanceName?: string;
}

const EMAIL_PROVIDERS = [
    { id: "brevo", name: "Brevo", description: "Transacional + Marketing", color: "#0B996E" },
    { id: "resend", name: "Resend", description: "Developer-first email", color: "#000000" },
    { id: "sendgrid", name: "SendGrid", description: "High-volume delivery", color: "#1A82E2" },
];

const WHATSAPP_PROVIDERS = [
    { id: "evolution", name: "Evolution API", description: "Self-hosted WhatsApp", color: "#25D366" },
    { id: "meta", name: "Meta Cloud API", description: "API oficial do WhatsApp", color: "#1877F2" },
];

export default function SettingsPage() {
    const [activeTab, setActiveTab] = useState<"email" | "whatsapp" | "company">("email");
    const [isLoading, setIsLoading] = useState(true);
    const [emailConfigs, setEmailConfigs] = useState<Record<string, ProviderConfig>>({
        brevo: { provider: "brevo", enabled: false, apiKey: "", fromEmail: "", fromName: "", status: "unconfigured" },
        resend: { provider: "resend", enabled: false, apiKey: "", fromEmail: "", fromName: "", status: "unconfigured" },
        sendgrid: { provider: "sendgrid", enabled: false, apiKey: "", fromEmail: "", fromName: "", status: "unconfigured" },
    });
    const [whatsappConfigs, setWhatsappConfigs] = useState<Record<string, ProviderConfig>>({
        evolution: { provider: "evolution", enabled: false, apiKey: "", fromEmail: "", fromName: "", status: "unconfigured", apiUrl: "", instanceName: "" },
        meta: { provider: "meta", enabled: false, apiKey: "", fromEmail: "", fromName: "", status: "unconfigured" },
    });
    const [qrCode, setQrCode] = useState<string | null>(null);
    const [showKeys, setShowKeys] = useState<Record<string, boolean>>({});

    useEffect(() => {
        const loadConfigs = async () => {
            try {
                // Load WhatsApp configs
                const waRes = await fetch("/api/whatsapp/config");
                const waData = await waRes.json();
                if (!waData.error) {
                    const newWa = { ...whatsappConfigs };
                    waData.forEach((c: any) => {
                        newWa[c.provider] = {
                            provider: c.provider,
                            enabled: c.is_enabled,
                            apiKey: c.api_key_encrypted || "",
                            fromEmail: "",
                            fromName: "",
                            status: c.status || "unconfigured",
                            apiUrl: c.api_url || "",
                            instanceName: c.instance_name || ""
                        };
                    });
                    setWhatsappConfigs(newWa);
                }
            } catch (err) {
                console.error("Failed to load configs", err);
            } finally {
                setIsLoading(false);
            }
        };
        loadConfigs();
    }, []);

    const toggleKey = (provider: string) => {
        setShowKeys((prev) => ({ ...prev, [provider]: !prev[provider] }));
    };

    const updateConfig = (provider: string, updates: Partial<ProviderConfig>, type: "email" | "whatsapp" = "email") => {
        if (type === "email") {
            setEmailConfigs((prev) => ({
                ...prev,
                [provider]: { ...prev[provider], ...updates },
            }));
        } else {
            setWhatsappConfigs((prev) => ({
                ...prev,
                [provider]: { ...prev[provider], ...updates },
            }));
        }
    };

    const saveWaConfig = async (provider: string) => {
        const config = whatsappConfigs[provider];
        try {
            const baseUrl = config.apiUrl?.replace(/\/$/, "");
            const res = await fetch("/api/whatsapp/config", {
                method: "POST",
                body: JSON.stringify({
                    provider,
                    api_url: baseUrl,
                    api_key: config.apiKey,
                    instance_name: config.instanceName,
                    is_enabled: config.enabled
                })
            });
            if (res.ok) {
                toast.success("Configuração salva!");
            } else {
                toast.error("Erro ao salvar configuração");
            }
        } catch (err) {
            toast.error("Erro inesperado");
        }
    };

    const connectEvolution = async () => {
        try {
            updateConfig("evolution", { status: "testing" }, "whatsapp");
            const res = await fetch("/api/whatsapp/evolution/create-instance", { method: "POST", body: JSON.stringify({}) });
            const data = await res.json();

            if (data.qrcode?.base64) {
                setQrCode(data.qrcode.base64);
                updateConfig("evolution", { status: "qr_pending" }, "whatsapp");
            } else if (data.instance?.status === "open") {
                updateConfig("evolution", { status: "connected" }, "whatsapp");
                toast.success("WhatsApp Conectado!");
            } else {
                updateConfig("evolution", { status: "error" }, "whatsapp");
                toast.error("Erro ao gerar instância");
            }
        } catch (err) {
            updateConfig("evolution", { status: "error" }, "whatsapp");
        }
    };

    const checkEvolutionStatus = async () => {
        try {
            updateConfig("evolution", { status: "testing" }, "whatsapp");
            const res = await fetch("/api/whatsapp/evolution/connect");
            const data = await res.json();

            console.log("[SETTINGS] Evolution Status Check:", data);

            // Evolution API versions vary. Checking common "connected" signals.
            const isConnected =
                data.instance?.state === "open" ||
                data.instance?.status === "open" ||
                data.state === "open" ||
                data.status === "open" ||
                data.connectionStatus === "open";

            if (isConnected) {
                updateConfig("evolution", { status: "connected" }, "whatsapp");
                setQrCode(null);
                toast.success("Conectado com Sucesso!");
            } else {
                updateConfig("evolution", { status: "error" }, "whatsapp");
                const msg = data.error || data.message || "A instância não está conectada ao celular.";
                toast.error(`Falha: ${msg}`);
            }
        } catch (err) {
            console.error("[SETTINGS] Evolution Status Error:", err);
            updateConfig("evolution", { status: "error" }, "whatsapp");
            toast.error("Erro técnico ao tentar falar com a Evolution API.");
        }
    };

    const testConnection = async (provider: string) => {
        updateConfig(provider, { status: "testing" });
        // Simulate test
        await new Promise((r) => setTimeout(r, 1500));
        const config = emailConfigs[provider];
        if (config.apiKey && config.fromEmail) {
            updateConfig(provider, { status: "connected" });
        } else {
            updateConfig(provider, { status: "error" });
        }
    };

    const tabs = [
        { id: "email" as const, label: "Email", icon: Mail },
        { id: "whatsapp" as const, label: "WhatsApp", icon: MessageCircle },
        { id: "company" as const, label: "Empresa", icon: Building2 },
    ];

    return (
        <div className="animate-fade-in">
            <h1 className="text-xl md:text-2xl font-bold mb-1">Configurações</h1>
            <p className="text-sm mb-6" style={{ color: "var(--text-secondary)" }}>
                Gerencie integrações, provedores e dados da empresa
            </p>

            {/* Tabs */}
            <div className="flex gap-1 mb-6 overflow-x-auto pb-1">
                {tabs.map((tab) => {
                    const Icon = tab.icon;
                    const isActive = activeTab === tab.id;
                    return (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium whitespace-nowrap transition-all"
                            style={{
                                background: isActive ? "var(--brand-primary)" : "var(--surface)",
                                color: isActive ? "white" : "var(--text-secondary)",
                            }}
                        >
                            <Icon size={16} />
                            {tab.label}
                        </button>
                    );
                })}
            </div>

            {/* Email Tab */}
            {activeTab === "email" && (
                <div className="space-y-4 animate-fade-in">
                    {EMAIL_PROVIDERS.map((prov) => {
                        const config = emailConfigs[prov.id];
                        return (
                            <div key={prov.id} className="card p-5">
                                <div className="flex items-center justify-between mb-4">
                                    <div className="flex items-center gap-3">
                                        <div
                                            className="w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold text-xs"
                                            style={{ background: prov.color }}
                                        >
                                            {prov.name[0]}
                                        </div>
                                        <div>
                                            <h3 className="font-semibold text-sm" style={{ color: "var(--text-primary)" }}>
                                                {prov.name}
                                            </h3>
                                            <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                                                {prov.description}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        {config.status === "connected" && (
                                            <span className="flex items-center gap-1 text-xs" style={{ color: "var(--color-success)" }}>
                                                <CheckCircle size={14} /> Conectado
                                            </span>
                                        )}
                                        {config.status === "error" && (
                                            <span className="flex items-center gap-1 text-xs" style={{ color: "var(--color-error)" }}>
                                                <XCircle size={14} /> Erro
                                            </span>
                                        )}
                                        {config.status === "testing" && (
                                            <span className="flex items-center gap-1 text-xs" style={{ color: "var(--color-info)" }}>
                                                <Loader2 size={14} className="animate-spin" /> Testando...
                                            </span>
                                        )}
                                        <label className="relative inline-flex items-center cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={config.enabled}
                                                onChange={(e) => updateConfig(prov.id, { enabled: e.target.checked })}
                                                className="sr-only peer"
                                            />
                                            <div className="w-10 h-5 rounded-full peer-checked:bg-indigo-500 bg-gray-300 transition-colors relative after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:w-4 after:h-4 after:bg-white after:rounded-full after:transition-all peer-checked:after:translate-x-5" />
                                        </label>
                                    </div>
                                </div>

                                {config.enabled && (
                                    <div className="space-y-3 pt-3 border-t animate-fade-in" style={{ borderColor: "var(--border-light)" }}>
                                        <div>
                                            <label className="text-xs font-medium mb-1 block" style={{ color: "var(--text-secondary)" }}>
                                                API Key
                                            </label>
                                            <div className="flex gap-2">
                                                <input
                                                    type={showKeys[prov.id] ? "text" : "password"}
                                                    value={config.apiKey}
                                                    onChange={(e) => updateConfig(prov.id, { apiKey: e.target.value })}
                                                    placeholder="Cole sua API Key aqui"
                                                    className="flex-1 px-3 py-2 rounded-lg border text-sm"
                                                    style={{ background: "var(--surface)", borderColor: "var(--border)", color: "var(--text-primary)" }}
                                                />
                                                <button
                                                    onClick={() => toggleKey(prov.id)}
                                                    className="p-2 rounded-lg border"
                                                    style={{ borderColor: "var(--border)", color: "var(--text-muted)" }}
                                                >
                                                    {showKeys[prov.id] ? <EyeOff size={16} /> : <Eye size={16} />}
                                                </button>
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                            <div>
                                                <label className="text-xs font-medium mb-1 block" style={{ color: "var(--text-secondary)" }}>
                                                    Email Remetente
                                                </label>
                                                <input
                                                    type="email"
                                                    value={config.fromEmail}
                                                    onChange={(e) => updateConfig(prov.id, { fromEmail: e.target.value })}
                                                    placeholder="contato@suaempresa.com"
                                                    className="w-full px-3 py-2 rounded-lg border text-sm"
                                                    style={{ background: "var(--surface)", borderColor: "var(--border)", color: "var(--text-primary)" }}
                                                />
                                            </div>
                                            <div>
                                                <label className="text-xs font-medium mb-1 block" style={{ color: "var(--text-secondary)" }}>
                                                    Nome Remetente
                                                </label>
                                                <input
                                                    value={config.fromName}
                                                    onChange={(e) => updateConfig(prov.id, { fromName: e.target.value })}
                                                    placeholder="Sua Empresa"
                                                    className="w-full px-3 py-2 rounded-lg border text-sm"
                                                    style={{ background: "var(--surface)", borderColor: "var(--border)", color: "var(--text-primary)" }}
                                                />
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => testConnection(prov.id)}
                                            disabled={config.status === "testing"}
                                            className="btn-secondary text-xs py-2"
                                        >
                                            <TestTube2 size={14} />
                                            Testar Conexão
                                        </button>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}

            {/* WhatsApp Tab */}
            {activeTab === "whatsapp" && (
                <div className="space-y-4 animate-fade-in">
                    {WHATSAPP_PROVIDERS.map((prov) => {
                        const config = whatsappConfigs[prov.id];
                        const isEvolution = prov.id === "evolution";

                        return (
                            <div key={prov.id} className="card p-5">
                                <div className="flex items-center justify-between mb-4">
                                    <div className="flex items-center gap-3">
                                        <div
                                            className="w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold text-xs"
                                            style={{ background: prov.color }}
                                        >
                                            {prov.name[0]}
                                        </div>
                                        <div>
                                            <h3 className="font-semibold text-sm" style={{ color: "var(--text-primary)" }}>
                                                {prov.name}
                                            </h3>
                                            <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                                                {prov.description}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        {config.status === "connected" && (
                                            <span className="flex items-center gap-1 text-xs" style={{ color: "var(--color-success)" }}>
                                                <CheckCircle size={14} /> Conectado
                                            </span>
                                        )}
                                        {config.status === "qr_pending" && (
                                            <span className="flex items-center gap-1 text-xs" style={{ color: "var(--color-warning)" }}>
                                                <QrCode size={14} /> Aguardando QR Code
                                            </span>
                                        )}
                                        {config.status === "testing" && (
                                            <span className="flex items-center gap-1 text-xs" style={{ color: "var(--color-info)" }}>
                                                <Loader2 size={14} className="animate-spin" /> Processando...
                                            </span>
                                        )}
                                        <label className="relative inline-flex items-center cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={config.enabled}
                                                onChange={(e) => updateConfig(prov.id, { enabled: e.target.checked }, "whatsapp")}
                                                className="sr-only peer"
                                            />
                                            <div className="w-10 h-5 rounded-full peer-checked:bg-indigo-500 bg-gray-300 transition-colors relative after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:w-4 after:h-4 after:bg-white after:rounded-full after:transition-all peer-checked:after:translate-x-5" />
                                        </label>
                                    </div>
                                </div>

                                {config.enabled && isEvolution && (
                                    <div className="space-y-4 pt-4 border-t animate-fade-in" style={{ borderColor: "var(--border-light)" }}>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div>
                                                <label className="text-xs font-medium mb-1 block" style={{ color: "var(--text-secondary)" }}>
                                                    API URL
                                                </label>
                                                <input
                                                    value={config.apiUrl || ""}
                                                    onChange={(e) => updateConfig(prov.id, { apiUrl: e.target.value }, "whatsapp")}
                                                    placeholder="https://sua-evolution-api.com"
                                                    className="w-full px-3 py-2 rounded-lg border text-sm"
                                                    style={{ background: "var(--surface)", borderColor: "var(--border)", color: "var(--text-primary)" }}
                                                />
                                            </div>
                                            <div>
                                                <label className="text-xs font-medium mb-1 block" style={{ color: "var(--text-secondary)" }}>
                                                    Global API Key
                                                </label>
                                                <div className="flex gap-2">
                                                    <input
                                                        type={showKeys[prov.id] ? "text" : "password"}
                                                        value={config.apiKey || ""}
                                                        onChange={(e) => updateConfig(prov.id, { apiKey: e.target.value }, "whatsapp")}
                                                        placeholder="Sua API Key"
                                                        className="flex-1 px-3 py-2 rounded-lg border text-sm"
                                                        style={{ background: "var(--surface)", borderColor: "var(--border)", color: "var(--text-primary)" }}
                                                    />
                                                    <button onClick={() => toggleKey(prov.id)} className="p-2 border rounded-lg">
                                                        {showKeys[prov.id] ? <EyeOff size={16} /> : <Eye size={16} />}
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div>
                                                <label className="text-xs font-medium mb-1 block" style={{ color: "var(--text-secondary)" }}>
                                                    Nome da Instância
                                                </label>
                                                <input
                                                    value={config.instanceName || ""}
                                                    onChange={(e) => updateConfig(prov.id, { instanceName: e.target.value }, "whatsapp")}
                                                    placeholder="crm-whatsapp"
                                                    className="w-full px-3 py-2 rounded-lg border text-sm"
                                                    style={{ background: "var(--surface)", borderColor: "var(--border)", color: "var(--text-primary)" }}
                                                />
                                            </div>
                                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                                                <button
                                                    onClick={() => saveWaConfig(prov.id)}
                                                    className="btn-secondary flex items-center justify-center gap-2 py-3 rounded-2xl hover:bg-zinc-50 transition-all border-2 border-zinc-100 font-bold"
                                                >
                                                    <Save size={16} className="text-zinc-400" />
                                                    <span>Salvar Configuração</span>
                                                </button>

                                                <button
                                                    onClick={checkEvolutionStatus}
                                                    className="btn-secondary flex items-center justify-center gap-2 py-3 rounded-2xl transition-all border-2 border-brand-primary/20 text-brand-primary font-bold hover:bg-brand-primary/5"
                                                >
                                                    <RefreshCw size={16} />
                                                    <span>Verificar Conexão</span>
                                                </button>

                                                {!config.status || config.status !== 'connected' ? (
                                                    <button
                                                        onClick={connectEvolution}
                                                        className="btn-primary flex items-center justify-center gap-2 py-3 rounded-2xl shadow-lg shadow-brand-primary/20 font-black uppercase tracking-widest text-[10px]"
                                                    >
                                                        <QrCode size={16} />
                                                        <span>Gerar Novo QR Code</span>
                                                    </button>
                                                ) : (
                                                    <div className="flex items-center justify-center gap-2 px-4 py-3 bg-emerald-50 text-emerald-600 rounded-2xl border-2 border-emerald-100 font-bold text-xs">
                                                        <CheckCircle size={16} />
                                                        <span>Instância Ativa</span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        {qrCode && config.status === "qr_pending" && (
                                            <div className="flex flex-col items-center justify-center p-6 bg-white rounded-xl border-2 border-dashed border-gray-200 animate-in zoom-in-95">
                                                <p className="text-xs font-bold mb-4 text-gray-700">ESCANEIE O QR CODE NO SEU WHATSAPP</p>
                                                <img src={qrCode} alt="WhatsApp QR Code" className="w-48 h-48 mb-4 shadow-lg rounded-lg" />
                                                <button onClick={checkEvolutionStatus} className="flex items-center gap-2 text-xs font-semibold text-indigo-600 hover:text-indigo-800">
                                                    <RefreshCw size={14} /> Já escaneei? Verificar status
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {config.enabled && !isEvolution && (
                                    <div className="p-4 bg-gray-50 rounded-lg border border-gray-100 mt-4">
                                        <p className="text-xs text-gray-500 italic">O suporte para Meta Cloud API está em desenvolvimento.</p>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Company Tab */}
            {activeTab === "company" && (
                <div className="card p-6 animate-fade-in">
                    <h3 className="font-semibold text-sm mb-4" style={{ color: "var(--text-secondary)" }}>
                        DADOS DA EMPRESA
                    </h3>
                    <div className="space-y-4 max-w-lg">
                        <div>
                            <label className="text-xs font-medium mb-1 block" style={{ color: "var(--text-secondary)" }}>
                                Nome da Empresa
                            </label>
                            <input
                                defaultValue="Minha Empresa"
                                className="w-full px-3 py-2 rounded-lg border text-sm"
                                style={{ background: "var(--surface)", borderColor: "var(--border)", color: "var(--text-primary)" }}
                            />
                        </div>
                        <div>
                            <label className="text-xs font-medium mb-1 block" style={{ color: "var(--text-secondary)" }}>
                                Website
                            </label>
                            <input
                                defaultValue="https://"
                                className="w-full px-3 py-2 rounded-lg border text-sm"
                                style={{ background: "var(--surface)", borderColor: "var(--border)", color: "var(--text-primary)" }}
                            />
                        </div>
                        <div>
                            <label className="text-xs font-medium mb-1 block" style={{ color: "var(--text-secondary)" }}>
                                Plano Atual
                            </label>
                            <div className="flex items-center gap-3">
                                <span className="badge badge-info">Free</span>
                                <button className="text-xs font-medium" style={{ color: "var(--brand-primary)" }}>
                                    Fazer Upgrade →
                                </button>
                            </div>
                        </div>
                        <button className="btn-primary text-sm mt-2">
                            Salvar Alterações
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
