import { LucideIcon } from "lucide-react";

interface DashboardStatCardProps {
    label: string;
    value: string | number;
    icon: LucideIcon;
    change?: string;
    trend?: 'up' | 'down' | 'neutral';
    color: string;
    description?: string;
}

export function DashboardStatCard({ label, value, icon: Icon, change, trend, color, description }: DashboardStatCardProps) {
    const trendColor = trend === 'up' ? 'text-emerald-500' : trend === 'down' ? 'text-rose-500' : 'text-zinc-400';

    return (
        <div className="card p-6 group hover:border-brand-primary/20 transition-all border-2 border-transparent relative overflow-hidden">
            <div className="flex items-center justify-between mb-4">
                <div className="p-2.5 rounded-2xl bg-zinc-50 dark:bg-zinc-900 group-hover:scale-110 transition-transform" style={{ color }}>
                    <Icon size={22} />
                </div>
                {change && (
                    <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded-full bg-zinc-50 dark:bg-zinc-900 ${trendColor}`}>
                        {change}
                    </span>
                )}
            </div>

            <div className="space-y-1 relative z-10">
                <p className="text-3xl font-black text-zinc-900 dark:text-zinc-100 tracking-tight">{value}</p>
                <div>
                    <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400">{label}</span>
                    {description && <p className="text-[11px] text-zinc-500 font-medium leading-tight mt-1">{description}</p>}
                </div>
            </div>

            {/* Subtle background decoration */}
            <div className="absolute -right-4 -bottom-4 opacity-[0.03] group-hover:opacity-[0.06] transition-opacity">
                <Icon size={120} />
            </div>
        </div>
    );
}
