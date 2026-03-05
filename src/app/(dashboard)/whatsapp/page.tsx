"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import {
    Search,
    MessageCircle,
    User,
    Send,
    MoreVertical,
    Check,
    CheckCheck,
    Phone,
    Plus,
    Loader2,
} from "lucide-react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "react-hot-toast";

export default function WhatsAppInbox() {
    const supabase = createSupabaseBrowserClient();
    const [conversations, setConversations] = useState<any[]>([]);
    const [selectedConvo, setSelectedConvo] = useState<any>(null);
    const [messages, setMessages] = useState<any[]>([]);
    const [newMessage, setNewMessage] = useState("");
    const [isSending, setIsSending] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Load Conversations
    const loadConversations = async () => {
        const { data, error } = await supabase
            .from('whatsapp_conversations')
            .select('*')
            .order('last_message_at', { ascending: false });

        if (data) setConversations(data);
        setIsLoading(false);
    };

    // Load Messages for selected conversation
    const loadMessages = async (convoId: string) => {
        const { data, error } = await supabase
            .from('whatsapp_messages')
            .select('*')
            .eq('conversation_id', convoId)
            .order('created_at', { ascending: true });

        if (data) setMessages(data);

        // Mark as read
        await supabase.from('whatsapp_conversations').update({ unread_count: 0 }).eq('id', convoId);
    };

    useEffect(() => {
        loadConversations();
    }, []);

    useEffect(() => {
        if (selectedConvo) {
            loadMessages(selectedConvo.id);

            // Subscribe to new messages
            const channel = supabase
                .channel(`convo-${selectedConvo.id}`)
                .on(
                    'postgres_changes',
                    { event: 'INSERT', schema: 'public', table: 'whatsapp_messages', filter: `conversation_id=eq.${selectedConvo.id}` },
                    (payload) => {
                        setMessages((prev) => [...prev, payload.new]);
                    }
                )
                .subscribe();

            return () => {
                supabase.removeChannel(channel);
            };
        } else {
            setMessages([]);
        }
    }, [selectedConvo]);

    // Auto-scroll to bottom
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    const handleSendMessage = async () => {
        if (!newMessage.trim() || !selectedConvo || isSending) return;

        setIsSending(true);
        try {
            const res = await fetch("/api/whatsapp/evolution/send-message", {
                method: "POST",
                body: JSON.stringify({
                    number: selectedConvo.phone,
                    text: newMessage
                })
            });

            if (res.ok) {
                setNewMessage("");
            } else {
                const data = await res.json();
                toast.error(data.error || "Erro ao enviar");
            }
        } catch (err) {
            toast.error("Erro de conexão");
        } finally {
            setIsSending(false);
        }
    };

    const filteredConversations = useMemo(() => {
        return conversations.filter(c =>
            (c.lead_name || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
            (c.phone || "").includes(searchTerm)
        );
    }, [conversations, searchTerm]);

    return (
        <div className="flex h-[calc(100vh-120px)] overflow-hidden card border-none shadow-xl rounded-2xl animate-fade-in bg-white dark:bg-[#0d1117]">
            {/* Conversations Sidebar */}
            <div className="w-full md:w-80 border-r border-zinc-100 dark:border-zinc-800 flex flex-col">
                <div className="p-4 border-b border-zinc-100 dark:border-zinc-800">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="font-bold text-lg">Mensagens</h2>
                        <button className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors">
                            <Plus size={20} />
                        </button>
                    </div>
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={16} />
                        <input
                            placeholder="Buscar conversa..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 rounded-xl border border-zinc-100 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 focus:ring-2 focus:ring-brand-primary/20 outline-none text-sm transition-all"
                        />
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto custom-scrollbar">
                    {isLoading ? (
                        <div className="flex justify-center p-8"><Loader2 className="animate-spin text-zinc-300" /></div>
                    ) : filteredConversations.length === 0 ? (
                        <div className="p-8 text-center text-zinc-400 text-sm italic">Nenhuma conversa encontrada</div>
                    ) : (
                        filteredConversations.map(convo => (
                            <button
                                key={convo.id}
                                onClick={() => setSelectedConvo(convo)}
                                className={`w-full p-4 flex gap-3 text-left transition-all border-b border-zinc-50 dark:border-zinc-900/50 hover:bg-zinc-50 dark:hover:bg-zinc-900/30 ${selectedConvo?.id === convo.id ? "bg-zinc-50 dark:bg-zinc-900 border-l-4 border-l-brand-primary" : "border-l-4 border-l-transparent"}`}
                            >
                                <div className="w-12 h-12 rounded-full bg-zinc-200 dark:bg-zinc-800 flex items-center justify-center shrink-0">
                                    <User size={20} className="text-zinc-400" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center justify-between mb-0.5">
                                        <h3 className="font-bold text-sm truncate">{convo.lead_name || convo.phone}</h3>
                                        <span className="text-[10px] text-zinc-400">
                                            {convo.last_message_at ? format(new Date(convo.last_message_at), 'HH:mm') : ''}
                                        </span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <p className="text-xs text-zinc-500 truncate">{convo.last_message_text || "Inicie uma conversa..."}</p>
                                        {convo.unread_count > 0 && (
                                            <span className="w-5 h-5 rounded-full bg-brand-primary text-white text-[10px] flex items-center justify-center font-bold">
                                                {convo.unread_count}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </button>
                        ))
                    )}
                </div>
            </div>

            {/* Chat Area */}
            {selectedConvo ? (
                <div className="flex-1 flex flex-col bg-[#f0f2f5] dark:bg-[#0b141a]/10 relative">
                    {/* Header */}
                    <div className="p-4 bg-white dark:bg-[#161b22] border-b dark:border-zinc-800 flex items-center justify-between z-10">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-zinc-200 dark:bg-zinc-800 flex items-center justify-center">
                                <User size={18} className="text-zinc-500" />
                            </div>
                            <div>
                                <h3 className="font-bold text-sm">{selectedConvo.lead_name || selectedConvo.phone}</h3>
                                <p className="text-[10px] text-green-500 font-bold uppercase tracking-widest">Online</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <button className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg"><Phone size={18} /></button>
                            <button className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg"><MoreVertical size={18} /></button>
                        </div>
                    </div>

                    {/* Messages */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
                        {messages.map((msg, idx) => {
                            const isMe = msg.direction === 'outbound';
                            const showTime = idx === 0 || format(new Date(messages[idx - 1].created_at), 'yyyy-MM-dd') !== format(new Date(msg.created_at), 'yyyy-MM-dd');

                            return (
                                <div key={msg.id} className="space-y-4">
                                    {showTime && (
                                        <div className="flex justify-center my-4">
                                            <span className="px-3 py-1 rounded-lg bg-white/80 dark:bg-zinc-800/80 text-[10px] font-bold text-zinc-500 uppercase tracking-widest backdrop-blur-sm">
                                                {format(new Date(msg.created_at), "d 'de' MMMM", { locale: ptBR })}
                                            </span>
                                        </div>
                                    )}
                                    <div className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                                        <div className={`max-w-[75%] px-3 py-2 rounded-2xl relative shadow-sm ${isMe ? 'bg-indigo-600 text-white rounded-tr-none' : 'bg-white dark:bg-[#202c33] dark:text-gray-200 rounded-tl-none'}`}>
                                            <p className="text-sm whitespace-pre-wrap">{msg.body}</p>
                                            <div className="flex items-center justify-end gap-1 mt-1">
                                                <span className={`text-[9px] ${isMe ? 'text-indigo-100' : 'text-zinc-400'}`}>
                                                    {format(new Date(msg.created_at), 'HH:mm')}
                                                </span>
                                                {isMe && (
                                                    <CheckCheck size={12} className="text-indigo-200" />
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                        <div ref={messagesEndRef} />
                    </div>

                    {/* Input Area */}
                    <div className="p-4 bg-white dark:bg-[#161b22] border-t dark:border-zinc-800">
                        <div className="flex items-end gap-3 max-w-4xl mx-auto">
                            <div className="flex-1 relative">
                                <textarea
                                    rows={1}
                                    value={newMessage}
                                    onChange={(e) => setNewMessage(e.target.value)}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter' && !e.shiftKey) {
                                            e.preventDefault();
                                            handleSendMessage();
                                        }
                                    }}
                                    placeholder="Digite uma mensagem..."
                                    className="w-full pl-4 pr-12 py-3 rounded-2xl bg-zinc-50 dark:bg-zinc-900 border border-transparent focus:border-brand-primary/30 outline-none text-sm resize-none transition-all scrollbar-hide"
                                />
                            </div>
                            <button
                                onClick={handleSendMessage}
                                disabled={!newMessage.trim() || isSending}
                                className="w-11 h-11 flex items-center justify-center rounded-full bg-brand-primary text-white shadow-lg shadow-brand-primary/25 hover:scale-105 active:scale-95 transition-all disabled:opacity-50 disabled:grayscale"
                            >
                                {isSending ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
                            </button>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="flex-1 hidden md:flex flex-col items-center justify-center bg-zinc-50 dark:bg-[#0b141a]/5 text-center p-12">
                    <div className="w-20 h-20 rounded-full bg-brand-primary/10 flex items-center justify-center mb-6 text-brand-primary animate-pulse">
                        <MessageCircle size={32} />
                    </div>
                    <h2 className="text-xl font-black mb-2 tracking-tight">Seu Inbox de WhatsApp</h2>
                    <p className="text-sm text-zinc-500 max-w-xs mx-auto">Selecione uma conversa ao lado para começar a interagir com seus leads em tempo real.</p>
                </div>
            )}
        </div>
    );
}
