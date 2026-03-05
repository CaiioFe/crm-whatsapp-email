"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
    LayoutDashboard,
    Users,
    Mail,
    MessageCircle,
    GitBranch,
    BarChart3,
    Settings,
    Upload,
    Menu,
    X,
    Sun,
    Moon,
    ShieldCheck,
} from "lucide-react";
import { useState, useEffect } from "react";
import { useTheme } from "@/components/ui/ThemeProvider";
import { useSidebar } from "./SidebarContext";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { ChevronLeft, ChevronRight } from "lucide-react";

const NAV_ITEMS = [
    { href: "/", label: "Dashboard", icon: LayoutDashboard },
    { href: "/leads", label: "Leads", icon: Users },
    { href: "/leads/import", label: "Importar Leads", icon: Upload },
    { href: "/campaigns", label: "Campanhas", icon: Mail },
    { href: "/whatsapp", label: "WhatsApp", icon: MessageCircle },
    { href: "/journeys", label: "Jornadas", icon: GitBranch },
    { href: "/analytics", label: "Analytics", icon: BarChart3 },
    { href: "/settings", label: "Settings", icon: Settings },
];

export function Sidebar() {
    const pathname = usePathname();
    const [mobileOpen, setMobileOpen] = useState(false);
    const { isCollapsed, toggleSidebar } = useSidebar();
    const { theme, toggleTheme } = useTheme();
    const [profile, setProfile] = useState<{ display_name: string; role: string; tenant_name?: string } | null>(null);

    useEffect(() => {
        const loadProfile = async () => {
            const supabase = createSupabaseBrowserClient();
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const { data } = await supabase
                .from('user_profiles')
                .select('display_name, role, tenants(name)')
                .eq('user_id', user.id)
                .single();

            if (data) {
                setProfile({
                    display_name: data.display_name,
                    role: data.role,
                    tenant_name: (data.tenants as any)?.name
                });
            }
        };
        loadProfile();
    }, []);

    const navItems = [...NAV_ITEMS];
    if (profile?.role === 'admin') {
        navItems.push({ href: "/admin", label: "Admin", icon: ShieldCheck });
    }

    return (
        <>
            {/* Mobile toggle */}
            <button
                id="sidebar-toggle"
                onClick={() => setMobileOpen(!mobileOpen)}
                className="fixed top-4 left-4 z-50 p-2 rounded-lg md:hidden"
                style={{ background: "var(--brand-primary)", color: "white" }}
                aria-label="Toggle menu"
            >
                {mobileOpen ? <X size={20} /> : <Menu size={20} />}
            </button>

            {/* Overlay for mobile */}
            {mobileOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-30 md:hidden"
                    onClick={() => setMobileOpen(false)}
                />
            )}

            {/* Sidebar */}
            <aside
                className={`
          fixed top-0 left-0 h-full z-40 transition-all duration-300
          flex flex-col
          md:translate-x-0
          ${isCollapsed ? "w-20" : "w-64"}
          ${mobileOpen ? "translate-x-0" : "-translate-x-full"}
        `}
                style={{ background: "var(--sidebar-bg)" }}
            >
                {/* Collapse toggle (Desktop) */}
                <button
                    onClick={toggleSidebar}
                    className="hidden md:flex absolute -right-3 top-20 w-6 h-6 rounded-full bg-brand-primary text-white items-center justify-center shadow-lg hover:scale-110 transition-transform z-50 border-2 border-white/10"
                >
                    {isCollapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
                </button>
                {/* Logo */}
                <div className={`flex items-center gap-3 py-5 border-b border-white/10 transition-all ${isCollapsed ? "px-5" : "px-6"}`}>
                    <div
                        className="w-9 h-9 rounded-lg flex-shrink-0 flex items-center justify-center text-white font-bold text-sm"
                        style={{ background: "var(--brand-primary)" }}
                    >
                        CR
                    </div>
                    {!isCollapsed && (
                        <div className="animate-in fade-in slide-in-from-left-2">
                            <h1 className="text-white font-semibold text-sm">CRM Hub</h1>
                            <p className="text-xs" style={{ color: "var(--sidebar-text)" }}>
                                WhatsApp & Email
                            </p>
                        </div>
                    )}
                </div>

                {/* Navigation */}
                <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
                    {navItems.map((item) => {
                        const isActive =
                            item.href === "/"
                                ? pathname === "/"
                                : pathname.startsWith(item.href);
                        const Icon = item.icon;

                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                id={`nav-${item.label.toLowerCase().replace(/\s+/g, "-")}`}
                                onClick={() => setMobileOpen(false)}
                                title={isCollapsed ? item.label : ""}
                                className={`
                  flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium
                  transition-all duration-200 overflow-hidden
                `}
                                style={{
                                    color: isActive
                                        ? "var(--sidebar-text-active)"
                                        : "var(--sidebar-text)",
                                    background: isActive ? "var(--sidebar-active)" : "transparent",
                                }}
                                onMouseEnter={(e) => {
                                    if (!isActive)
                                        e.currentTarget.style.background = "var(--sidebar-hover)";
                                }}
                                onMouseLeave={(e) => {
                                    if (!isActive) e.currentTarget.style.background = "transparent";
                                }}
                            >
                                <Icon size={18} className="flex-shrink-0" />
                                {!isCollapsed && <span className="animate-in fade-in slide-in-from-left-2">{item.label}</span>}
                            </Link>
                        );
                    })}
                </nav>

                {/* Footer */}
                <div className="px-4 py-4 border-t border-white/10 space-y-3">
                    {/* Theme Toggle */}
                    <button
                        onClick={toggleTheme}
                        className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all overflow-hidden"
                        style={{ color: "var(--sidebar-text)" }}
                        onMouseEnter={(e) => e.currentTarget.style.background = "var(--sidebar-hover)"}
                        onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
                        id="theme-toggle"
                        title={isCollapsed ? "Trocar Tema" : ""}
                    >
                        {theme === "dark" ? <Sun size={16} className="flex-shrink-0" /> : <Moon size={16} className="flex-shrink-0" />}
                        {!isCollapsed && <span className="animate-in fade-in slide-in-from-left-2">{theme === "dark" ? "Modo Claro" : "Modo Escuro"}</span>}

                        {!isCollapsed && (
                            <div
                                className="ml-auto w-9 h-5 rounded-full relative transition-all animate-in fade-in"
                                style={{ background: theme === "dark" ? "var(--brand-primary)" : "rgba(255,255,255,0.2)" }}
                            >
                                <div
                                    className="absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all duration-300"
                                    style={{ left: theme === "dark" ? 18 : 2 }}
                                />
                            </div>
                        )}
                    </button>

                    {/* User */}
                    <div className="flex items-center gap-3 overflow-hidden">
                        <div className="w-8 h-8 rounded-full flex-shrink-0 bg-gradient-to-br from-brand-primary to-indigo-600 flex items-center justify-center text-white text-xs font-bold shadow-lg">
                            {profile?.display_name?.charAt(0) || "U"}
                        </div>
                        {!isCollapsed && (
                            <div className="animate-in fade-in slide-in-from-left-2">
                                <p className="text-white text-sm font-medium truncate">{profile?.display_name || "Carregando..."}</p>
                                <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: "var(--brand-primary)" }}>
                                    {profile?.role || "Aguardando"}
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            </aside>
        </>
    );
}
