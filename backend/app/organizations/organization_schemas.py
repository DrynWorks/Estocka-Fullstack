"""Organization Pydantic schemas."""

from datetime import datetime
from pydantic import BaseModel, Field


class OrganizationBase(BaseModel):
    """Base organization schema."""
    name: str = Field(..., min_length=1, max_length=255)
    cnpj: str | None = Field(None, max_length=18)


class OrganizationCreate(OrganizationBase):
    """Schema for creating an organization."""
    slug: str = Field(..., min_length=1, max_length=255)


class OrganizationUpdate(BaseModel):
    """Schema for updating an organization."""
    name: str | None = Field(None, min_length=1, max_length=255)
    cnpj: str | None = Field(None, max_length=18)
    active: bool | None = None


class OrganizationPublic(OrganizationBase):
    """Schema for organization public view."""
    id: int
    slug: str
    active: bool
    created_at: datetime

    class Config:
        from_attributes = True
