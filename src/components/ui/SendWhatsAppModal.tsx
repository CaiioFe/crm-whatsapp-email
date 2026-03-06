"use client";

import { useState } from "react";
import { X, Send, Loader2, MessageCircle } from "lucide-react";
import { useToast } from "@/components/ui/Toast";

interface SendWhatsAppModalProps {
    open: boolean;
    onClose: () => void;
    lead: {
        id: string;
        name: string;
        phone: string | null;
    };
}

export function SendWhatsAppModal({ open, onClose, lead }: SendWhatsAppModalProps) {
    const [message, setMessage] = useState("");
    const [isSending, setIsSending] = useState(false);
    const toast = useToast();

    if (!open) return null;

    const handleSend = async () => {
        if (!message.trim() || !lead.phone) return;

        setIsSending(true);
        try {
            const res = await fetch("/api/whatsapp/evolution/send-message", {
                method: "POST",
                body: JSON.stringify({
                    number: lead.phone,
                    text: message
                })
            });

            if (res.ok) {
                toast.success("Mensagem enviada!", "Sua mensagem via WhatsApp foi entregue.");
                setMessage("");
                onClose();
            } else {
                const data = await res.json();
                toast.error("Erro ao enviar", data.error || "Não foi possível enviar a mensagem.");
            }
        } catch (err) {
            toast.error("Erro técnico", "Houve um problema de rede ou no servidor.");
        } finally {
            setIsSending(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white dark:bg-[#161b22] w-full max-w-md rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
                <div className="flex items-center justify-between p-4 border-b dark:border-zinc-800">
                    <div className="flex items-center gap-2">
                        <div className="p-2 bg-green-100 dark:bg-green-900/30 text-green-600 rounded-lg">
                            <MessageCircle size={18} />
                        </div>
                        <div>
                            <h3 className="font-bold text-sm">Enviar WhatsApp</h3>
                            <p className="text-[10px] text-zinc-500">{lead.name} • {lead.phone}</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-1 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors">
                        <X size={18} />
                    </button>
                </div>

                <div className="p-4">
                    <textarea
                        autoFocus
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        placeholder="Digite sua mensagem aqui..."
                        className="w-full h-32 p-3 text-sm rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all outline-none resize-none"
                    />

                    {!lead.phone && (
                        <p className="text-[10px] text-red-500 mt-2 font-medium">
                            ⚠️ Este lead não possui telefone cadastrado.
                        </p>
                    )}
                </div>

                <div className="p-4 bg-zinc-50 dark:bg-zinc-900/50 flex justify-end gap-3">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-xs font-bold text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-all"
                    >
                        Cancelar
                    </button>
                    <button
                        onClick={handleSend}
                        disabled={isSending || !message.trim() || !lead.phone}
                        className="flex items-center gap-2 px-6 py-2 bg-green-600 hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-black rounded-lg transition-all shadow-lg shadow-green-600/20"
                    >
                        {isSending ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
                        ENVIAR AGORA
                    </button>
                </div>
            </div>
        </div>
    );
}
