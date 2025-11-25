"""Business logic for audit logging."""

from __future__ import annotations

from sqlalchemy.orm import Session

from . import audit_model, audit_repository


def log_action(
    db: Session,
    user_id: int | None,
    action: audit_model.ActionType,
    entity_type: audit_model.EntityType,
    entity_id: int | None = None,
    details: dict | None = None,
    organization_id: int | None = None,
) -> audit_model.AuditLog:
    """
    Log a user action.

    Args:
        db: Database session.
        user_id: ID of the user performing the action.
        action: Type of action (create/update/delete).
        entity_type: Type of entity affected.
        entity_id: ID of the affected entity.
        details: Additional context (e.g., changed fields).
        organization_id: Organization ID for isolation.

    Returns:
        The created AuditLog instance.
    """
    log = audit_model.AuditLogCreate(
        user_id=user_id,
        action=action,
        entity_type=entity_type,
        entity_id=entity_id,
        details=details
    )
    # Create the audit log directly (repository will handle organization_id)
    return audit_repository.create_audit_log(db, log, organization_id=organization_id)


def get_audit_logs(
    db: Session,
    filters: audit_model.AuditLogFilter,
    limit: int = 50,
    offset: int = 0
) -> list[audit_model.AuditLog]:
    """
    Retrieve audit logs with filters.

    Args:
        db: Database session.
        filters: Filter criteria.
        limit: Maximum results to return.
        offset: Pagination offset.

    Returns:
        List of AuditLog instances.
    """
    return audit_repository.list_audit_logs(db, filters, limit, offset)
