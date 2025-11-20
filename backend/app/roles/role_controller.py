"""Role endpoints."""

from __future__ import annotations

from typing import List

from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.auth.auth_service import get_current_user, require_role
from app.database import get_db
from . import role_model, role_service

router = APIRouter(
    prefix="/roles",
    tags=["Roles"],
    dependencies=[Depends(get_current_user)],
)


@router.post(
    "/",
    response_model=role_model.RolePublic,
    status_code=status.HTTP_201_CREATED,
    dependencies=[Depends(require_role("admin"))],
)
def create_role(role: role_model.RoleCreate, db: Session = Depends(get_db)):
    """Create a new role (admin only)."""
    return role_service.create_new_role(db=db, role=role)


@router.get(
    "/",
    response_model=List[role_model.RolePublic],
    dependencies=[Depends(require_role("admin"))],
)
def list_roles(db: Session = Depends(get_db)):
    """List all roles (admin only)."""
    return role_service.get_all(db)


@router.get(
    "/{role_id}",
    response_model=role_model.RolePublic,
    dependencies=[Depends(require_role("admin"))],
)
def get_role(role_id: int, db: Session = Depends(get_db)):
    """Retrieve a role by ID (admin only)."""
    return role_service.get_role_by_id(db, role_id=role_id)


@router.put(
    "/{role_id}",
    response_model=role_model.RolePublic,
    dependencies=[Depends(require_role("admin"))],
)
def update_role(role_id: int, role: role_model.RoleUpdate, db: Session = Depends(get_db)):
    """Update a role (admin only)."""
    return role_service.update_existing_role(db=db, role_id=role_id, role_in=role)


@router.delete(
    "/{role_id}",
    response_model=role_model.RolePublic,
    dependencies=[Depends(require_role("admin"))],
)
def delete_role(role_id: int, db: Session = Depends(get_db)):
    """Delete a role (admin only)."""
    return role_service.delete_role_by_id(db=db, role_id=role_id)
