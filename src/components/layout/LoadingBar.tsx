"use client";

import { useEffect, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";

export function LoadingBar() {
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        setLoading(true);
        const timeout = setTimeout(() => setLoading(false), 500);
        return () => clearTimeout(timeout);
    }, [pathname, searchParams]);

    if (!loading) return null;

    return (
        <div className="fixed top-0 left-0 right-0 z-[9999] h-0.5 bg-brand-primary overflow-hidden shadow-[0_0_10px_rgba(99,102,241,0.5)]">
            <div className="h-full w-full bg-white/30 animate-pulse origin-left scale-x-0 animate-[shimmer_1s_infinite_linear]" />
            <style jsx>{`
        @keyframes shimmer {
          0% { transform: scaleX(0); }
          50% { transform: scaleX(0.7); }
          100% { transform: scaleX(1); opacity: 0; }
        }
      `}</style>
        </div>
    );
}
