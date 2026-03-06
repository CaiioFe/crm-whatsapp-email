import { Suspense } from "react";
import {
    Users,
    Settings,
    ShieldCheck,
    Activity,
    CreditCard,
    ChevronRight,
    LayoutDashboard
} from "lucide-react";
import Link from "next/link";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { requirePermission } from "@/lib/rbac";
import { AdminUserList } from "@/components/admin/AdminUserList";
import { AdminStatCard } from "@/components/admin/AdminStatCard";

export default async function AdminDashboardPage() {
    // 🛡️ RBAC Enforcement
    try {
        await requirePermission('settings.view');
    } catch {
        redirect('/');
    }

    const supabase = await createSupabaseServerClient();

    // Fetch Tenant Info
    const { data: { user } } = await supabase.auth.getUser();
    const { data: profile } = await supabase
        .from('user_profiles')
        .select('tenant_id, tenants(*)')
        .eq('user_id', user?.id)
        .single();

    const tenant = (profile as any)?.tenants;

    // Fetch Team Members
    const { data: members } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('tenant_id', profile?.tenant_id);

    // Fetch Basic Metrics
    const { count: leadCount } = await supabase
        .from('leads')
        .select('*', { count: 'exact', head: true })
        .eq('tenant_id', profile?.tenant_id);

    const { count: journeyCount } = await supabase
        .from('journeys')
        .select('*', { count: 'exact', head: true })
        .eq('tenant_id', profile?.tenant_id);

    return (
        <div className="space-y-8 animate-fade-in p-2 lg:p-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <div className="flex items-center gap-2 mb-2">
                        <ShieldCheck className="text-brand-primary" size={20} />
                        <span className="text-[10px] font-black uppercase tracking-widest text-brand-primary">Admin Control Center</span>
                    </div>
                    <h1 className="text-3xl font-black text-zinc-900 leading-none">Configurações do Workspace</h1>
                    <p className="text-zinc-500 mt-2 text-sm font-medium">Gerencie seu time, integrações e dados globais do {tenant?.name}.</p>
                </div>
                <div className="flex items-center gap-3">
                    <div className="px-4 py-2 rounded-xl bg-brand-primary/10 border border-brand-primary/20 text-brand-primary text-xs font-bold">
                        Plano {tenant?.plan?.toUpperCase()}
                    </div>
                </div>
            </div>

            {/* Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <AdminStatCard
                    label="Membros do Time"
                    value={members?.length || 0}
                    icon={Users}
                    color="blue"
                />
                <AdminStatCard
                    label="Leads Protegidos"
                    value={leadCount || 0}
                    icon={LayoutDashboard}
                    color="indigo"
                />
                <AdminStatCard
                    label="Jornadas Ativas"
                    value={journeyCount || 0}
                    icon={Activity}
                    color="purple"
                />
                <AdminStatCard
                    label="Uso de API"
                    value="92%"
                    icon={Settings}
                    color="emerald"
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Users List (Client Component) */}
                <AdminUserList initialMembers={members || []} currentUserId={user?.id} />

                {/* Sidebar Cards */}
                <div className="space-y-6">
                    {/* Subscription Card */}
                    <div className="bg-zinc-900 rounded-3xl p-6 text-white relative overflow-hidden shadow-2xl">
                        <div className="relative z-10 space-y-4">
                            <div className="flex items-center gap-2 text-zinc-400">
                                <CreditCard size={14} />
                                <span className="text-[10px] font-black uppercase tracking-widest">Faturamento</span>
                            </div>
                            <h3 className="text-xl font-bold">Assinante {tenant?.plan?.toUpperCase()}</h3>
                            <p className="text-xs text-zinc-400 leading-relaxed">Sua conta tem acesso a todas as automações e integrações WhatsApp.</p>
                            <button className="w-full py-3 rounded-xl bg-white text-zinc-900 text-xs font-black uppercase tracking-widest hover:bg-zinc-200 transition-colors">
                                Gerenciar Plano
                            </button>
                        </div>
                        <div className="absolute -right-4 -bottom-4 opacity-10">
                            <CreditCard size={120} />
                        </div>
                    </div>

                    {/* Technical Config */}
                    <div className="card p-6 space-y-4">
                        <div className="flex items-center gap-2 text-zinc-400 border-b border-zinc-100 pb-3 mb-2">
                            <Settings size={14} />
                            <span className="text-[10px] font-black uppercase tracking-widest">Configuração Técnica</span>
                        </div>
                        <div className="space-y-3">
                            <div className="flex flex-col">
                                <span className="text-[10px] font-bold text-zinc-400 uppercase">Slug do Workspace</span>
                                <span className="text-sm font-bold text-zinc-800">{tenant?.slug}</span>
                            </div>
                            <div className="flex flex-col">
                                <span className="text-[10px] font-bold text-zinc-400 uppercase">ID do Tenant</span>
                                <span className="text-[10px] font-mono text-zinc-400 break-all">{tenant?.id}</span>
                            </div>
                            <Link
                                href="/settings"
                                className="flex items-center justify-between p-3 rounded-xl border border-zinc-100 hover:border-brand-primary/30 hover:bg-brand-primary/5 transition-all group"
                            >
                                <span className="text-xs font-bold text-zinc-600 group-hover:text-brand-primary">Configurações de Integração</span>
                                <ChevronRight size={14} className="text-zinc-400 group-hover:text-brand-primary" />
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

