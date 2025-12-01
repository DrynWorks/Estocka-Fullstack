"""Enhanced Role enum with granular permissions."""

from enum import Enum


class RoleType(str, Enum):
    """
    User role types (simplified).
    
    Only two effective roles:
    - admin: controle total
    - user: operações do dia a dia (estoque/vendas)
    
    Aliases legacy: owner -> admin, collaborator -> user.
    """
    
    ADMIN = "admin"
    USER = "user"
    COLLABORATOR = "collaborator"  # alias of USER (compat)
    OWNER = "owner"                # alias of ADMIN (compat)


# Permission sets for each role
ROLE_PERMISSIONS = {
    # Admin: full access
    RoleType.ADMIN: {
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
    
    # User: operações do dia a dia (sem gestão de usuários/roles)
    RoleType.USER: {
        "organization.view",
        "products.view",
        "products.create",
        "products.edit",
        "products.export",
        "categories.view",
        "categories.create",
        "categories.edit",
        "movements.view",
        "movements.create",
        "reports.view",
    },
}

# Aliases de compatibilidade
ROLE_PERMISSIONS[RoleType.COLLABORATOR] = ROLE_PERMISSIONS[RoleType.USER]
ROLE_PERMISSIONS[RoleType.OWNER] = ROLE_PERMISSIONS[RoleType.ADMIN]


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
