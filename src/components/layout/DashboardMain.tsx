"use client";

import { useSidebar } from "./SidebarContext";
import { ReactNode } from "react";

export function DashboardMain({ children }: { children: ReactNode }) {
    const { isCollapsed } = useSidebar();

    return (
        <main
            className={`min-h-screen transition-all duration-300 ${isCollapsed ? "md:ml-20" : "md:ml-64"}`}
        >
            <div className="p-4 md:p-8 pt-16 md:pt-8 max-w-7xl mx-auto">
                {children}
            </div>
        </main>
    );
}
