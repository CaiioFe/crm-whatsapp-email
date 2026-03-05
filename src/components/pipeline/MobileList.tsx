"use client";

import { useState, useRef, TouchEvent } from "react";
import {
    ChevronDown,
    ChevronRight,
    ArrowLeft,
    ArrowRight,
} from "lucide-react";
import type { Lead, PipelineStage, Tag } from "@/types/database";

interface MobileListProps {
    stages: PipelineStage[];
    leads: (Lead & { tags: Tag[] })[];
    onLeadClick: (leadId: string) => void;
    onSwipeMove: (leadId: string, direction: "left" | "right") => void;
}

function timeAgo(dateStr: string | null): string {
    if (!dateStr) return "—";
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `${mins}min`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h`;
    const days = Math.floor(hours / 24);
    if (days < 30) return `${days}d`;
    return `${Math.floor(days / 30)}m`;
}

function scoreColor(score: number): string {
    if (score >= 71) return "#22c55e";
    if (score >= 31) return "#f59e0b";
    return "#94a3b8";
}

export function MobileList({ stages, leads, onLeadClick, onSwipeMove }: MobileListProps) {
    const [collapsed, setCollapsed] = useState<Set<string>>(new Set());
    const touchStart = useRef<{ x: number; leadId: string } | null>(null);

    const toggleCollapse = (stageId: string) => {
        setCollapsed((prev) => {
            const next = new Set(prev);
            if (next.has(stageId)) next.delete(stageId);
            else next.add(stageId);
            return next;
        });
    };

    const handleTouchStart = (e: TouchEvent, leadId: string) => {
        touchStart.current = { x: e.touches[0].clientX, leadId };
    };

    const handleTouchEnd = (e: TouchEvent) => {
        if (!touchStart.current) return;
        const deltaX = e.changedTouches[0].clientX - touchStart.current.x;
        const MIN_SWIPE = 80;
        if (Math.abs(deltaX) >= MIN_SWIPE) {
            onSwipeMove(
                touchStart.current.leadId,
                deltaX > 0 ? "right" : "left"
            );
        }
        touchStart.current = null;
    };

    const sortedStages = [...stages].sort((a, b) => a.position - b.position);

    return (
        <div className="space-y-3">
            {sortedStages.map((stage) => {
                const stageLeads = leads.filter(
                    (l) => l.current_stage_id === stage.id
                );
                const isCollapsed = collapsed.has(stage.id);

                return (
                    <div key={stage.id} className="card overflow-hidden">
                        {/* Stage Header */}
                        <button
                            onClick={() => toggleCollapse(stage.id)}
                            className="w-full flex items-center justify-between px-4 py-3"
                            style={{ background: `${stage.color}10` }}
                        >
                            <div className="flex items-center gap-2">
                                {isCollapsed ? (
                                    <ChevronRight size={16} style={{ color: stage.color }} />
                                ) : (
                                    <ChevronDown size={16} style={{ color: stage.color }} />
                                )}
                                <div
                                    className="w-2.5 h-2.5 rounded-full"
                                    style={{ background: stage.color }}
                                />
                                <span className="font-semibold text-sm" style={{ color: "var(--text-primary)" }}>
                                    {stage.name}
                                </span>
                            </div>
                            <span
                                className="text-xs font-bold px-2 py-0.5 rounded-full"
                                style={{ background: `${stage.color}20`, color: stage.color }}
                            >
                                {stageLeads.length}
                            </span>
                        </button>

                        {/* Leads */}
                        {!isCollapsed && (
                            <div className="divide-y" style={{ borderColor: "var(--border-light)" }}>
                                {stageLeads.length === 0 ? (
                                    <p
                                        className="text-xs text-center py-6"
                                        style={{ color: "var(--text-muted)" }}
                                    >
                                        Nenhum lead
                                    </p>
                                ) : (
                                    stageLeads.map((lead) => (
                                        <div
                                            key={lead.id}
                                            className="px-4 py-3 relative"
                                            style={{ background: "var(--surface)" }}
                                            onTouchStart={(e) => handleTouchStart(e, lead.id)}
                                            onTouchEnd={handleTouchEnd}
                                            onClick={() => onLeadClick(lead.id)}
                                        >
                                            {/* Swipe hints */}
                                            <div className="absolute inset-y-0 left-0 w-8 flex items-center justify-center opacity-20">
                                                <ArrowLeft size={14} />
                                            </div>
                                            <div className="absolute inset-y-0 right-0 w-8 flex items-center justify-center opacity-20">
                                                <ArrowRight size={14} />
                                            </div>

                                            <div className="flex items-center justify-between">
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <span className="font-semibold text-sm truncate" style={{ color: "var(--text-primary)" }}>
                                                            {lead.name}
                                                        </span>
                                                        <span
                                                            className="text-[10px] font-bold px-1.5 py-0.5 rounded-full flex-shrink-0"
                                                            style={{
                                                                background: `${scoreColor(lead.lead_score)}20`,
                                                                color: scoreColor(lead.lead_score),
                                                            }}
                                                        >
                                                            {lead.lead_score}
                                                        </span>
                                                    </div>
                                                    {lead.company && (
                                                        <p className="text-xs truncate" style={{ color: "var(--text-secondary)" }}>
                                                            {lead.company}
                                                        </p>
                                                    )}
                                                    <div className="flex gap-1 mt-1.5">
                                                        {lead.tags.slice(0, 2).map((tag) => (
                                                            <span
                                                                key={tag.id}
                                                                className="text-[9px] font-medium px-1.5 py-0.5 rounded-full"
                                                                style={{ background: `${tag.color}20`, color: tag.color }}
                                                            >
                                                                {tag.name}
                                                            </span>
                                                        ))}
                                                    </div>
                                                </div>
                                                <span className="text-[10px] flex-shrink-0 ml-2" style={{ color: "var(--text-muted)" }}>
                                                    {timeAgo(lead.last_interaction_at)}
                                                </span>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        )}
                    </div>
                );
            })}
        </div>
    );
}
