"""User endpoints."""

from __future__ import annotations

import logging
from typing import List

from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.auth.auth_service import get_current_user, require_role
from app.database import get_db
from . import user_model, user_service

logger = logging.getLogger(__name__)

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
    logger.info(f"Criando usuário: {user.email} - Por: {current_user.email}")
    
    # Force organization_id to be the same as the current user's organization
    user.organization_id = current_user.organization_id
    result = user_service.create_new_user(db=db, user=user)
    
    logger.info(f"✅ Usuário criado: ID {result.id} - {result.email}")
    return result


@router.get(
    "/",
    response_model=List[user_model.UserPublic],
    dependencies=[Depends(require_role("admin"))],
)
def read_users(
    db: Session = Depends(get_db),
    current_user: user_model.User = Depends(get_current_user)
):
    """List users from current organization (admin only)."""
    return user_service.get_all_users(db, organization_id=current_user.organization_id)


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
def update_user(
    user_id: int, 
    user: user_model.UserUpdate, 
    db: Session = Depends(get_db),
    current_user: user_model.User = Depends(get_current_user)
):
    """Update a user (admin only)."""
    logger.info(f"Atualizando usuário ID {user_id} - Por: {current_user.email}")
    
    result = user_service.update_existing_user(db=db, user_id=user_id, user_in=user)
    
    logger.info(f"✅ Usuário atualizado: ID {user_id}")
    return result


@router.delete(
    "/{user_id}",
    response_model=user_model.UserPublic,
    dependencies=[Depends(require_role("admin"))],
)
def delete_user(
    user_id: int, 
    db: Session = Depends(get_db),
    current_user: user_model.User = Depends(get_current_user)
):
    """Delete a user (admin only)."""
    logger.warning(f"Deletando usuário ID {user_id} - Por: {current_user.email}")
    
    result = user_service.delete_user_by_id(db=db, user_id=user_id)
    
    logger.info(f"✅ Usuário deletado: ID {user_id}")
    return result
