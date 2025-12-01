"""Category endpoints."""

from __future__ import annotations

from typing import List

from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.auth.auth_service import get_current_user, require_role
from app.database import get_db
from . import category_model, category_service

router = APIRouter(
    prefix="/categories",
    tags=["Categories"],
    dependencies=[Depends(get_current_user)],
)


@router.post(
    "/",
    response_model=category_model.CategoryPublic,
    status_code=status.HTTP_201_CREATED,
    dependencies=[Depends(require_role("admin"))],
)
def create_category(
    category: category_model.CategoryCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Create a category (admin only)."""
    return category_service.create_category(db, category, organization_id=current_user.organization_id)


@router.get("/", response_model=List[category_model.CategoryPublic])
def list_categories(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """List every category."""
    return category_service.list_categories(db, organization_id=current_user.organization_id)


@router.get("/{category_id}", response_model=category_model.CategoryPublic)
def get_category(
    category_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Retrieve a category by ID."""
    return category_service.get_category(db, category_id, organization_id=current_user.organization_id)


@router.put(
    "/{category_id}",
    response_model=category_model.CategoryPublic,
    dependencies=[Depends(require_role("admin"))],
)
def update_category(
    category_id: int,
    category_in: category_model.CategoryUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Update a category (admin only)."""
    return category_service.update_category(
        db,
        category_id=category_id,
        category_in=category_in,
        organization_id=current_user.organization_id
    )


@router.delete(
    "/{category_id}",
    response_model=category_model.CategoryPublic,
    dependencies=[Depends(require_role("admin"))],
)
def delete_category(
    category_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Delete a category without attached products (admin only)."""
    return category_service.delete_category(db, category_id=category_id, organization_id=current_user.organization_id)
