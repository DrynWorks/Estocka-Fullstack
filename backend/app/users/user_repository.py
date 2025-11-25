"""Data access layer for users."""

from __future__ import annotations

from sqlalchemy.orm import Session

from app.security import get_password_hash
from . import user_model


def get_user(db: Session, user_id: int):
    """Return a user by ID."""
    return db.query(user_model.User).filter(user_model.User.id == user_id).first()


def get_user_by_email(db: Session, email: str):
    """Return a user by email."""
    return db.query(user_model.User).filter(user_model.User.email == email).first()


def get_users(db: Session):
    """List all users."""
    return db.query(user_model.User).all()


def create_user(
    db: Session,
    user: user_model.UserCreate,
    role_id: int | None = None,
    *,
    commit: bool = True,
):
    """Create a user storing a hashed password."""
    hashed_password = get_password_hash(user.password)
    db_user = user_model.User(
        email=user.email,
        hashed_password=hashed_password,
        full_name=user.full_name,
        profile_image_url=user.profile_image_url,
        profile_image_base64=user.profile_image_base64,
        role_id=role_id if role_id is not None else user.role_id,
        organization_id=user.organization_id,
    )
    db.add(db_user)
    db.flush()
    if commit:
        db.commit()
    db.refresh(db_user)
    return db_user


def update_user(db: Session, db_user: user_model.User, user_in: user_model.UserUpdate):
    """Update basic user fields."""
    update_data = user_in.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        if key == "role_id":
            setattr(db_user, "role_id", value)
        else:
            setattr(db_user, key, value)

    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user


def delete_user(db: Session, db_user: user_model.User):
    """Delete the given user."""
    db.delete(db_user)
    db.commit()
    return db_user
