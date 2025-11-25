"""Business logic for Organization operations."""

from __future__ import annotations

import re
from sqlalchemy.orm import Session

from . import organization_model
from .organization_repository import OrganizationRepository


class OrganizationService:
    """Service for Organization business logic."""

    @staticmethod
    def slugify(text: str) -> str:
        """Convert text to URL-friendly slug."""
        # Convert to lowercase
        text = text.lower()
        # Replace spaces and special chars with hyphens
        text = re.sub(r'[^\w\s-]', '', text)
        text = re.sub(r'[-\s]+', '-', text)
        return text.strip('-')

    @staticmethod
    def get_by_id(db: Session, organization_id: int) -> organization_model.Organization | None:
        """Get organization by ID."""
        return OrganizationRepository.get_by_id(db, organization_id)

    @staticmethod
    def get_by_slug(db: Session, slug: str) -> organization_model.Organization | None:
        """Get organization by slug."""
        return OrganizationRepository.get_by_slug(db, slug)

    @staticmethod
    def get_all(db: Session, skip: int = 0, limit: int = 100) -> list[organization_model.Organization]:
        """Get all organizations."""
        return OrganizationRepository.get_all(db, skip, limit)

    @staticmethod
    def create(
        db: Session,
        name: str,
        slug: str | None = None,
        cnpj: str | None = None
    ) -> organization_model.Organization:
        """
        Create a new organization.
        
        If slug is not provided, it will be auto-generated from the name.
        """
        if not slug:
            slug = OrganizationService.slugify(name)
        
        # Check if slug already exists
        existing = OrganizationRepository.get_by_slug(db, slug)
        if existing:
            # Append a number to make it unique
            counter = 1
            while existing:
                new_slug = f"{slug}-{counter}"
                existing = OrganizationRepository.get_by_slug(db, new_slug)
                counter += 1
            slug = new_slug

        organization = organization_model.Organization(
            name=name,
            slug=slug,
            cnpj=cnpj,
            active=True
        )
        
        return OrganizationRepository.create(db, organization)

    @staticmethod
    def update(
        db: Session,
        organization: organization_model.Organization,
        name: str | None = None,
        cnpj: str | None = None,
        active: bool | None = None
    ) -> organization_model.Organization:
        """Update an existing organization."""
        if name is not None:
            organization.name = name
        if cnpj is not None:
            organization.cnpj = cnpj
        if active is not None:
            organization.active = active
        
        return OrganizationRepository.update(db, organization)

    @staticmethod
    def delete(db: Session, organization: organization_model.Organization) -> None:
        """Delete an organization (use with caution!)."""
        OrganizationRepository.delete(db, organization)
