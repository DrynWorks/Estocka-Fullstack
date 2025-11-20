"""Business rules for stock movements."""

from __future__ import annotations

from contextlib import nullcontext

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.products import product_repository
from . import movement_model, movement_repository


def create_movement(
    db: Session,
    movement: movement_model.MovementCreate,
    *,
    created_by_user_id: int | None = None,
    manage_transaction: bool = True,
) -> movement_model.Movement:
    """Register a movement and adjust product stock."""
    transaction_ctx = db.begin() if manage_transaction else nullcontext()
    with transaction_ctx:
        product = product_repository.get_product_by_id(db, product_id=movement.product_id)
        if product is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Product not found")

        # NOTE: When using PostgreSQL, consider issuing a SELECT ... FOR UPDATE here to lock the product row.

        if movement.type == movement_model.MovementType.SAIDA:
            if product.quantity < movement.quantity:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Insufficient stock for the requested movement",
                )
            product.quantity -= movement.quantity
        else:
            product.quantity += movement.quantity

        db_movement = movement_repository.create_movement(
            db,
            movement,
            created_by_user_id=created_by_user_id,
        )

    db.refresh(product)
    return db_movement


def list_movements(db: Session) -> list[movement_model.Movement]:
    """List all movements."""
    return movement_repository.list_movements(db)


def list_recent_movements(db: Session, limit: int = 50) -> list[movement_model.Movement]:
    """List recent movements with a limit."""
    return movement_repository.list_recent_movements(db, limit=limit)


def filter_movements(
    db: Session,
    filters: movement_model.MovementFilter,
    *,
    limit: int | None = None,
    offset: int | None = None,
) -> list[movement_model.Movement]:
    """Filter movements by provided criteria."""
    return movement_repository.filter_movements(db, filters, limit=limit, offset=offset)


def get_movement(db: Session, movement_id: int) -> movement_model.Movement:
    """Retrieve a movement by ID or raise 404."""
    db_movement = movement_repository.get_movement_by_id(db, movement_id=movement_id)
    if db_movement is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Movement not found")
    return db_movement


def revert_movement(
    db: Session,
    movement_id: int,
    *,
    created_by_user_id: int,
) -> movement_model.Movement:
    """Create a reverse movement and adjust stock accordingly."""
    original = get_movement(db, movement_id)

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
        created_by_user_id=created_by_user_id,
    )
