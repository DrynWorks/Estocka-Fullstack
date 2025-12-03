"""Helper functions for building product filters."""

from __future__ import annotations

from typing import Optional

from sqlalchemy import select
from sqlalchemy.orm import Query

from .product_model import Product


def build_product_filters(
    organization_id: int,
    stock_status: Optional[str] = None,
    price_min: Optional[float] = None,
    price_max: Optional[float] = None,
    category_id: Optional[int] = None,
    search: Optional[str] = None
) -> select:
    """
    Build filtered query for products with various filter options.
    
    Args:
        organization_id: Required - filter by organization
        stock_status: "out" (qty=0), "low" (qty<=alert_level), "ok" (qty>alert_level)
        price_min: Minimum price filter
        price_max: Maximum price filter
        category_id: Filter by category
        search: Search in product name or SKU
    
    Returns:
        SQLAlchemy select statement with applied filters
    
    Example:
        stmt = build_product_filters(
            organization_id=1,
            stock_status="low",
            price_min=10.0,
            price_max=100.0
        )
        products = db.scalars(stmt).all()
    """
    # Base query - always filter by organization and not deleted
    stmt = select(Product).where(
        Product.organization_id == organization_id,
        Product.is_deleted == False
    )
    
    # Stock status filter
    if stock_status == "out":
        stmt = stmt.where(Product.quantity == 0)
    elif stock_status == "low":
        stmt = stmt.where(
            Product.quantity > 0,
            Product.quantity <= Product.alert_level
        )
    elif stock_status == "ok":
        stmt = stmt.where(Product.quantity > Product.alert_level)
    
    # Price range filters
    if price_min is not None:
        stmt = stmt.where(Product.price >= price_min)
    if price_max is not None:
        stmt = stmt.where(Product.price <= price_max)
    
    # Category filter
    if category_id is not None:
        stmt = stmt.where(Product.category_id == category_id)
    
    # Search filter (name or SKU)
    if search:
        search_pattern = f"%{search}%"
        stmt = stmt.where(
            (Product.name.ilike(search_pattern)) |
            (Product.sku.ilike(search_pattern))
        )
    
    return stmt
