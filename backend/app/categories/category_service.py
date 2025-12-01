"""Business rules for categories."""

from __future__ import annotations

from fastapi import HTTPException, status
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from . import category_model, category_repository


def create_category(db: Session, category: category_model.CategoryCreate, organization_id: int):
    """Create a category ensuring name uniqueness."""
    if category_repository.get_category_by_name(db, name=category.name, organization_id=organization_id):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="Category name already exists"
        )
    return category_repository.create_category(db, category, organization_id=organization_id)


def list_categories(db: Session, organization_id: int):
    """List all categories for an organization."""
    return category_repository.list_categories(db, organization_id=organization_id)


def get_category(db: Session, category_id: int, organization_id: int):
    """Retrieve a category or raise 404."""
    db_category = category_repository.get_category_by_id(db, category_id, organization_id=organization_id)
    if db_category is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Category not found")
    return db_category


def update_category(db: Session, category_id: int, category_in: category_model.CategoryUpdate, organization_id: int):
    """Update a category ensuring the new name is unique."""
    db_category = get_category(db, category_id, organization_id=organization_id)

    if category_in.name and category_in.name != db_category.name:
        if category_repository.get_category_by_name(db, name=category_in.name, organization_id=organization_id):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Category name already exists",
            )

    return category_repository.update_category(db, db_category=db_category, category_in=category_in)


def delete_category(db: Session, category_id: int, organization_id: int):
    """Delete a category only when it has no related products."""
    db_category = get_category(db, category_id, organization_id=organization_id)

    from app.products.product_model import Product

    products_count = db.execute(
        select(func.count(Product.id)).where(Product.category_id == db_category.id)
    ).scalar_one()
    if products_count > 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Category has associated products and cannot be deleted",
        )

    return category_repository.delete_category(db, db_category=db_category)
