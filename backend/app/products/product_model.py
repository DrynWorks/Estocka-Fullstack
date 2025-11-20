"""Models and schemas for products."""

from __future__ import annotations

from decimal import Decimal
from typing import Optional

from pydantic import BaseModel, ConfigDict, Field
from sqlalchemy import Column, ForeignKey, Integer, Numeric, String, UniqueConstraint
from sqlalchemy.orm import relationship

from app.categories.category_model import CategoryPublic
from app.database import Base


class Product(Base):
    """SQLAlchemy model for the products table."""

    __tablename__ = "products"
    __table_args__ = (UniqueConstraint("sku", name="uq_products_sku"),)

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(150), nullable=False, index=True)
    sku = Column(String(80), nullable=False, unique=True, index=True)
    price = Column(Numeric(10, 2), nullable=False, default=0)
    cost_price = Column(Numeric(10, 2), nullable=False, default=0)
    quantity = Column(Integer, nullable=False, default=0)
    alert_level = Column(Integer, nullable=False, default=0)
    lead_time = Column(Integer, nullable=False, default=0)  # Days to restock
    category_id = Column(Integer, ForeignKey("categories.id"), nullable=False)

    category = relationship("Category", back_populates="products", lazy="joined")
    movements = relationship(
        "Movement",
        back_populates="product",
        cascade="all, delete-orphan",
        lazy="selectin",
    )


class ProductBase(BaseModel):
    name: str = Field(min_length=2, max_length=150)
    sku: str = Field(min_length=3, max_length=80)
    price: Decimal = Field(ge=0)
    cost_price: Decimal = Field(ge=0, default=Decimal("0.00"))
    quantity: int = Field(ge=0)
    alert_level: int = Field(ge=0)
    lead_time: int = Field(ge=0, default=0)
    category_id: int


class ProductCreate(ProductBase):
    pass


class ProductUpdate(BaseModel):
    name: Optional[str] = Field(default=None, min_length=2, max_length=150)
    sku: Optional[str] = Field(default=None, min_length=3, max_length=80)
    price: Optional[Decimal] = Field(default=None, ge=0)
    cost_price: Optional[Decimal] = Field(default=None, ge=0)
    quantity: Optional[int] = Field(default=None, ge=0)
    alert_level: Optional[int] = Field(default=None, ge=0)
    lead_time: Optional[int] = Field(default=None, ge=0)
    category_id: Optional[int] = None


class ProductPublic(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    sku: str
    price: float
    cost_price: float
    quantity: int
    alert_level: int
    lead_time: int
    category: CategoryPublic
