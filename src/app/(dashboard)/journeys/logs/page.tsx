import { createSupabaseServerClient } from "@/lib/supabase/server";
import { Clock, Activity, AlertCircle, CheckCircle2, Loader2, User, GitBranch } from "lucide-react";
import Link from "next/link";

export default async function JourneyLogsPage({ searchParams }: { searchParams: { enrollmentId?: string } }) {
    const supabase = await createSupabaseServerClient();

    let query = supabase
        .from('journey_step_logs')
        .select(`
            *,
            journey_enrollments!inner(
                id,
                lead_id,
                journey_id,
                leads(name, email),
                journeys(name)
            ),
            journey_steps(name, step_type)
        `)
        .order('created_at', { ascending: false })
        .limit(50);

    if (searchParams.enrollmentId) {
        query = query.eq('enrollment_id', searchParams.enrollmentId);
    }

    const { data: logs, error: logsErr } = await query;

    return (
        <div className="space-y-8 animate-fade-in p-2 lg:p-6 pb-20">
            <div className="flex items-center justify-between border-b dark:border-zinc-800 pb-6">
                <div>
                    <div className="flex items-center gap-2 mb-2">
                        <Activity className="text-brand-primary" size={16} />
                        <span className="text-[10px] font-black uppercase tracking-widest text-brand-primary">Engine Monitoring</span>
                    </div>
                    <h1 className="text-3xl font-black text-zinc-900 dark:text-zinc-100 uppercase tracking-tight">Logs de Execução</h1>
                    <p className="text-zinc-500 mt-2 text-sm font-medium">Histórico detalhado de disparos, condições e erros das jornadas.</p>
                </div>
                {searchParams.enrollmentId && (
                    <Link href="/journeys/logs" className="btn-secondary text-xs">
                        Ver todos os logs
                    </Link>
                )}
            </div>

            <div className="card overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="bg-zinc-50 dark:bg-zinc-900/50 border-b dark:border-zinc-800">
                                <th className="text-left px-6 py-4 text-[10px] font-black uppercase tracking-widest text-zinc-400">Status</th>
                                <th className="text-left px-6 py-4 text-[10px] font-black uppercase tracking-widest text-zinc-400">Lead / Jornada</th>
                                <th className="text-left px-6 py-4 text-[10px] font-black uppercase tracking-widest text-zinc-400">Passo Executado</th>
                                <th className="text-left px-6 py-4 text-[10px] font-black uppercase tracking-widest text-zinc-400">Horário</th>
                                <th className="text-right px-6 py-4 text-[10px] font-black uppercase tracking-widest text-zinc-400">Detalhes</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y dark:divide-zinc-800">
                            {(!logs || logs.length === 0) ? (
                                <tr><td colSpan={5} className="px-6 py-12 text-center text-zinc-400 italic">Nenhum log de execução encontrado.</td></tr>
                            ) : (
                                logs.map((log: any) => (
                                    <tr key={log.id} className="group hover:bg-zinc-50 dark:hover:bg-zinc-900/40 transition-colors">
                                        <td className="px-6 py-4">
                                            {log.status === 'completed' ? (
                                                <div className="flex items-center gap-2 text-emerald-500">
                                                    <CheckCircle2 size={16} />
                                                    <span className="text-[10px] font-black uppercase tracking-widest">Sucesso</span>
                                                </div>
                                            ) : log.status === 'failed' ? (
                                                <div className="flex items-center gap-2 text-rose-500">
                                                    <AlertCircle size={16} />
                                                    <span className="text-[10px] font-black uppercase tracking-widest">Falhou</span>
                                                </div>
                                            ) : log.status === 'skipped' ? (
                                                <div className="flex items-center gap-2 text-zinc-500">
                                                    <AlertCircle size={16} />
                                                    <span className="text-[10px] font-black uppercase tracking-widest">Cancelado</span>
                                                </div>
                                            ) : (
                                                <div className="flex items-center gap-2 text-amber-500">
                                                    <Loader2 size={16} className="animate-spin" />
                                                    <span className="text-[10px] font-black uppercase tracking-widest">{log.status}</span>
                                                </div>
                                            )}
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col">
                                                <div className="flex items-center gap-1.5 font-bold text-zinc-800 dark:text-zinc-200">
                                                    <User size={12} className="text-zinc-400" />
                                                    {log.journey_enrollments?.leads?.name}
                                                </div>
                                                <div className="flex items-center gap-1.5 text-[10px] text-zinc-400 font-bold uppercase tracking-tight mt-0.5">
                                                    <GitBranch size={10} />
                                                    {log.journey_enrollments?.journeys?.name}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col">
                                                <span className="font-bold text-zinc-700 dark:text-zinc-300">{log.journey_steps?.name}</span>
                                                <span className="text-[9px] font-black uppercase tracking-widest text-zinc-400 px-1.5 py-0.5 rounded border border-zinc-100 dark:border-zinc-800 w-fit mt-1">
                                                    {log.journey_steps?.step_type}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 font-medium text-zinc-500">
                                            <div className="flex items-center gap-1.5">
                                                <Clock size={12} />
                                                {new Date(log.created_at).toLocaleString()}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            {log.error_message ? (
                                                <span className="text-[10px] font-medium text-rose-500 bg-rose-50 dark:bg-rose-500/10 px-2 py-1 rounded-lg">
                                                    {log.error_message.substring(0, 40)}...
                                                </span>
                                            ) : log.result?.channel ? (
                                                <span className="text-[10px] font-medium text-brand-primary bg-brand-primary/5 px-2 py-1 rounded-lg">
                                                    Enviado via {log.result.channel}
                                                </span>
                                            ) : (
                                                <span className="text-[10px] text-zinc-400">N/A</span>
                                            )}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
