"use client";

import { useState, useEffect } from "react";
import { Search, SlidersHorizontal, X } from "lucide-react";
import type { Tag } from "@/types/database";

interface PipelineFiltersProps {
    tags: Tag[];
    onFiltersChange: (filters: PipelineFilterState) => void;
}

export interface PipelineFilterState {
    search: string;
    selectedTags: string[];
    scoreMin: number;
    scoreMax: number;
}

export function PipelineFilters({ tags, onFiltersChange }: PipelineFiltersProps) {
    const [search, setSearch] = useState("");
    const [selectedTags, setSelectedTags] = useState<string[]>([]);
    const [scoreMin, setScoreMin] = useState(0);
    const [scoreMax, setScoreMax] = useState(100);
    const [showAdvanced, setShowAdvanced] = useState(false);

    // Debounced search
    useEffect(() => {
        const timer = setTimeout(() => {
            onFiltersChange({ search, selectedTags, scoreMin, scoreMax });
        }, 300);
        return () => clearTimeout(timer);
    }, [search, selectedTags, scoreMin, scoreMax, onFiltersChange]);

    const toggleTag = (tagId: string) => {
        setSelectedTags((prev) =>
            prev.includes(tagId) ? prev.filter((t) => t !== tagId) : [...prev, tagId]
        );
    };

    const clearFilters = () => {
        setSearch("");
        setSelectedTags([]);
        setScoreMin(0);
        setScoreMax(100);
    };

    const hasActiveFilters = search || selectedTags.length > 0 || scoreMin > 0 || scoreMax < 100;

    return (
        <div className="space-y-3">
            {/* Search + Toggle */}
            <div className="flex gap-2">
                <div className="flex-1 relative">
                    <Search
                        size={16}
                        className="absolute left-3 top-1/2 -translate-y-1/2"
                        style={{ color: "var(--text-muted)" }}
                    />
                    <input
                        id="pipeline-search"
                        type="text"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Buscar por nome ou email..."
                        className="w-full pl-10 pr-4 py-2.5 rounded-lg border text-sm"
                        style={{
                            background: "var(--surface)",
                            borderColor: "var(--border)",
                            color: "var(--text-primary)",
                        }}
                    />
                </div>
                <button
                    id="btn-toggle-filters"
                    onClick={() => setShowAdvanced(!showAdvanced)}
                    className="px-3 py-2.5 rounded-lg border flex items-center gap-2 text-sm"
                    style={{
                        background: showAdvanced ? "var(--brand-primary)" : "var(--surface)",
                        color: showAdvanced ? "white" : "var(--text-secondary)",
                        borderColor: showAdvanced ? "var(--brand-primary)" : "var(--border)",
                    }}
                >
                    <SlidersHorizontal size={16} />
                    <span className="hidden md:inline">Filtros</span>
                </button>
                {hasActiveFilters && (
                    <button
                        onClick={clearFilters}
                        className="px-3 py-2.5 rounded-lg text-sm flex items-center gap-1"
                        style={{ color: "var(--color-error)" }}
                    >
                        <X size={14} />
                        <span className="hidden md:inline">Limpar</span>
                    </button>
                )}
            </div>

            {/* Advanced Filters Panel */}
            {showAdvanced && (
                <div className="card p-4 space-y-4 animate-fade-in">
                    {/* Tags */}
                    <div>
                        <label className="text-xs font-semibold mb-2 block" style={{ color: "var(--text-secondary)" }}>
                            Tags
                        </label>
                        <div className="flex flex-wrap gap-2">
                            {tags.map((tag) => {
                                const isActive = selectedTags.includes(tag.id);
                                return (
                                    <button
                                        key={tag.id}
                                        onClick={() => toggleTag(tag.id)}
                                        className="text-xs font-medium px-3 py-1.5 rounded-full transition-all"
                                        style={{
                                            background: isActive ? tag.color : `${tag.color}20`,
                                            color: isActive ? "white" : tag.color,
                                        }}
                                    >
                                        {tag.name}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Score range */}
                    <div>
                        <label className="text-xs font-semibold mb-2 block" style={{ color: "var(--text-secondary)" }}>
                            Lead Score: {scoreMin} — {scoreMax}
                        </label>
                        <div className="flex items-center gap-3">
                            <input
                                type="range"
                                min={0}
                                max={100}
                                value={scoreMin}
                                onChange={(e) => setScoreMin(Math.min(Number(e.target.value), scoreMax))}
                                className="flex-1 accent-indigo-500"
                            />
                            <input
                                type="range"
                                min={0}
                                max={100}
                                value={scoreMax}
                                onChange={(e) => setScoreMax(Math.max(Number(e.target.value), scoreMin))}
                                className="flex-1 accent-indigo-500"
                            />
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
