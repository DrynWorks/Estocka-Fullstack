"""Repository for Organization data access."""

from __future__ import annotations

from sqlalchemy import select
from sqlalchemy.orm import Session

from .organization_model import Organization


class OrganizationRepository:
    """Repository for Organization database operations."""

    @staticmethod
    def get_by_id(db: Session, organization_id: int) -> Organization | None:
        """Get organization by ID."""
        return db.get(Organization, organization_id)

    @staticmethod
    def get_by_slug(db: Session, slug: str) -> Organization | None:
        """Get organization by slug."""
        stmt = select(Organization).where(Organization.slug == slug)
        return db.scalar(stmt)

    @staticmethod
    def get_all(db: Session, skip: int = 0, limit: int = 100) -> list[Organization]:
        """Get all organizations."""
        stmt = select(Organization).offset(skip).limit(limit)
        return list(db.scalars(stmt).all())

    @staticmethod
    def create(db: Session, organization: Organization) -> Organization:
        """Create a new organization."""
        db.add(organization)
        db.commit()
        db.refresh(organization)
        return organization

    @staticmethod
    def update(db: Session, organization: Organization) -> Organization:
        """Update an existing organization."""
        db.commit()
        db.refresh(organization)
        return organization

    @staticmethod
    def delete(db: Session, organization: Organization) -> None:
        """Delete an organization."""
        db.delete(organization)
        db.commit()
