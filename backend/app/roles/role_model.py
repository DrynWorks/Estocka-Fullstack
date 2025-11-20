"""Modelos e schemas da entidade Role."""

from __future__ import annotations

from pydantic import BaseModel, ConfigDict, Field
from sqlalchemy import Column, Integer, String
from sqlalchemy.orm import relationship

from app.database import Base


class Role(Base):
    """Modelo ORM da tabela roles."""

    __tablename__ = "roles"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(50), unique=True, index=True, nullable=False)

    users = relationship("User", back_populates="role")


class RoleCreate(BaseModel):
    name: str = Field(min_length=3, max_length=50)


class RoleUpdate(BaseModel):
    name: str = Field(min_length=3, max_length=50)


class RolePublic(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
