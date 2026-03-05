"use client";

interface SkeletonProps {
    className?: string;
    width?: string | number;
    height?: string | number;
    borderRadius?: string;
}

export function Skeleton({ className = "", width, height, borderRadius = "8px" }: SkeletonProps) {
    return (
        <div
            className={`animate-pulse ${className}`}
            style={{
                width,
                height,
                borderRadius,
                background: "linear-gradient(90deg, var(--surface-hover) 25%, var(--border-light) 50%, var(--surface-hover) 75%)",
                backgroundSize: "200% 100%",
                animation: "shimmer 1.5s infinite",
            }}
        />
    );
}

export function SkeletonCard() {
    return (
        <div className="card p-5 space-y-3">
            <Skeleton height={14} width="40%" />
            <Skeleton height={28} width="60%" />
            <Skeleton height={12} width="30%" />
        </div>
    );
}

export function SkeletonTable({ rows = 5 }: { rows?: number }) {
    return (
        <div className="card overflow-hidden">
            <div className="px-4 py-3" style={{ background: "var(--surface-hover)" }}>
                <Skeleton height={14} width="30%" />
            </div>
            {Array.from({ length: rows }).map((_, i) => (
                <div
                    key={i}
                    className="px-4 py-3 flex items-center gap-4"
                    style={{ borderBottom: "1px solid var(--border-light)" }}
                >
                    <Skeleton width={36} height={36} borderRadius="50%" />
                    <div className="flex-1 space-y-1.5">
                        <Skeleton height={14} width={`${50 + (i * 7) % 30}%`} />
                        <Skeleton height={10} width={`${30 + (i * 11) % 20}%`} />
                    </div>
                    <Skeleton height={24} width={60} borderRadius="9999px" />
                </div>
            ))}
        </div>
    );
}

export function SkeletonKPIs({ count = 4 }: { count?: number }) {
    return (
        <div className={`grid grid-cols-2 md:grid-cols-${count} gap-4`}>
            {Array.from({ length: count }).map((_, i) => (
                <SkeletonCard key={i} />
            ))}
        </div>
    );
}

export function SkeletonChat() {
    return (
        <div className="card overflow-hidden flex" style={{ height: 500 }}>
            <div className="w-80 border-r space-y-0" style={{ borderColor: "var(--border)" }}>
                <div className="p-3 border-b" style={{ borderColor: "var(--border)" }}>
                    <Skeleton height={36} borderRadius="8px" />
                </div>
                {Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} className="px-4 py-3 flex gap-3">
                        <Skeleton width={40} height={40} borderRadius="50%" />
                        <div className="flex-1 space-y-1.5">
                            <Skeleton height={14} width="60%" />
                            <Skeleton height={10} width="80%" />
                        </div>
                    </div>
                ))}
            </div>
            <div className="flex-1 p-6 flex flex-col items-center justify-center">
                <Skeleton width={120} height={120} borderRadius="50%" />
                <Skeleton height={14} width={200} className="mt-4" />
            </div>
        </div>
    );
}
