"""Service layer for user business rules."""

from __future__ import annotations

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.roles import role_repository
from app.utils.image_processor import process_image_base64
from . import user_model, user_repository


def create_new_user(db: Session, user: user_model.UserCreate):
    """Create a user ensuring unique email and valid role."""
    if user_repository.get_user_by_email(db, email=user.email):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered",
        )

    if role_repository.get_role_by_id(db, role_id=user.role_id) is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Role not found")

    try:
        processed_image = process_image_base64(user.profile_image_base64)
        user_data = user.model_copy()
        user_data.profile_image_base64 = processed_image
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Image processing error: {exc}",
        ) from exc

    return user_repository.create_user(db=db, user=user_data, role_id=user.role_id)


def get_all_users(db: Session):
    """Return all users without filters."""
    return user_repository.get_users(db)


def get_user_by_id(db: Session, user_id: int):
    """Retrieve a user by ID or raise 404."""
    db_user = user_repository.get_user(db, user_id=user_id)
    if db_user is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    return db_user


def update_existing_user(db: Session, user_id: int, user_in: user_model.UserUpdate):
    """Update user data, handling image processing and role validation."""
    db_user = get_user_by_id(db, user_id)

    update_payload = user_in.model_copy()

    if update_payload.profile_image_base64:
        try:
            update_payload.profile_image_base64 = process_image_base64(update_payload.profile_image_base64)
        except ValueError as exc:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Image processing error: {exc}",
            ) from exc

    if update_payload.role_id is not None:
        if role_repository.get_role_by_id(db, role_id=update_payload.role_id) is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Role not found")

    return user_repository.update_user(db=db, db_user=db_user, user_in=update_payload)


def delete_user_by_id(db: Session, user_id: int):
    """Delete an existing user."""
    db_user = get_user_by_id(db, user_id)
    return user_repository.delete_user(db=db, db_user=db_user)
