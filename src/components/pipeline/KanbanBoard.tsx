"use client";

import { useState, useMemo, useCallback } from "react";
import {
    DndContext,
    DragEndEvent,
    DragOverEvent,
    DragOverlay,
    DragStartEvent,
    PointerSensor,
    useSensor,
    useSensors,
    closestCorners,
    rectIntersection,
} from "@dnd-kit/core";
import { StageColumn } from "./StageColumn";
import { LeadCard } from "./LeadCard";
import type { Lead, PipelineStage, Tag } from "@/types/database";

interface KanbanBoardProps {
    stages: PipelineStage[];
    leads: (Lead & { tags: Tag[] })[];
    onLeadMoved: (leadId: string, fromStageId: string, toStageId: string) => void;
    onLeadClick: (leadId: string) => void;
}

export function KanbanBoard({ stages, leads, onLeadMoved, onLeadClick }: KanbanBoardProps) {
    const [activeId, setActiveId] = useState<string | null>(null);

    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: { distance: 5 },
        })
    );

    const activeLead = activeId
        ? leads.find((l) => l.id === activeId)
        : null;

    const leadsByStage = useMemo(() => {
        const map = new Map<string, (Lead & { tags: Tag[] })[]>();
        for (const stage of stages) {
            map.set(stage.id, []);
        }
        for (const lead of leads) {
            const stageLeads = map.get(lead.current_stage_id || "");
            if (stageLeads) {
                stageLeads.push(lead);
            }
        }
        return map;
    }, [leads, stages]);

    const handleDragStart = useCallback((event: DragStartEvent) => {
        setActiveId(event.active.id as string);
    }, []);

    const handleDragEnd = useCallback(
        (event: DragEndEvent) => {
            const { active, over } = event;
            setActiveId(null);

            if (!over) return;

            const activeLeadId = active.id as string;
            const overId = over.id as string;

            const lead = leads.find((l) => l.id === activeLeadId);
            if (!lead) return;

            let targetStageId: string | null = null;
            const isStage = stages.some((s) => s.id === overId);

            if (isStage) {
                targetStageId = overId;
            } else {
                const overLead = leads.find((l) => l.id === overId);
                targetStageId = overLead?.current_stage_id || null;
            }

            if (targetStageId && targetStageId !== lead.current_stage_id) {
                onLeadMoved(activeLeadId, lead.current_stage_id || "", targetStageId);
            }
        },
        [leads, stages, onLeadMoved]
    );

    return (
        <DndContext
            sensors={sensors}
            collisionDetection={rectIntersection}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
        >
            <div
                className="flex gap-4 overflow-x-auto pb-6 custom-scrollbar"
                style={{ height: "calc(100vh - 220px)" }}
            >
                {stages
                    .sort((a, b) => a.position - b.position)
                    .map((stage) => (
                        <StageColumn
                            key={stage.id}
                            stage={stage}
                            leads={leadsByStage.get(stage.id) || []}
                            onLeadClick={onLeadClick}
                        />
                    ))}
            </div>

            {/* Drag Overlay */}
            <DragOverlay dropAnimation={null} style={{ pointerEvents: 'none' }}>
                {activeLead ? (
                    <div className="opacity-80 scale-[1.03]">
                        <LeadCard lead={activeLead} isDragging />
                    </div>
                ) : null}
            </DragOverlay>
        </DndContext>
    );
}
