"""Models and schemas for products."""

from __future__ import annotations

import re
from decimal import Decimal
from typing import TYPE_CHECKING, Optional

from pydantic import BaseModel, ConfigDict, Field, field_validator, model_validator
from sqlalchemy import Column, ForeignKey, Integer, Numeric, String, UniqueConstraint
from sqlalchemy.orm import relationship

from app.categories.category_model import CategoryPublic
from app.database import Base

if TYPE_CHECKING:
    from app.organizations.organization_model import Organization


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
    organization_id = Column(Integer, ForeignKey("organizations.id"), nullable=False, index=True)

    category = relationship("Category", back_populates="products", lazy="joined")
    organization = relationship("Organization", back_populates="products")
    movements = relationship(
        "Movement",
        back_populates="product",
        cascade="all, delete-orphan",
        lazy="selectin",
    )


class ProductBase(BaseModel):
    name: str = Field(min_length=2, max_length=150, description="Nome do produto")
    sku: str = Field(
        min_length=3,
        max_length=80,
        description="Código SKU único (apenas letras maiúsculas, números e hífen)"
    )
    price: Decimal = Field(gt=0, description="Preço de venda (deve ser maior que zero)")
    cost_price: Decimal = Field(gt=0, description="Preço de custo (deve ser maior que zero)")
    quantity: int = Field(ge=0, description="Quantidade em estoque")
    alert_level: int = Field(ge=0, description="Nível de alerta de estoque baixo")
    lead_time: int = Field(ge=0, default=0, description="Tempo de reposição em dias")
    category_id: int

    @field_validator('sku')
    @classmethod
    def validate_sku_format(cls, v: str) -> str:
        """Valida que SKU contém apenas letras maiúsculas, números e hífen."""
        if not re.match(r'^[A-Z0-9\-]+$', v):
            raise ValueError(
                'SKU deve conter apenas letras MAIÚSCULAS, números e hífen. '
                f'SKU inválido: {v}'
            )
        return v


class ProductCreate(ProductBase):
    @model_validator(mode='after')
    def validate_price_greater_than_cost(self):
        """Valida que preço de venda é maior que preço de custo."""
        if self.price <= self.cost_price:
            raise ValueError(
                f'Preço de venda (R$ {self.price}) deve ser maior que '
                f'preço de custo (R$ {self.cost_price})'
            )
        return self


class ProductUpdate(BaseModel):
    name: Optional[str] = Field(default=None, min_length=2, max_length=150)
    sku: Optional[str] = Field(
        default=None,
        min_length=3,
        max_length=80,
        description="Código SKU único (apenas letras maiúsculas, números e hífen)"
    )
    price: Optional[Decimal] = Field(default=None, gt=0)
    cost_price: Optional[Decimal] = Field(default=None, gt=0)
    quantity: Optional[int] = Field(default=None, ge=0)
    alert_level: Optional[int] = Field(default=None, ge=0)
    lead_time: Optional[int] = Field(default=None, ge=0)
    category_id: Optional[int] = None

    @field_validator('sku')
    @classmethod
    def validate_sku_format(cls, v: Optional[str]) -> Optional[str]:
        """Valida que SKU contém apenas letras maiúsculas, números e hífen."""
        if v is not None and not re.match(r'^[A-Z0-9\-]+$', v):
            raise ValueError(
                'SKU deve conter apenas letras MAIÚSCULAS, números e hífen. '
                f'SKU inválido: {v}'
            )
        return v

    @model_validator(mode='after')
    def validate_price_greater_than_cost(self):
        """Valida que preço de venda é maior que preço de custo (se ambos fornecidos)."""
        if self.price is not None and self.cost_price is not None:
            if self.price <= self.cost_price:
                raise ValueError(
                    f'Preço de venda (R$ {self.price}) deve ser maior que '
                    f'preço de custo (R$ {self.cost_price})'
                )
        return self


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
