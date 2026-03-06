"use client";

import { ToastProvider } from "@/components/ui/Toast";
import { ThemeProvider } from "@/components/ui/ThemeProvider";
import type { ReactNode } from "react";

import { FeatureFlagProvider } from "@/components/layout/FeatureFlagProvider";

export function Providers({ children }: { children: ReactNode }) {
    return (
        <ThemeProvider>
            <FeatureFlagProvider>
                <ToastProvider>
                    {children}
                </ToastProvider>
            </FeatureFlagProvider>
        </ThemeProvider>
    );
}
