"""Audit log models for tracking user actions."""

from __future__ import annotations

from datetime import datetime
from enum import Enum

from sqlalchemy import Column, Integer, String, DateTime, JSON, ForeignKey
from sqlalchemy.orm import relationship
from pydantic import BaseModel, ConfigDict

from app.database import Base


class ActionType(str, Enum):
    """Types of actions that can be audited."""
    CREATE = "create"
    UPDATE = "update"
    DELETE = "delete"


class EntityType(str, Enum):
    """Types of entities that can be audited."""
    PRODUCT = "product"
    MOVEMENT = "movement"
    CATEGORY = "category"
    USER = "user"


class AuditLog(Base):
    """
    Audit log table for tracking user actions.
    
    Records who did what, when, and on which entity.
    """
    __tablename__ = "audit_logs"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    organization_id = Column(Integer, ForeignKey("organizations.id"), nullable=False, index=True)
    action = Column(String, nullable=False)  # ActionType
    entity_type = Column(String, nullable=False)  # EntityType
    entity_id = Column(Integer, nullable=True)  # ID of the affected entity
    details = Column(JSON, nullable=True)  # Additional context (e.g., old vs new values)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    # Relationships
    user = relationship("User", foreign_keys=[user_id])
    organization = relationship("Organization", back_populates="audit_logs")


# Pydantic schemas

class AuditLogBase(BaseModel):
    """Base schema for audit logs."""
    action: ActionType
    entity_type: EntityType
    entity_id: int | None = None
    details: dict | None = None

    model_config = ConfigDict(from_attributes=True)


class AuditLogCreate(AuditLogBase):
    """Schema for creating an audit log entry."""
    user_id: int | None = None


class AuditLogPublic(AuditLogBase):
    """Public schema for audit logs."""
    id: int
    user_id: int | None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class AuditLogFilter(BaseModel):
    """Filter for querying audit logs."""
    user_id: int | None = None
    action: ActionType | None = None
    entity_type: EntityType | None = None
    start_date: datetime | None = None
    end_date: datetime | None = None
