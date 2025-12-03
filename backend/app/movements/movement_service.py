"""Business rules for stock movements."""

from __future__ import annotations

from contextlib import nullcontext

from sqlalchemy.orm import Session

from app import constants
from app.audit import audit_service
from app.audit.audit_model import ActionType, EntityType
from app.exceptions import ProductNotFoundException, InsufficientStockException, NotFoundException
from app.products import product_repository
from . import movement_model, movement_repository


def create_movement(
    db: Session,
    movement: movement_model.MovementCreate,
    organization_id: int,
    *,
    created_by_user_id: int | None = None,
    manage_transaction: bool = True,
) -> movement_model.Movement:
    """
    Register a new stock movement and update product quantity.

    Handles both 'entrada' (inbound) and 'saida' (outbound) movements.
    Validates sufficient stock for outbound movements.

    Args:
        db: Database session.
        movement: Movement creation schema.
        organization_id: ID of the organization.
        created_by_user_id: ID of the user creating the movement.
        manage_transaction: If True, manages the database transaction.

    Returns:
        The created Movement ORM instance.

    Raises:
        HTTPException(404): If the product is not found.
        HTTPException(400): If insufficient stock for outbound movement.
    """
    if manage_transaction:
        # Avoid starting a nested transaction when one is already active
        if db.in_transaction():
            transaction_ctx = db.begin_nested()
        else:
            transaction_ctx = db.begin()
    else:
        transaction_ctx = nullcontext()
    with transaction_ctx:
        product = product_repository.get_product_by_id(db, product_id=movement.product_id, organization_id=organization_id)
        if product is None:
            raise ProductNotFoundException(movement.product_id)

        # NOTE: When using PostgreSQL, consider issuing a SELECT ... FOR UPDATE here to lock the product row.

        if movement.type == movement_model.MovementType.SAIDA:
            if product.quantity < movement.quantity:
                raise InsufficientStockException(
                    product_name=product.name,
                    available=product.quantity,
                    requested=movement.quantity
                )
            product.quantity -= movement.quantity
        else:
            product.quantity += movement.quantity

        db_movement = movement_repository.create_movement(
            db,
            movement,
            organization_id=organization_id,
            created_by_user_id=created_by_user_id,
        )
        
        # Log audit
        audit_service.log_action(
            db=db,
            user_id=created_by_user_id,
            action=ActionType.CREATE,
            entity_type=EntityType.MOVEMENT,
            entity_id=db_movement.id,
            details={
                "type": movement.type.value,
                "product_id": movement.product_id,
                "quantity": movement.quantity,
                "reason": movement.reason
            },
            organization_id=organization_id,
        )

    db.refresh(product)
    return db_movement


def list_movements(db: Session, organization_id: int) -> list[movement_model.Movement]:
    """
    List all stock movements for an organization.

    Args:
        db: Database session.
        organization_id: ID of the organization.

    Returns:
        List of all Movement ORM instances.
    """
    return movement_repository.list_movements(db, organization_id=organization_id)


def list_recent_movements(db: Session, organization_id: int, limit: int = constants.DEFAULT_PAGE_SIZE) -> list[movement_model.Movement]:
    """
    List the most recent stock movements for an organization.

    Args:
        db: Database session.
        organization_id: ID of the organization.
        limit: Maximum number of movements to return (default: 50).

    Returns:
        List of recent Movement ORM instances.
    """
    return movement_repository.list_recent_movements(db, organization_id=organization_id, limit=limit)


def filter_movements(
    db: Session,
    organization_id: int,
    filters: movement_model.MovementFilter,
    *,
    limit: int | None = None,
    offset: int | None = None,
) -> list[movement_model.Movement]:
    """
    Filter movements based on criteria for an organization.

    Args:
        db: Database session.
        organization_id: ID of the organization.
        filters: Filter criteria (date range, type, product, etc.).
        limit: Max results to return.
        offset: Pagination offset.

    Returns:
        List of filtered Movement ORM instances.
    """
    return movement_repository.filter_movements(db, organization_id=organization_id, filters=filters, limit=limit, offset=offset)


def get_movement(db: Session, movement_id: int, organization_id: int) -> movement_model.Movement:
    """
    Retrieve a specific movement by ID.

    Args:
        db: Database session.
        movement_id: ID of the movement.
        organization_id: ID of the organization.

    Returns:
        The Movement ORM instance.

    Raises:
        HTTPException(404): If the movement is not found.
    """
    db_movement = movement_repository.get_movement_by_id(db, movement_id=movement_id, organization_id=organization_id)
    if db_movement is None:
        raise NotFoundException("Movement", movement_id)
    return db_movement


def revert_movement(
    db: Session,
    movement_id: int,
    organization_id: int,
    *,
    created_by_user_id: int,
) -> movement_model.Movement:
    """
    Create a reverse movement to undo a previous stock action.

    If the original was an 'entrada', creates a 'saida', and vice-versa.
    The quantity remains the same.

    Args:
        db: Database session.
        movement_id: ID of the movement to revert.
        organization_id: ID of the organization.
        created_by_user_id: ID of the user performing the reversion.

    Returns:
        The newly created reverse Movement ORM instance.

    Raises:
        HTTPException(404): If the original movement is not found.
        HTTPException(400): If reverting would cause negative stock.
    """
    original = get_movement(db, movement_id, organization_id=organization_id)

    inverse_type = (
        movement_model.MovementType.ENTRADA
        if original.type == movement_model.MovementType.SAIDA
        else movement_model.MovementType.SAIDA
    )

    reverse_payload = movement_model.MovementCreate(
        product_id=original.product_id,
        type=inverse_type,
        quantity=original.quantity,
        reason="revert",
        note=f"Revert of movement {original.id}",
    )

    return create_movement(
        db,
        reverse_payload,
        organization_id=organization_id,
        created_by_user_id=created_by_user_id,
    )
