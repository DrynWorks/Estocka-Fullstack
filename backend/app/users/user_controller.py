"""User endpoints."""

from __future__ import annotations

from typing import List

from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.auth.auth_service import get_current_user, require_role
from app.database import get_db
from . import user_model, user_service

router = APIRouter(
    prefix="/users",
    tags=["Users"],
    dependencies=[Depends(get_current_user)],
)


@router.post(
    "/",
    response_model=user_model.UserPublic,
    status_code=status.HTTP_201_CREATED,
    dependencies=[Depends(require_role("admin"))],
)
def create_user(
    user: user_model.UserCreate, 
    db: Session = Depends(get_db),
    current_user: user_model.User = Depends(get_current_user)
):
    """Create a new user (admin only)."""
    # Force organization_id to be the same as the current user's organization
    user.organization_id = current_user.organization_id
    return user_service.create_new_user(db=db, user=user)


@router.get(
    "/",
    response_model=List[user_model.UserPublic],
    dependencies=[Depends(require_role("admin"))],
)
def read_users(db: Session = Depends(get_db)):
    """List every user (admin only)."""
    return user_service.get_all_users(db)


@router.get(
    "/{user_id}",
    response_model=user_model.UserPublic,
    dependencies=[Depends(require_role("admin"))],
)
def read_user(user_id: int, db: Session = Depends(get_db)):
    """Retrieve a user by ID (admin only)."""
    return user_service.get_user_by_id(db, user_id=user_id)


@router.put(
    "/{user_id}",
    response_model=user_model.UserPublic,
    dependencies=[Depends(require_role("admin"))],
)
def update_user(user_id: int, user: user_model.UserUpdate, db: Session = Depends(get_db)):
    """Update a user (admin only)."""
    return user_service.update_existing_user(db=db, user_id=user_id, user_in=user)


@router.delete(
    "/{user_id}",
    response_model=user_model.UserPublic,
    dependencies=[Depends(require_role("admin"))],
)
def delete_user(user_id: int, db: Session = Depends(get_db)):
    """Delete a user (admin only)."""
    return user_service.delete_user_by_id(db=db, user_id=user_id)
