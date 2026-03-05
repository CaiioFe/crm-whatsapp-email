// ============================================================
// CRM WhatsApp & Email — Feature Flags Utility
// Princípio Nº 3: Feature Flags Obrigatórias
// ============================================================

import { createSupabaseServerClient } from '@/lib/supabase/server';
import type { FeatureFlag, TenantFeatureFlag, PlanType } from '@/types/database';

/**
 * Resolução de feature flag:
 * 1. Verificar override no tenant (tenant_feature_flags) → se existe, usar esse valor
 * 2. Se não há override → verificar se o plano do tenant está em plan_ids
 * 3. Se plano não está na lista → flag OFF
 * 4. Fallback: flag OFF (seguro)
 */
export async function isFeatureEnabled(
    tenantId: string,
    flagKey: string
): Promise<boolean> {
    try {
        const supabase = await createSupabaseServerClient();

        // 1. Check tenant override
        const { data: override } = await supabase
            .from('tenant_feature_flags')
            .select('enabled')
            .eq('tenant_id', tenantId)
            .eq('flag_key', flagKey)
            .single();

        if (override) {
            return override.enabled;
        }

        // 2. Check plan-based access
        const { data: flag } = await supabase
            .from('feature_flags')
            .select('plan_ids, enabled_by_default')
            .eq('key', flagKey)
            .single();

        if (!flag) {
            return false; // Flag doesn't exist → OFF (safe fallback)
        }

        // Get tenant plan
        const { data: tenant } = await supabase
            .from('tenants')
            .select('plan')
            .eq('id', tenantId)
            .single();

        if (!tenant) {
            return false; // Tenant not found → OFF
        }

        // Check if tenant's plan is in the flag's plan_ids
        return flag.plan_ids.includes(tenant.plan);
    } catch {
        // 4. Fallback: OFF (safe)
        return false;
    }
}

/**
 * Get all feature flags with resolved status for a tenant
 * Used for frontend to cache flag states
 */
export async function getAllFeatureFlags(
    tenantId: string
): Promise<Record<string, boolean>> {
    try {
        const supabase = await createSupabaseServerClient();

        // Get all flags
        const { data: flags } = await supabase
            .from('feature_flags')
            .select('key, plan_ids, enabled_by_default');

        if (!flags) return {};

        // Get tenant overrides
        const { data: overrides } = await supabase
            .from('tenant_feature_flags')
            .select('flag_key, enabled')
            .eq('tenant_id', tenantId);

        // Get tenant plan
        const { data: tenant } = await supabase
            .from('tenants')
            .select('plan')
            .eq('id', tenantId)
            .single();

        if (!tenant) return {};

        const overrideMap = new Map(
            (overrides || []).map((o) => [o.flag_key, o.enabled])
        );

        const result: Record<string, boolean> = {};

        for (const flag of flags) {
            // Override takes precedence
            if (overrideMap.has(flag.key)) {
                result[flag.key] = overrideMap.get(flag.key)!;
            } else {
                // Plan-based check
                result[flag.key] = flag.plan_ids.includes(tenant.plan);
            }
        }

        return result;
    } catch {
        return {};
    }
}
