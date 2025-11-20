"""Business rules for roles."""

from __future__ import annotations

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from . import role_model, role_repository


def create_new_role(db: Session, role: role_model.RoleCreate):
    """Create a new role ensuring unique name."""
    if role_repository.get_role_by_name(db, name=role.name):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Role name already exists")
    return role_repository.create_role(db=db, role=role)


def get_all(db: Session):
    """List every role."""
    return role_repository.get_all_roles(db)


def get_role_by_id(db: Session, role_id: int):
    """Retrieve a role by ID or raise 404."""
    db_role = role_repository.get_role_by_id(db, role_id=role_id)
    if db_role is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Role not found")
    return db_role


def update_existing_role(db: Session, role_id: int, role_in: role_model.RoleUpdate):
    """Update a role ensuring the name stays unique."""
    db_role = get_role_by_id(db, role_id)

    if role_in.name != db_role.name:
        existing_role = role_repository.get_role_by_name(db, name=role_in.name)
        if existing_role:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Role name already exists")

    return role_repository.update_role(db=db, db_role=db_role, role_in=role_in)


def delete_role_by_id(db: Session, role_id: int):
    """Delete a role."""
    db_role = get_role_by_id(db, role_id)
    return role_repository.delete_role(db=db, db_role=db_role)
