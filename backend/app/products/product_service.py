"""Business rules for products."""

from __future__ import annotations

from sqlalchemy.orm import Session

from app.audit import audit_service
from app.audit.audit_model import ActionType, EntityType
from app.categories import category_repository
from app.exceptions import (
    DuplicateSKUException,
    ProductNotFoundException,
    CategoryNotFoundException,
    ValidationException,
)
from . import product_model, product_repository


def create_product(
    db: Session,
    product: product_model.ProductCreate,
    organization_id: int,
    user_id: int | None = None
) -> product_model.Product:
    """
    Create a new product in the database.

    Ensures that the SKU is unique and the referenced category exists.

    Args:
        db: Database session.
        product: Product creation schema containing name, SKU, price, etc.
        organization_id: ID of the organization.
        user_id: ID of the user creating the product (for audit).

    Returns:
        The created Product ORM instance.

    Raises:
        HTTPException(400): If the SKU already exists.
        HTTPException(404): If the category_id does not exist.
    """
    if product_repository.get_product_by_sku(db, sku=product.sku, organization_id=organization_id):
        raise DuplicateSKUException(product.sku)

    if category_repository.get_category_by_id(db, category_id=product.category_id, organization_id=organization_id) is None:
        raise CategoryNotFoundException(product.category_id)

    created_product = product_repository.create_product(db, product, organization_id=organization_id)
    
    # Log audit
    audit_service.log_action(
        db=db,
        user_id=user_id,
        action=ActionType.CREATE,
        entity_type=EntityType.PRODUCT,
        entity_id=created_product.id,
        details={"name": created_product.name, "sku": created_product.sku},
        organization_id=organization_id,
    )
    
    return created_product


def list_products(db: Session, organization_id: int) -> list[product_model.Product]:
    """
    List all products in the database for an organization.

    Args:
        db: Database session.
        organization_id: ID of the organization.

    Returns:
        A list of all Product ORM instances.
    """
    return product_repository.list_products(db, organization_id=organization_id)


def get_product(db: Session, product_id: int, organization_id: int) -> product_model.Product:
    """
    Retrieve a specific product by ID.

    Args:
        db: Database session.
        product_id: The ID of the product to retrieve.
        organization_id: ID of the organization.

    Returns:
        The Product ORM instance.

    Raises:
        HTTPException(404): If the product is not found.
    """
    db_product = product_repository.get_product_by_id(db, product_id, organization_id=organization_id)
    if db_product is None:
        raise ProductNotFoundException(product_id)
    return db_product


def search_products(
    db: Session,
    organization_id: int,
    *,
    search: str | None = None,
    category_id: int | None = None,
    stock_status: str | None = None,  # "out" | "low" | "ok"
    price_min: float | None = None,
    price_max: float | None = None,
) -> list[product_model.Product]:
    """
    Search for products based on various filters.

    Args:
        db: Database session.
        organization_id: ID of the organization.
        name: Partial match for product name (case-insensitive).
        sku: Partial match for product SKU (case-insensitive).
        category_id: Filter by specific category ID.
        low_stock_only: If True, returns only products where quantity <= alert_level.

    Returns:
        A list of Product ORM instances matching the criteria.
    """
    from .product_filters import build_product_filters

    stmt = build_product_filters(
        organization_id=organization_id,
        stock_status=stock_status,
        price_min=price_min,
        price_max=price_max,
        category_id=category_id,
        search=search,
    )
    return db.scalars(stmt).all()


def update_product(
    db: Session,
    product_id: int,
    product_in: product_model.ProductUpdate,
    organization_id: int,
    user_id: int | None = None
) -> product_model.Product:
    """
    Update an existing product.

    Validates that stock changes are not attempted directly (must use movements),
    SKU uniqueness is maintained, and category exists if changed.

    Args:
        db: Database session.
        product_id: ID of the product to update.
        product_in: Schema with fields to update.
        organization_id: ID of the organization.
        user_id: ID of the user updating the product (for audit).

    Returns:
        The updated Product ORM instance.

    Raises:
        HTTPException(400): If direct stock change attempted or SKU conflict.
        HTTPException(404): If product or new category not found.
    """
    db_product = get_product(db, product_id, organization_id=organization_id)

    if product_in.quantity is not None and product_in.quantity != db_product.quantity:
        raise ValidationException("Stock changes must be performed via movements")

    if product_in.sku and product_in.sku != db_product.sku:
        existing = product_repository.get_product_by_sku(db, sku=product_in.sku, organization_id=organization_id)
        if existing and existing.id != db_product.id:
            raise DuplicateSKUException(product_in.sku)

    if product_in.category_id is not None and product_in.category_id != db_product.category_id:
        if category_repository.get_category_by_id(db, category_id=product_in.category_id, organization_id=organization_id) is None:
            raise CategoryNotFoundException(product_in.category_id)

    updated_product = product_repository.update_product(db, db_product=db_product, product_in=product_in)
    
    # Log audit
    audit_service.log_action(
        db=db,
        user_id=user_id,
        action=ActionType.UPDATE,
        entity_type=EntityType.PRODUCT,
        entity_id=updated_product.id,
        details={"name": updated_product.name},
        organization_id=organization_id,
    )
    
    return updated_product


def delete_product(
    db: Session,
    product_id: int,
    organization_id: int,
    user_id: int | None = None
) -> product_model.Product:
    """
    Delete a product by ID.

    Args:
        db: Database session.
        product_id: ID of the product to delete.
        organization_id: ID of the organization.
        user_id: ID of the user deleting the product (for audit).

    Returns:
        The deleted Product ORM instance.

    Raises:
        HTTPException(404): If the product is not found.
    """
    db_product = get_product(db, product_id, organization_id=organization_id)
    
    # Log audit before deletion
    audit_service.log_action(
        db=db,
        user_id=user_id,
        action=ActionType.DELETE,
        entity_type=EntityType.PRODUCT,
        entity_id=db_product.id,
        details={"name": db_product.name, "sku": db_product.sku},
        organization_id=organization_id,
    )
    
    return product_repository.delete_product(db, db_product=db_product, user_id=user_id)


def get_low_stock_products(db: Session, organization_id: int) -> list[product_model.Product]:
    """
    Retrieve all products where quantity is less than or equal to alert_level.

    Args:
        db: Database session.
        organization_id: ID of the organization.

    Returns:
        List of low stock Product ORM instances.
    """
    return product_repository.get_low_stock_products(db, organization_id=organization_id)


def get_out_of_stock_products(db: Session, organization_id: int) -> list[product_model.Product]:
    """
    Retrieve all products where quantity is zero.

    Args:
        db: Database session.
        organization_id: ID of the organization.

    Returns:
        List of out-of-stock Product ORM instances.
    """
    return product_repository.get_out_of_stock_products(db, organization_id=organization_id)
