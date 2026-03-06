"use client";

import React, { createContext, useContext, useEffect, useState } from 'react';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';

const FeatureFlagContext = createContext<Record<string, boolean>>({});

export function useFeatureFlags() {
    return useContext(FeatureFlagContext);
}

export function useFeatureFlag(key: string): boolean {
    const flags = useFeatureFlags();
    return !!flags[key];
}

export function FeatureFlagProvider({ children }: { children: React.ReactNode }) {
    const [flags, setFlags] = useState<Record<string, boolean>>({});

    useEffect(() => {
        const fetchFlags = async () => {
            const supabase = createSupabaseBrowserClient();
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            // Fetch profile for tenant_id
            const { data: profile } = await supabase
                .from('user_profiles')
                .select('tenant_id, tenants(plan)')
                .eq('user_id', user.id)
                .single();

            if (!profile) return;

            // Fetch all flags and overrides
            const [flagsRes, overridesRes] = await Promise.all([
                supabase.from('feature_flags').select('key, plan_ids'),
                supabase.from('tenant_feature_flags').select('flag_key, enabled').eq('tenant_id', profile.tenant_id)
            ]);

            const resolvedFlags: Record<string, boolean> = {};
            const plan = (profile.tenants as any)?.plan || 'free';

            if (flagsRes.data) {
                flagsRes.data.forEach(f => {
                    resolvedFlags[f.key] = f.plan_ids.includes(plan);
                });
            }

            if (overridesRes.data) {
                overridesRes.data.forEach(o => {
                    resolvedFlags[o.flag_key] = o.enabled;
                });
            }

            setFlags(resolvedFlags);
        };

        fetchFlags();
    }, []);

    return (
        <FeatureFlagContext.Provider value={flags}>
            {children}
        </FeatureFlagContext.Provider>
    );
}
