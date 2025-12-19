"""Models and schemas for categories."""

from __future__ import annotations

from typing import TYPE_CHECKING, Optional

from pydantic import BaseModel, ConfigDict, Field
from sqlalchemy import Column, ForeignKey, Integer, String, UniqueConstraint
from sqlalchemy.orm import relationship

from app.database import Base

if TYPE_CHECKING:
    from app.organizations.organization_model import Organization


class Category(Base):
    """SQLAlchemy model for the categories table."""

    __tablename__ = "categories"
    __table_args__ = (
        UniqueConstraint('name', 'organization_id', name='uq_category_name_org'),
    )

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(120), index=True, nullable=False)
    description = Column(String(255), nullable=True)
    organization_id = Column(Integer, ForeignKey("organizations.id"), nullable=False, index=True)

    products = relationship("Product", back_populates="category", lazy="selectin")
    organization = relationship("Organization", back_populates="categories")


class CategoryBase(BaseModel):
    name: str = Field(min_length=3, max_length=120)
    description: Optional[str] = Field(default=None, max_length=255)


class CategoryCreate(CategoryBase):
    pass


class CategoryUpdate(BaseModel):
    name: Optional[str] = Field(default=None, min_length=3, max_length=120)
    description: Optional[str] = Field(default=None, max_length=255)


class CategoryPublic(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    description: Optional[str] = None
