"use client";

import { useDroppable } from "@dnd-kit/core";
import {
    SortableContext,
    verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { LeadCard } from "./LeadCard";
import type { Lead, PipelineStage, Tag } from "@/types/database";
import { MoreHorizontal, Plus } from "lucide-react";

interface StageColumnProps {
    stage: PipelineStage;
    leads: (Lead & { tags: Tag[] })[];
    onLeadClick: (leadId: string) => void;
}

export function StageColumn({ stage, leads, onLeadClick }: StageColumnProps) {
    const { setNodeRef, isOver } = useDroppable({ id: stage.id });

    return (
        <div
            className="flex flex-col min-w-[270px] max-w-[270px] flex-shrink-0 h-full"
            id={`stage-column-${stage.id}`}
        >
            {/* Column Header */}
            <div className="flex items-center justify-between px-4 py-5 sticky top-0 bg-background z-10">
                <div className="flex items-center gap-3">
                    <div
                        className="w-1 h-5 rounded-full"
                        style={{ backgroundColor: stage.color || "#6366f1" }}
                    />
                    <div className="flex items-baseline gap-2">
                        <h3 className="font-black text-[13px] tracking-[0.1em] text-white uppercase">
                            {stage.name}
                        </h3>
                        <span className="text-[10px] font-bold text-zinc-500 tabular-nums">
                            {leads.length}
                        </span>
                    </div>
                </div>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button className="p-1 hover:bg-white/5 rounded transition-colors text-zinc-500">
                        <Plus size={16} />
                    </button>
                    <button className="p-1 hover:bg-white/5 rounded transition-colors text-zinc-500">
                        <MoreHorizontal size={16} />
                    </button>
                </div>
            </div>

            {/* Cards area */}
            <div
                ref={setNodeRef}
                className={`
                    flex-1 px-3 py-2 overflow-y-auto transition-all duration-300
                    ${isOver ? "bg-brand-primary/[0.03] backdrop-blur-sm" : "bg-transparent"}
                `}
                style={{
                    minHeight: "400px",
                }}
            >
                <SortableContext
                    items={leads.map((l) => l.id)}
                    strategy={verticalListSortingStrategy}
                >
                    <div className="flex flex-col gap-1">
                        {leads.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-48 border border-dashed border-white/[0.05] rounded-xl opacity-30">
                                <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500">
                                    Vazio
                                </p>
                            </div>
                        ) : (
                            leads.map((lead) => (
                                <LeadCard
                                    key={lead.id}
                                    lead={lead}
                                    onClick={() => onLeadClick(lead.id)}
                                />
                            ))
                        )}
                    </div>
                </SortableContext>
            </div>
        </div>
    );
}
