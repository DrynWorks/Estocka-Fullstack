"""Product endpoints."""

from __future__ import annotations

from typing import List

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

from app.auth.auth_service import get_current_user, require_role
from app.database import get_db
from app.users.user_model import User
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
def create_product(
    product: product_model.ProductCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Create a new product (admin only)."""
    return product_service.create_product(db, product, user_id=current_user.id)


@router.get("/", response_model=List[product_model.ProductPublic])
def list_products(db: Session = Depends(get_db)):
    """List every product."""
    return product_service.list_products(db)


@router.get("/search", response_model=List[product_model.ProductPublic])
def search_products(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    search: str | None = Query(default=None, description="Search in name or SKU"),
    category_id: int | None = Query(default=None, description="Filter by category"),  
    stock_status: str | None = Query(default=None, regex="^(out|low|ok)$", description="Stock status: out, low, or ok"),
    price_min: float | None = Query(default=None, ge=0, description="Minimum price"),
    price_max: float | None = Query(default=None, ge=0, description="Maximum price"),
):
    """
    Search and filter products with advanced options.
    
    Query Parameters:
        - search: Search in product name or SKU
        - category_id: Filter by category ID
        - stock_status: Filter by stock level (out=qty 0, low=qty<=alert, ok=qty>alert)
        - price_min: Minimum price filter
        - price_max: Maximum price filter
    
    Examples:
        /products/search?stock_status=low
        /products/search?price_min=10&price_max=100
        /products/search?search=coca&stock_status=ok
    """
    from .product_filters import build_product_filters
    
    # Build query with filters
    stmt = build_product_filters(
        organization_id=current_user.organization_id,
        stock_status=stock_status,
        price_min=price_min,
        price_max=price_max,
        category_id=category_id,
        search=search
    )
    
    products = db.scalars(stmt).all()
    return products


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
    current_user: User = Depends(get_current_user)
):
    """Update product metadata without touching stock levels."""
    return product_service.update_product(db, product_id=product_id, product_in=product_in, user_id=current_user.id)


@router.delete(
    "/{product_id}",
    response_model=product_model.ProductPublic,
    dependencies=[Depends(require_role("admin"))],
)
def delete_product(
    product_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Delete a product (admin only)."""
    return product_service.delete_product(db, product_id=product_id, user_id=current_user.id)
