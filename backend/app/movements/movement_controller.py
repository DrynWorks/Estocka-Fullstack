"""Movement endpoints."""

from __future__ import annotations

from datetime import datetime
from typing import List

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.auth.auth_service import get_current_user, require_role
from app.database import get_db
from app.users.user_model import User
from . import movement_model, movement_service

router = APIRouter(
    prefix="/movements",
    tags=["Movements"],
    dependencies=[Depends(get_current_user)],
)


@router.post(
    "/",
    response_model=movement_model.MovementPublic,
    status_code=status.HTTP_201_CREATED,
)
def create_movement(
    movement: movement_model.MovementCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("admin")),
):
    """Register a stock movement (admin only)."""
    return movement_service.create_movement(
        db,
        movement,
        created_by_user_id=current_user.id,
    )


@router.post(
    "/revert/{movement_id}",
    response_model=movement_model.MovementPublic,
    status_code=status.HTTP_201_CREATED,
)
def revert_movement(
    movement_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("admin")),
):
    """Generate the reverse movement for the provided identifier (admin only)."""
    return movement_service.revert_movement(
        db,
        movement_id,
        created_by_user_id=current_user.id,
    )


@router.put("/{movement_id}")
def forbid_update(movement_id: int) -> None:
    """Movements cannot be updated."""
    raise HTTPException(
        status_code=status.HTTP_405_METHOD_NOT_ALLOWED,
        detail="Movements are immutable",
    )


@router.delete("/{movement_id}")
def forbid_delete(movement_id: int) -> None:
    """Movements cannot be deleted."""
    raise HTTPException(
        status_code=status.HTTP_405_METHOD_NOT_ALLOWED,
        detail="Movements are immutable",
    )


@router.get("/", response_model=List[movement_model.MovementPublic])
def list_movements(db: Session = Depends(get_db)):
    """List every movement."""
    return movement_service.list_movements(db)


@router.get("/history", response_model=List[movement_model.MovementPublic])
def list_recent_movements(
    limit: int = Query(default=100, ge=1, le=500, description="Maximum number of records"),
    db: Session = Depends(get_db),
):
    """List the most recent movements."""
    return movement_service.list_recent_movements(db, limit=limit)


@router.get("/recent", response_model=List[movement_model.MovementPublic])
def get_recent_movements(
    limit: int = Query(default=10, ge=1, le=500, description="Maximum number of records"),
    db: Session = Depends(get_db),
):
    """Get recent movements (alias for /history)."""
    return movement_service.list_recent_movements(db, limit=limit)


@router.get("/filter", response_model=List[movement_model.MovementPublic])
def filter_movements(
    start_date: datetime | None = Query(default=None),
    end_date: datetime | None = Query(default=None),
    movement_type: movement_model.MovementType | None = Query(default=None, alias="type"),
    product_id: int | None = Query(default=None),
    db: Session = Depends(get_db),
):
    """Filter movements by date, type, and product."""
    filters = movement_model.MovementFilter(
        start_date=start_date,
        end_date=end_date,
        type=movement_type,
        product_id=product_id,
    )
    return movement_service.filter_movements(db, filters)
