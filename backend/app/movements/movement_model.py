"""Models and schemas for stock movements."""

from __future__ import annotations

from datetime import datetime
from enum import Enum
from typing import Optional

from pydantic import BaseModel, ConfigDict, Field
from sqlalchemy import Column, DateTime, Enum as SqlEnum, ForeignKey, Integer, String, Text
from sqlalchemy.orm import relationship

from app.database import Base
from app.products.product_model import ProductPublic
from app.users.user_model import UserPublic


class MovementType(str, Enum):
    ENTRADA = "entrada"
    SAIDA = "saida"


class Movement(Base):
    """SQLAlchemy model for the movements table."""

    __tablename__ = "movements"

    id = Column(Integer, primary_key=True, index=True)
    product_id = Column(Integer, ForeignKey("products.id"), nullable=False, index=True)
    type = Column(SqlEnum(MovementType, name="movement_type", native_enum=False), nullable=False)
    quantity = Column(Integer, nullable=False)
    reason = Column(String(150), nullable=True)
    note = Column(Text, nullable=True)
    created_at = Column(DateTime, nullable=False, default=datetime.utcnow)
    created_by_id = Column(Integer, ForeignKey("users.id"), nullable=True)

    product = relationship("Product", back_populates="movements", lazy="joined")
    created_by = relationship("User", back_populates="movements", lazy="joined")


class MovementCreate(BaseModel):
    product_id: int
    type: MovementType
    quantity: int = Field(gt=0)
    reason: Optional[str] = Field(default=None, max_length=150)
    note: Optional[str] = None


class MovementFilter(BaseModel):
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    type: Optional[MovementType] = None
    product_id: Optional[int] = None


class MovementPublic(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    product_id: int
    type: MovementType
    quantity: int
    reason: Optional[str] = None
    note: Optional[str] = None
    created_at: datetime
    product: ProductPublic
    created_by: Optional[UserPublic] = None
