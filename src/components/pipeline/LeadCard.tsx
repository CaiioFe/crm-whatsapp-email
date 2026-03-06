"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Mail, Phone, Clock, Flame, Shield, User, GitBranch, Zap } from "lucide-react";
import type { Lead, Tag } from "@/types/database";
import { useFeatureFlag } from "@/components/layout/FeatureFlagProvider";

interface LeadCardProps {
    lead: Lead & { tags: Tag[] };
    onClick?: () => void;
    isDragging?: boolean;
}

import { timeAgo, getInitials } from "@/lib/utils";

function getScoreTheme(score: number) {
    if (score >= 80) return { color: "#ff4d4d", label: "Hot", bg: "rgba(255, 77, 77, 0.15)" };
    if (score >= 40) return { color: "#ffaa00", label: "Warm", bg: "rgba(255, 170, 0, 0.15)" };
    return { color: "#94a3b8", label: "Cold", bg: "rgba(148, 163, 184, 0.15)" };
}

export function LeadCard({ lead, onClick }: LeadCardProps) {
    const isJourneyEnabled = useFeatureFlag('journey_engine');
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id: lead.id });

    const style = {
        transform: CSS.Translate.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
        zIndex: isDragging ? 100 : 1,
    };

    const scoreTheme = getScoreTheme(lead.lead_score);

    return (
        <div
            ref={setNodeRef}
            style={style}
            {...attributes}
            {...listeners}
            onClick={onClick}
            id={`lead-card-${lead.id}`}
            className={`
                group relative flex flex-col gap-3
                bg-[#161b22] hover:bg-[#1c2128]
                rounded-xl p-4 mb-3 cursor-grab active:cursor-grabbing 
                border border-white/[0.05] hover:border-brand-primary/50
                shadow-sm hover:shadow-xl
                transition-transform duration-150 select-none
                will-change-transform
                ${isDragging ? "shadow-2xl ring-1 ring-brand-primary/50 rotate-1 scale-[1.02] opacity-50 z-[100]" : ""}
            `}
            role="button"
            tabIndex={0}
        >
            {/* Header: Avatar + Identity + Score */}
            <div className="flex items-start justify-between">
                <div className="flex items-center gap-3 overflow-hidden">
                    <div
                        className="w-9 h-9 rounded-lg flex items-center justify-center text-[13px] font-bold shrink-0 border border-white/10"
                        style={{
                            background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
                            color: "white"
                        }}
                    >
                        {getInitials(lead.name)}
                    </div>
                    <div className="flex flex-col min-w-0 pr-1">
                        <h4 className="font-semibold text-[14px] leading-tight text-white group-hover:text-brand-primary transition-colors">
                            {lead.name}
                        </h4>
                        <div className="flex items-center flex-wrap gap-1.5 mt-1">
                            <span className="text-[10px] text-zinc-400 font-medium whitespace-normal">
                                {lead.company || "Individual"}
                            </span>
                            <span className="text-[10px] text-zinc-600 font-bold max-sm:hidden">•</span>
                            <span className="text-[10px] text-zinc-500 font-mono whitespace-nowrap">#{lead.id.substring(0, 4)}</span>
                        </div>
                    </div>
                </div>

                {/* Score Pill: Discreet but clear */}
                <div
                    className="px-2 py-0.5 rounded-full flex items-center gap-1.5 border border-white/5"
                    style={{ backgroundColor: scoreTheme.bg }}
                >
                    <div className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ backgroundColor: scoreTheme.color }} />
                    <span className="text-[10px] font-black tracking-widest text-white/90">
                        {lead.lead_score}
                    </span>
                </div>
            </div>

            {/* Content: Actions/Tags */}
            <div className="flex flex-wrap items-center gap-2">
                {lead.tags.slice(0, 2).map((tag) => (
                    <span
                        key={tag.id}
                        className="text-[9px] font-black px-1.5 py-0.5 rounded-md border uppercase tracking-wider"
                        style={{
                            backgroundColor: `${tag.color}15`,
                            color: tag.color,
                            borderColor: `${tag.color}30`
                        }}
                    >
                        {tag.name}
                    </span>
                ))}

                <div className="flex-1" />

                <div className="flex items-center gap-2">
                    {lead.email && <Mail size={12} className="text-zinc-500 hover:text-brand-primary cursor-pointer" onClick={(e) => e.stopPropagation()} />}
                    {lead.phone && <Phone size={12} className="text-zinc-500 hover:text-brand-primary cursor-pointer" onClick={(e) => e.stopPropagation()} />}
                    {isJourneyEnabled && (
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                (window as any).openEnrollModal?.(lead.id, lead.name);
                            }}
                            className="p-1 hover:bg-brand-primary/10 rounded-lg text-zinc-500 hover:text-brand-primary transition-colors"
                            title="Atribuir Jornada"
                        >
                            <Zap size={12} className="text-amber-500" />
                        </button>
                    )}
                </div>
            </div>

            {/* Footer: Timeline */}
            <div className="flex items-center justify-between pt-3 mt-1 border-t border-white/[0.03]">
                <div className="flex items-center gap-1.5 text-zinc-500 truncate">
                    <span className="text-[10px] font-medium uppercase tracking-tight">Status:</span>
                    <span className="text-[10px] font-bold text-zinc-300 uppercase tracking-widest" style={{ color: scoreTheme.color }}>
                        {scoreTheme.label}
                    </span>
                </div>

                <div className="flex items-center gap-1.5 text-zinc-500 group-hover:text-zinc-400 transition-colors shrink-0">
                    <Clock size={11} className="opacity-50" />
                    <span className="text-[10px] font-bold uppercase tracking-tight">
                        {timeAgo(lead.last_interaction_at)}
                    </span>
                </div>
            </div>

            {/* Subtle Hover Handle */}
            <div className="absolute top-1.5 right-1.5 opacity-0 group-hover:opacity-20 transition-opacity">
                <div className="grid grid-cols-2 gap-0.5 p-1">
                    {[1, 2, 3, 4].map((i) => (
                        <div key={i} className="w-0.5 h-0.5 bg-white rounded-full" />
                    ))}
                </div>
            </div>
        </div>
    );
}
