"""Data repository for products."""

from __future__ import annotations

from typing import List, Optional

from sqlalchemy import func
from sqlalchemy.orm import Session

from . import product_model


def get_product_by_id(db: Session, product_id: int, organization_id: int):
    """Return a product by ID and organization."""
    return (
        db.query(product_model.Product)
        .filter(
            product_model.Product.id == product_id,
            product_model.Product.organization_id == organization_id
        )
        .first()
    )


def get_product_by_sku(db: Session, sku: str, organization_id: int):
    """Return a product by SKU and organization."""
    return (
        db.query(product_model.Product)
        .filter(
            func.lower(product_model.Product.sku) == sku.lower(),
            product_model.Product.organization_id == organization_id
        )
        .first()
    )


def list_products(db: Session, organization_id: int) -> List[product_model.Product]:
    """List all products for an organization."""
    return (
        db.query(product_model.Product)
        .filter(product_model.Product.organization_id == organization_id)
        .all()
    )


def search_products(
    db: Session,
    organization_id: int,
    name: Optional[str] = None,
    sku: Optional[str] = None,
    category_id: Optional[int] = None,
    low_stock_only: bool = False,
) -> List[product_model.Product]:
    """Search products with flexible filters."""
    query = db.query(product_model.Product).filter(product_model.Product.organization_id == organization_id)

    if name:
        pattern = f"%{name}%"
        query = query.filter(product_model.Product.name.ilike(pattern))
    if sku:
        pattern = f"%{sku}%"
        query = query.filter(product_model.Product.sku.ilike(pattern))
    if category_id:
        query = query.filter(product_model.Product.category_id == category_id)
    if low_stock_only:
        query = query.filter(product_model.Product.quantity <= product_model.Product.alert_level)

    return query.all()


def create_product(db: Session, product: product_model.ProductCreate, organization_id: int):
    """Persist a new product."""
    db_product = product_model.Product(
        name=product.name,
        sku=product.sku,
        price=product.price,
        quantity=product.quantity,
        alert_level=product.alert_level,
        category_id=product.category_id,
        organization_id=organization_id,
    )
    db.add(db_product)
    db.commit()
    db.refresh(db_product)
    return db_product


def update_product(
    db: Session,
    db_product: product_model.Product,
    product_in: product_model.ProductUpdate,
):
    """Update allowed product fields."""
    update_data = product_in.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_product, key, value)
    db.add(db_product)
    db.commit()
    db.refresh(db_product)
    return db_product


def delete_product(db: Session, db_product: product_model.Product):
    """Delete the given product."""
    db.delete(db_product)
    db.commit()
    return db_product


def get_low_stock_products(db: Session, organization_id: int) -> List[product_model.Product]:
    """Return products at or below their alert level."""
    return (
        db.query(product_model.Product)
        .filter(
            product_model.Product.quantity <= product_model.Product.alert_level,
            product_model.Product.organization_id == organization_id
        )
        .all()
    )


def get_out_of_stock_products(db: Session, organization_id: int) -> List[product_model.Product]:
    """Return products with zero stock."""
    return (
        db.query(product_model.Product)
        .filter(
            product_model.Product.quantity == 0,
            product_model.Product.organization_id == organization_id
        )
        .all()
    )


def get_products_by_category(db: Session, organization_id: int):
    """Aggregate total quantity and value grouped by category."""
    return (
        db.query(
            product_model.Product.category_id,
            func.sum(product_model.Product.quantity).label("total_quantity"),
            func.sum(product_model.Product.quantity * product_model.Product.price).label("total_value"),
        )
        .filter(product_model.Product.organization_id == organization_id)
        .group_by(product_model.Product.category_id)
        .all()
    )
