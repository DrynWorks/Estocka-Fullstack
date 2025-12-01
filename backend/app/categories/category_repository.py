"""Data repository for categories."""

from __future__ import annotations

from sqlalchemy import select
from sqlalchemy.orm import Session

from . import category_model


def get_category_by_id(db: Session, category_id: int, organization_id: int):
    """Return a category by ID and organization."""
    return db.execute(
        select(category_model.Category).where(
            category_model.Category.id == category_id,
            category_model.Category.organization_id == organization_id
        )
    ).scalar_one_or_none()


def get_category_by_name(db: Session, name: str, organization_id: int):
    """Return a category by name and organization."""
    return db.execute(
        select(category_model.Category).where(
            category_model.Category.name == name,
            category_model.Category.organization_id == organization_id
        )
    ).scalar_one_or_none()


def list_categories(db: Session, organization_id: int):
    """List all categories for an organization."""
    return db.execute(
        select(category_model.Category).where(category_model.Category.organization_id == organization_id)
    ).scalars().all()


def create_category(db: Session, category: category_model.CategoryCreate, organization_id: int):
    """Create a new category."""
    db_category = category_model.Category(
        name=category.name,
        description=category.description,
        organization_id=organization_id
    )
    db.add(db_category)
    db.commit()
    db.refresh(db_category)
    return db_category


def update_category(
    db: Session,
    db_category: category_model.Category,
    category_in: category_model.CategoryUpdate,
):
    """Update allowed fields for a category."""
    update_data = category_in.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_category, key, value)
    db.add(db_category)
    db.commit()
    db.refresh(db_category)
    return db_category


def delete_category(db: Session, db_category: category_model.Category):
    """Delete the given category."""
    db.delete(db_category)
    db.commit()
    return db_category
