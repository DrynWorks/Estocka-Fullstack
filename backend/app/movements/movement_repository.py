"""Data repository for stock movements."""

from __future__ import annotations

from typing import List

from sqlalchemy import and_, select
from sqlalchemy.orm import Session, joinedload

from app.products.product_model import Product

from . import movement_model


def create_movement(
    db: Session,
    movement: movement_model.MovementCreate,
    *,
    created_by_user_id: int | None = None,
) -> movement_model.Movement:
    """Persist a movement record."""
    db_movement = movement_model.Movement(
        product_id=movement.product_id,
        type=movement.type,
        quantity=movement.quantity,
        reason=movement.reason,
        note=movement.note,
        created_by_id=created_by_user_id,
    )
    db.add(db_movement)
    db.flush()
    db.refresh(db_movement)
    return db_movement


def list_movements(db: Session) -> List[movement_model.Movement]:
    """Return all movements ordered by creation date."""
    return (
        db.query(movement_model.Movement)
        .options(joinedload(movement_model.Movement.product).joinedload(Product.category))
        .options(joinedload(movement_model.Movement.created_by))
        .order_by(movement_model.Movement.created_at.desc())
        .all()
    )


def list_recent_movements(db: Session, limit: int = 50) -> List[movement_model.Movement]:
    """Return the latest movements limited by the provided size."""
    return (
        db.query(movement_model.Movement)
        .options(joinedload(movement_model.Movement.product).joinedload(Product.category))
        .options(joinedload(movement_model.Movement.created_by))
        .order_by(movement_model.Movement.created_at.desc())
        .limit(limit)
        .all()
    )


def filter_movements(
    db: Session,
    filters: movement_model.MovementFilter,
    *,
    limit: int | None = None,
    offset: int | None = None,
):
    """Filter movements by date, type, and product."""
    query = (
        select(movement_model.Movement)
        .options(joinedload(movement_model.Movement.product).joinedload(Product.category))
        .options(joinedload(movement_model.Movement.created_by))
        .order_by(movement_model.Movement.created_at.desc())
    )

    conditions = []
    if filters.start_date:
        conditions.append(movement_model.Movement.created_at >= filters.start_date)
    if filters.end_date:
        conditions.append(movement_model.Movement.created_at <= filters.end_date)
    if filters.type:
        conditions.append(movement_model.Movement.type == filters.type)
    if filters.product_id:
        conditions.append(movement_model.Movement.product_id == filters.product_id)

    if conditions:
        query = query.where(and_(*conditions))

    if offset:
        query = query.offset(offset)
    if limit:
        query = query.limit(limit)

    return db.execute(query).scalars().all()


def get_movement_by_id(db: Session, movement_id: int) -> movement_model.Movement | None:
    """Return a movement by its identifier."""
    return (
        db.query(movement_model.Movement)
        .options(joinedload(movement_model.Movement.product).joinedload(Product.category))
        .options(joinedload(movement_model.Movement.created_by))
        .filter(movement_model.Movement.id == movement_id)
        .first()
    )
