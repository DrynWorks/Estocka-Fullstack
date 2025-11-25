/**
 * Hook for checking user permissions based on role.
 * 
 * Uses the role-based permission system from the backend.
 */

import { useAuth } from '../contexts/AuthContext';

// Role hierarchy (from most to least powerful)
export type RoleType = 'owner' | 'admin' | 'manager' | 'operator' | 'viewer';

// Permission mapping (matches backend)
const ROLE_PERMISSIONS: Record<RoleType, Set<string>> = {
    owner: new Set([
        'organization.view', 'organization.edit', 'organization.delete',
        'users.view', 'users.create', 'users.edit', 'users.delete', 'users.manage_roles',
        'products.view', 'products.create', 'products.edit', 'products.delete', 'products.export',
        'categories.view', 'categories.create', 'categories.edit', 'categories.delete',
        'movements.view', 'movements.create', 'movements.edit', 'movements.delete',
        'reports.view', 'reports.export',
        'audit.view',
    ]),

    admin: new Set([
        'organization.view', 'organization.edit',
        'users.view', 'users.create', 'users.edit', 'users.delete', 'users.manage_roles',
        'products.view', 'products.create', 'products.edit', 'products.delete', 'products.export',
        'categories.view', 'categories.create', 'categories.edit', 'categories.delete',
        'movements.view', 'movements.create', 'movements.edit', 'movements.delete',
        'reports.view', 'reports.export',
        'audit.view',
    ]),

    manager: new Set([
        'organization.view',
        'users.view',
        'products.view', 'products.create', 'products.edit', 'products.delete', 'products.export',
        'categories.view', 'categories.create', 'categories.edit', 'categories.delete',
        'movements.view', 'movements.create', 'movements.edit',
        'reports.view', 'reports.export',
    ]),

    operator: new Set([
        'products.view', 'products.create', 'products.edit',
        'categories.view',
        'movements.view', 'movements.create', 'movements.edit',
        'reports.view',
    ]),

    viewer: new Set([
        'products.view',
        'categories.view',
        'movements.view',
        'reports.view',
    ]),
};

/**
 * Hook to check user permissions.
 * 
 * @example
 * const { canDelete, canExport, hasPermission } = usePermissions();
 * 
 * if (canDelete('products')) {
 *   // Show delete button
 * }
 * 
 * if (hasPermission('products.export')) {
 *   // Show export button
 * }
 */
export function usePermissions() {
    const { user } = useAuth();

    const userRole = (user?.role?.name as RoleType) || 'viewer';
    const permissions = ROLE_PERMISSIONS[userRole] || new Set();

    /**
     * Check if user has a specific permission.
     */
    const hasPermission = (permission: string): boolean => {
        return permissions.has(permission);
    };

    /**
     * Check if user can view a resource.
     */
    const canView = (resource: string): boolean => {
        return hasPermission(`${resource}.view`);
    };

    /**
     * Check if user can create a resource.
     */
    const canCreate = (resource: string): boolean => {
        return hasPermission(`${resource}.create`);
    };

    /**
     * Check if user can edit a resource.
     */
    const canEdit = (resource: string): boolean => {
        return hasPermission(`${resource}.edit`);
    };

    /**
     * Check if user can delete a resource.
     */
    const canDelete = (resource: string): boolean => {
        return hasPermission(`${resource}.delete`);
    };

    /**
     * Check if user can export a resource.
     */
    const canExport = (resource: string): boolean => {
        return hasPermission(`${resource}.export`);
    };

    /**
     * Check if user has one of the specified roles.
     */
    const hasRole = (...roles: RoleType[]): boolean => {
        return roles.includes(userRole);
    };

    /**
     * Check if user is admin or owner.
     */
    const isAdmin = (): boolean => {
        return userRole === 'admin' || userRole === 'owner';
    };

    /**
     * Check if user is owner only.
     */
    const isOwner = (): boolean => {
        return userRole === 'owner';
    };

    return {
        // Current user's role
        role: userRole,

        // General permission check
        hasPermission,

        // Resource-specific checks
        canView,
        canCreate,
        canEdit,
        canDelete,
        canExport,

        // Role checks
        hasRole,
        isAdmin,
        isOwner,

        // All permissions for the current role
        permissions: Array.from(permissions),
    };
}
