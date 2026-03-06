"use client";

import { useState } from "react";
import { Users, UserPlus, Settings, ShieldCheck, Check, Loader2, ChevronDown } from "lucide-react";
import { useToast } from "@/components/ui/Toast";

interface AdminUserListProps {
    initialMembers: any[];
    currentUserId?: string;
}

export function AdminUserList({ initialMembers, currentUserId }: AdminUserListProps) {
    const [members, setMembers] = useState(initialMembers);
    const [updatingId, setUpdatingId] = useState<string | null>(null);
    const toast = useToast();

    const handleRoleUpdate = async (userId: string, newRole: string) => {
        setUpdatingId(userId);
        try {
            const res = await fetch("/api/admin/users/update-role", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ userId, role: newRole }),
            });

            if (!res.ok) throw new Error("Falha ao atualizar");

            setMembers(prev => prev.map(m => m.user_id === userId ? { ...m, role: newRole } : m));
            toast.success("Sucesso", `Cargo atualizado para ${newRole}`);
        } catch (err) {
            toast.error("Erro", "Não foi possível alterar a permissão.");
        } finally {
            setUpdatingId(null);
        }
    };

    return (
        <div className="lg:col-span-2 card p-6 space-y-6">
            <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800 pb-4">
                <div className="flex items-center gap-3">
                    <Users size={18} className="text-zinc-400" />
                    <h2 className="font-bold text-lg">Usuários e Permissões</h2>
                </div>
                <button className="flex items-center gap-2 text-xs font-bold text-brand-primary hover:bg-brand-primary/5 px-3 py-1.5 rounded-lg transition-colors border border-transparent hover:border-brand-primary/20">
                    <UserPlus size={14} />
                    Convidar Novo
                </button>
            </div>

            <div className="space-y-1">
                {members?.map(member => (
                    <div key={member.id} className="flex items-center justify-between p-3 rounded-xl hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-colors border border-transparent hover:border-zinc-100 dark:hover:border-zinc-800 group">
                        <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center font-bold text-zinc-400 group-hover:bg-brand-primary/10 group-hover:text-brand-primary transition-colors">
                                {member.display_name?.charAt(0) || 'U'}
                            </div>
                            <div>
                                <p className="font-bold text-sm text-zinc-800 dark:text-zinc-100">{member.display_name}</p>
                                <div className="flex items-center gap-2">
                                    <span className={`text-[10px] font-black uppercase tracking-widest ${member.role === 'admin' ? 'text-brand-primary' : 'text-zinc-400'
                                        }`}>
                                        {member.role}
                                    </span>
                                    {member.role === 'admin' && <ShieldCheck size={10} className="text-brand-primary" />}
                                    {member.user_id === currentUserId && <span className="text-[9px] font-bold text-zinc-400 border px-1.5 rounded bg-zinc-50 dark:bg-zinc-800 uppercase tracking-tighter">Você</span>}
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center gap-2">
                            {updatingId === member.user_id ? (
                                <Loader2 size={16} className="animate-spin text-brand-primary" />
                            ) : (
                                <div className="relative group/role">
                                    <select
                                        value={member.role}
                                        disabled={member.user_id === currentUserId} // Don't let user demote themselves easily without warning
                                        onChange={(e) => handleRoleUpdate(member.user_id, e.target.value)}
                                        className="appearance-none bg-transparent text-[10px] font-black uppercase tracking-widest text-zinc-400 hover:text-brand-primary cursor-pointer outline-none pl-2 pr-6 py-1 rounded-lg border border-transparent hover:border-zinc-200 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        <option value="viewer">Viewer</option>
                                        <option value="operator">Operator</option>
                                        <option value="manager">Manager</option>
                                        <option value="admin">Admin</option>
                                    </select>
                                    <ChevronDown size={10} className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-zinc-300" />
                                </div>
                            )}
                            <button className="p-2 text-zinc-400 hover:text-brand-primary rounded-lg hover:bg-white dark:hover:bg-zinc-800 transition-all shadow-sm opacity-0 group-hover:opacity-100">
                                <Settings size={14} />
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
