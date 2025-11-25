"""API endpoints for audit logs."""

from __future__ import annotations

from datetime import datetime
from typing import Annotated

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.database import get_db
from app.auth.auth_service import get_current_user
from app.users.user_model import User
from . import audit_model, audit_service

router = APIRouter(prefix="/audit", tags=["audit"])


@router.get("/logs", response_model=list[audit_model.AuditLogPublic])
def get_audit_logs(
    user_id: int | None = Query(None, description="Filter by user ID"),
    action: audit_model.ActionType | None = Query(None, description="Filter by action type"),
    entity_type: audit_model.EntityType | None = Query(None, description="Filter by entity type"),
    start_date: datetime | None = Query(None, description="Filter from date"),
    end_date: datetime | None = Query(None, description="Filter to date"),
    limit: int = Query(50, ge=1, le=100, description="Max results"),
    offset: int = Query(0, ge=0, description="Pagination offset"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get audit logs with optional filters.
    
    Requires authentication.
    """
    filters = audit_model.AuditLogFilter(
        user_id=user_id,
        action=action,
        entity_type=entity_type,
        start_date=start_date,
        end_date=end_date
    )
    return audit_service.get_audit_logs(db, filters, limit, offset)
