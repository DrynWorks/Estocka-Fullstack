"""Enhanced Role enum with granular permissions."""

from enum import Enum


class RoleType(str, Enum):
    """
    User role types with different permission levels.
    
    Hierarchy (most to least powerful):
    OWNER > ADMIN > MANAGER > OPERATOR > VIEWER
    """
    
    OWNER = "owner"          # Full control, can delete org, manage billing
    ADMIN = "admin"          # Can manage users, products, all features except org deletion
    MANAGER = "manager"      # Can manage products, categories, view reports
    OPERATOR = "operator"    # Can create/edit products and movements, basic operations
    VIEWER = "viewer"        # Read-only access to products, reports


# Permission sets for each role
ROLE_PERMISSIONS = {
    RoleType.OWNER: {
        # Full access to everything
        "organization.view",
        "organization.edit",
        "organization.delete",
        "users.view",
        "users.create",
        "users.edit",
        "users.delete",
        "users.manage_roles",
        "products.view",
        "products.create",
        "products.edit",
        "products.delete",
        "products.export",
        "categories.view",
        "categories.create",
        "categories.edit",
        "categories.delete",
        "movements.view",
        "movements.create",
        "movements.edit",
        "movements.delete",
        "reports.view",
        "reports.export",
        "audit.view",
    },
    
    RoleType.ADMIN: {
        # Everything except org deletion
        "organization.view",
        "organization.edit",
        "users.view",
        "users.create",
        "users.edit",
        "users.delete",
        "users.manage_roles",
        "products.view",
        "products.create",
        "products.edit",
        "products.delete",
        "products.export",
        "categories.view",
        "categories.create",
        "categories.edit",
        "categories.delete",
        "movements.view",
        "movements.create",
        "movements.edit",
        "movements.delete",
        "reports.view",
        "reports.export",
        "audit.view",
    },
    
    RoleType.MANAGER: {
        # Can manage inventory and view analytics
        "organization.view",
        "products.view",
        "products.create",
        "products.edit",
        "products.delete",
        "products.export",
        "categories.view",
        "categories.create",
        "categories.edit",
        "categories.delete",
        "movements.view",
        "movements.create",
        "movements.edit",
        "reports.view",
        "reports.export",
        "users.view",
    },
    
    RoleType.OPERATOR: {
        # Basic operations - create and move products
        "products.view",
        "products.create",
        "products.edit",
        "categories.view",
        "movements.view",
        "movements.create",
        "movements.edit",
        "reports.view",
    },
    
    RoleType.VIEWER: {
        # Read-only
        "products.view",
        "categories.view",
        "movements.view",
        "reports.view",
    },
}


def has_permission(role: RoleType, permission: str) -> bool:
    """
    Check if a role has a specific permission.
    
    Args:
        role: The user's role
        permission: Permission string (e.g., "products.delete")
    
    Returns:
        True if role has the permission, False otherwise
    
    Example:
        >>> has_permission(RoleType.ADMIN, "products.delete")
        True
        >>> has_permission(RoleType.VIEWER, "products.delete")
        False
    """
    return permission in ROLE_PERMISSIONS.get(role, set())


def get_role_permissions(role: RoleType) -> set[str]:
    """Get all permissions for a role."""
    return ROLE_PERMISSIONS.get(role, set())
