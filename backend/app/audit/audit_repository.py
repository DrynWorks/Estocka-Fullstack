"""Repository layer for audit logs."""

from __future__ import annotations

from sqlalchemy import select, desc
from sqlalchemy.orm import Session

from . import audit_model


def create_audit_log(
    db: Session,
    log: audit_model.AuditLogCreate,
    organization_id: int | None = None,
) -> audit_model.AuditLog:
    """
    Create a new audit log entry.

    Args:
        db: Database session.
        log: Audit log creation schema.
        organization_id: Organization ID for isolation.

    Returns:
        The created AuditLog ORM instance.
    """
    db_log = audit_model.AuditLog(
        user_id=log.user_id,
        action=log.action.value,
        entity_type=log.entity_type.value,
        entity_id=log.entity_id,
        details=log.details,
        organization_id=organization_id,
    )
    db.add(db_log)
    db.commit()
    db.refresh(db_log)
    return db_log


def list_audit_logs(
    db: Session,
    filters: audit_model.AuditLogFilter,
    limit: int = 50,
    offset: int = 0
) -> list[audit_model.AuditLog]:
    """
    List audit logs with optional filters.

    Args:
        db: Database session.
        filters: Filter criteria.
        limit: Maximum number of results.
        offset: Pagination offset.

    Returns:
        List of AuditLog ORM instances.
    """
    query = select(audit_model.AuditLog).order_by(desc(audit_model.AuditLog.created_at))

    if filters.user_id is not None:
        query = query.where(audit_model.AuditLog.user_id == filters.user_id)
    
    if filters.action is not None:
        query = query.where(audit_model.AuditLog.action == filters.action.value)
    
    if filters.entity_type is not None:
        query = query.where(audit_model.AuditLog.entity_type == filters.entity_type.value)
    
    if filters.start_date is not None:
        query = query.where(audit_model.AuditLog.created_at >= filters.start_date)
    
    if filters.end_date is not None:
        query = query.where(audit_model.AuditLog.created_at <= filters.end_date)

    query = query.limit(limit).offset(offset)
    
    return list(db.execute(query).scalars().all())
