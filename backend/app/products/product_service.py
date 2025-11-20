"""Business rules for products."""

from __future__ import annotations

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.categories import category_repository
from . import product_model, product_repository


def create_product(db: Session, product: product_model.ProductCreate):
    """Create a product ensuring unique SKU and valid category."""
    if product_repository.get_product_by_sku(db, sku=product.sku):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Product SKU already exists",
        )

    if category_repository.get_category_by_id(db, category_id=product.category_id) is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Category not found")

    return product_repository.create_product(db, product)


def list_products(db: Session):
    """List all products."""
    return product_repository.list_products(db)


def get_product(db: Session, product_id: int):
    """Retrieve a product or raise 404."""
    db_product = product_repository.get_product_by_id(db, product_id)
    if db_product is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Product not found")
    return db_product


def search_products(
    db: Session,
    *,
    name: str | None = None,
    sku: str | None = None,
    category_id: int | None = None,
    low_stock_only: bool = False,
):
    """Search products using optional filters."""
    return product_repository.search_products(
        db,
        name=name,
        sku=sku,
        category_id=category_id,
        low_stock_only=low_stock_only,
    )


def update_product(db: Session, product_id: int, product_in: product_model.ProductUpdate):
    """Update product fields without changing stock directly."""
    db_product = get_product(db, product_id)

    if product_in.quantity is not None and product_in.quantity != db_product.quantity:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Stock changes must be performed via movements",
        )

    if product_in.sku and product_in.sku != db_product.sku:
        existing = product_repository.get_product_by_sku(db, sku=product_in.sku)
        if existing and existing.id != db_product.id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Product SKU already exists",
            )

    if product_in.category_id is not None and product_in.category_id != db_product.category_id:
        if category_repository.get_category_by_id(db, category_id=product_in.category_id) is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Category not found")

    return product_repository.update_product(db, db_product=db_product, product_in=product_in)


def delete_product(db: Session, product_id: int):
    """Delete a product."""
    db_product = get_product(db, product_id)
    return product_repository.delete_product(db, db_product=db_product)


def get_low_stock_products(db: Session):
    """Return products flagged as critical."""
    return product_repository.get_low_stock_products(db)


def get_out_of_stock_products(db: Session):
    """Return products without stock."""
    return product_repository.get_out_of_stock_products(db)
