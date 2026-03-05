// ============================================================
// CRM WhatsApp & Email — RBAC Utility
// Princípio Nº 4: RBAC como primeira camada
// ============================================================

import { createSupabaseServerClient } from '@/lib/supabase/server';
import type { UserRole } from '@/types/database';

/**
 * Permission matrix
 * Maps: module.action → minimum required role
 */
const PERMISSIONS: Record<string, UserRole> = {
    // Leads
    'leads.view': 'viewer',
    'leads.create': 'operator',
    'leads.edit': 'operator',
    'leads.delete': 'manager',
    'leads.import': 'admin',

    // Email
    'email.view': 'viewer',
    'email.send_individual': 'operator',
    'email.broadcast': 'manager',
    'email.templates_edit': 'manager',

    // WhatsApp
    'whatsapp.view': 'viewer',
    'whatsapp.send_individual': 'operator',
    'whatsapp.broadcast': 'manager',
    'whatsapp.inbox': 'operator',

    // Journeys
    'journeys.view': 'viewer',
    'journeys.edit': 'manager',
    'journeys.activate': 'manager',

    // Analytics
    'analytics.view': 'viewer',
    'analytics.export': 'manager',

    // Settings
    'settings.view': 'admin',
    'settings.manage': 'admin',
    'settings.rbac': 'admin',
    'settings.feature_flags': 'admin',
};

/**
 * Role hierarchy (higher index = more permissions)
 */
const ROLE_HIERARCHY: UserRole[] = ['viewer', 'operator', 'manager', 'admin'];

/**
 * Check if a role has sufficient permissions
 */
function roleHasPermission(userRole: UserRole, requiredRole: UserRole): boolean {
    const userLevel = ROLE_HIERARCHY.indexOf(userRole);
    const requiredLevel = ROLE_HIERARCHY.indexOf(requiredRole);
    return userLevel >= requiredLevel;
}

/**
 * Check if the current user has permission for an action
 * @param permission - format: "module.action" (e.g., "leads.create")
 * @returns boolean
 */
export async function hasPermission(permission: string): Promise<boolean> {
    try {
        const supabase = await createSupabaseServerClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) return false;

        const { data: profile } = await supabase
            .from('user_profiles')
            .select('role')
            .eq('user_id', user.id)
            .single();

        if (!profile) return false;

        const requiredRole = PERMISSIONS[permission];
        if (!requiredRole) return false; // Unknown permission → deny

        return roleHasPermission(profile.role as UserRole, requiredRole);
    } catch {
        return false;
    }
}

/**
 * Get current user's role
 */
export async function getCurrentUserRole(): Promise<UserRole | null> {
    try {
        const supabase = await createSupabaseServerClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) return null;

        const { data: profile } = await supabase
            .from('user_profiles')
            .select('role')
            .eq('user_id', user.id)
            .single();

        return (profile?.role as UserRole) || null;
    } catch {
        return null;
    }
}

/**
 * Get current user's tenant_id
 */
export async function getCurrentTenantId(): Promise<string | null> {
    try {
        const supabase = await createSupabaseServerClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) return null;

        const { data: profile } = await supabase
            .from('user_profiles')
            .select('tenant_id')
            .eq('user_id', user.id)
            .single();

        return profile?.tenant_id || null;
    } catch {
        return null;
    }
}

/**
 * Require permission — throws if not authorized
 * Use in API routes for enforcement
 */
export async function requirePermission(permission: string): Promise<void> {
    const allowed = await hasPermission(permission);
    if (!allowed) {
        throw new Error(`Forbidden: insufficient permissions for '${permission}'`);
    }
}

/**
 * Get all permissions for a given role
 * Useful for frontend to know what to show/hide
 */
export function getPermissionsForRole(role: UserRole): Record<string, boolean> {
    const result: Record<string, boolean> = {};
    for (const [permission, requiredRole] of Object.entries(PERMISSIONS)) {
        result[permission] = roleHasPermission(role, requiredRole);
    }
    return result;
}
