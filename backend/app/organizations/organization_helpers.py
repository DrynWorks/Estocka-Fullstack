"""Helpers for organizational data isolation."""

from __future__ import annotations

from typing import TYPE_CHECKING

from fastapi import Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.auth.auth_service import get_current_user
from app.database import get_db
from app.organizations.organization_service import OrganizationService

if TYPE_CHECKING:
    from app.organizations.organization_model import Organization
    from app.users.user_model import User


def get_current_organization(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
) -> Organization:
    """
    Get the organization of the currently logged-in user.
    
    This dependency ensures that all operations are scoped to the user's organization.
    Use this in any endpoint that needs organization isolation.
    
    Example:
        @router.get("/products")
        def get_products(
            organization: Organization = Depends(get_current_organization),
            db: Session = Depends(get_db)
        ):
            # Products will be automatically filtered by organization_id
            ...
    """
    organization = OrganizationService.get_by_id(db, current_user.organization_id)
    
    if not organization:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Organization not found"
        )
    
    if not organization.active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Organization is inactive"
        )
    
    return organization


def get_organization_id(current_user: User = Depends(get_current_user)) -> int:
    """
    Get just the organization ID of the current user.
    
    Lighter alternative to get_current_organization when you only need the ID.
    """
    return current_user.organization_id
