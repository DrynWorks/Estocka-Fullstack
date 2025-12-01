"""API endpoints for Organization management."""

from __future__ import annotations

from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.auth.auth_service import get_current_user
from app.database import get_db
from app.users.user_model import User
from . import organization_model, organization_schemas
from .organization_service import OrganizationService

router = APIRouter(prefix="/organizations", tags=["organizations"])


@router.get("/me", response_model=organization_schemas.OrganizationPublic)
def get_my_organization(
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[Session, Depends(get_db)]
):
    """Get the organization of the currently logged-in user."""
    organization = OrganizationService.get_by_id(db, current_user.organization_id)
    
    if not organization:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Organization not found"
        )
    
    return organization


@router.patch("/me", response_model=organization_schemas.OrganizationPublic)
def update_my_organization(
    update_data: organization_schemas.OrganizationUpdate,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[Session, Depends(get_db)]
):
    """
    Update the organization (admin only).
    
    Note: In future, add role check to ensure only admin can update.
    """
    organization = OrganizationService.get_by_id(db, current_user.organization_id)
    
    if not organization:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Organization not found"
        )
    
    # Update only provided fields
    updated_org = OrganizationService.update(
        db,
        organization,
        name=update_data.name,
        cnpj=update_data.cnpj,
        active=update_data.active
    )
    
    return updated_org


@router.post("/", response_model=organization_schemas.OrganizationPublic, status_code=status.HTTP_201_CREATED)
def create_organization(
    org_data: organization_schemas.OrganizationCreate,
    db: Annotated[Session, Depends(get_db)]
):
    """
    Create a new organization.
    
    Note: In production, this should be restricted or require special permissions.
    For now, allows creating organizations freely (useful for initial setup).
    """
    # Check if slug already exists
    existing = OrganizationService.get_by_slug(db, org_data.slug)
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Organization with slug '{org_data.slug}' already exists"
        )
    
    organization = OrganizationService.create(
        db,
        name=org_data.name,
        slug=org_data.slug,
        cnpj=org_data.cnpj
    )
    
    return organization
