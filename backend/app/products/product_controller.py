"""Product endpoints."""

from __future__ import annotations

from typing import List

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

from app.auth.auth_service import get_current_user, require_role
from app.database import get_db
from . import product_model, product_service

router = APIRouter(
    prefix="/products",
    tags=["Products"],
    dependencies=[Depends(get_current_user)],
)


@router.post(
    "/",
    response_model=product_model.ProductPublic,
    status_code=status.HTTP_201_CREATED,
    dependencies=[Depends(require_role("admin"))],
)
def create_product(product: product_model.ProductCreate, db: Session = Depends(get_db)):
    """Create a new product (admin only)."""
    return product_service.create_product(db, product)


@router.get("/", response_model=List[product_model.ProductPublic])
def list_products(db: Session = Depends(get_db)):
    """List every product."""
    return product_service.list_products(db)


@router.get("/search", response_model=List[product_model.ProductPublic])
def search_products(
    name: str | None = Query(default=None, description="Filter by name"),
    sku: str | None = Query(default=None, description="Filter by SKU"),
    category_id: int | None = Query(default=None, description="Filter by category"),
    low_stock: bool = Query(default=False, description="Only products at or below alert level"),
    db: Session = Depends(get_db),
):
    """Search products using flexible filters."""
    return product_service.search_products(
        db,
        name=name,
        sku=sku,
        category_id=category_id,
        low_stock_only=low_stock,
    )


@router.get("/{product_id}", response_model=product_model.ProductPublic)
def get_product(product_id: int, db: Session = Depends(get_db)):
    """Retrieve a product by ID."""
    return product_service.get_product(db, product_id)


@router.put(
    "/{product_id}",
    response_model=product_model.ProductPublic,
    dependencies=[Depends(require_role("admin"))],
)
def update_product(
    product_id: int,
    product_in: product_model.ProductUpdate,
    db: Session = Depends(get_db),
):
    """Update product metadata without touching stock levels."""
    return product_service.update_product(db, product_id=product_id, product_in=product_in)


@router.delete(
    "/{product_id}",
    response_model=product_model.ProductPublic,
    dependencies=[Depends(require_role("admin"))],
)
def delete_product(product_id: int, db: Session = Depends(get_db)):
    """Delete a product (admin only)."""
    return product_service.delete_product(db, product_id=product_id)
