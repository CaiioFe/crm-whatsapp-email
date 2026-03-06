import { LucideIcon } from "lucide-react";

export function AdminStatCard({ label, value, icon: Icon, color }: { label: string, value: string | number, icon: LucideIcon, color: string }) {
    const colors: Record<string, string> = {
        blue: "text-blue-500 bg-blue-50",
        indigo: "text-indigo-500 bg-indigo-50",
        purple: "text-purple-500 bg-purple-50",
        emerald: "text-emerald-500 bg-emerald-50",
    };

    return (
        <div className="card p-5 group hover:border-brand-primary/20 transition-all border-2 border-transparent">
            <div className="flex items-center justify-between mb-4">
                <div className={`p-2 rounded-xl transition-transform group-hover:scale-110 ${colors[color]}`}>
                    <Icon size={18} />
                </div>
                <div className="w-1.5 h-1.5 rounded-full bg-zinc-200 group-hover:bg-brand-primary transition-colors" />
            </div>
            <div className="space-y-1">
                <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400">{label}</span>
                <p className="text-2xl font-black text-zinc-800 group-hover:text-zinc-900">{value}</p>
            </div>
        </div>
    );
}
