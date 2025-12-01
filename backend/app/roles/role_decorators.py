"""Permission checking decorators and dependencies."""

from __future__ import annotations

from functools import wraps
from typing import Callable

from fastapi import Depends, HTTPException, status

from app.auth.auth_service import get_current_user
from app.users.user_model import User
from .role_permissions import RoleType, has_permission


def require_permission(permission: str):
    """
    Decorator to require a specific permission for an endpoint.
    
    Usage:
        @router.delete("/products/{id}")
        @require_permission("products.delete")
        def delete_product(id: int, current_user: User = Depends(get_current_user)):
            ...
    
    Args:
        permission: Permission string (e.g., "products.delete")
    
    Raises:
        HTTPException 403 if user doesn't have permission
    """
    def decorator(func: Callable):
        @wraps(func)
        async def wrapper(*args, current_user: User = Depends(get_current_user), **kwargs):
            # User's role should be a RoleType enum from their role relationship
            user_role = RoleType(current_user.role.name)
            
            if not has_permission(user_role, permission):
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail=f"Permission denied. Required: {permission}"
                )
            
            return await func(*args, current_user=current_user, **kwargs)
        
        return wrapper
    return decorator


def require_role(*allowed_roles: str):
    """
    Decorator to require one of the specified roles.
    
    Usage:
        @router.post("/users")
        @require_role("admin")
        def create_user(data: UserCreate, current_user: User = Depends(get_current_user)):
            ...
    
    Args:
        allowed_roles: One or more role names (e.g., "admin", "collaborator")
    
    Raises:
        HTTPException 403 if user doesn't have required role
    """
    def decorator(func: Callable):
        @wraps(func)
        async def wrapper(*args, current_user: User = Depends(get_current_user), **kwargs):
            user_role_name = current_user.role.name
            
            if user_role_name not in allowed_roles:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail=f"Access denied. Required role: {', '.join(allowed_roles)}"
                )
            
            return await func(*args, current_user=current_user, **kwargs)
        
        return wrapper
    return decorator


def check_permission(user: User, permission: str) -> bool:
    """
    Helper function to check if a user has a permission.
    
    Usage in code:
        if check_permission(current_user, "products.delete"):
            # Do something
    
    Args:
        user: User object
        permission: Permission string
    
    Returns:
        True if user has permission, False otherwise
    """
    user_role = RoleType(user.role.name)
    return has_permission(user_role, permission)
