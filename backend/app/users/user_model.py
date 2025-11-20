"""Modelos e schemas da entidade User."""

from __future__ import annotations

from typing import Optional

from pydantic import BaseModel, ConfigDict, EmailStr, Field
from sqlalchemy import Column, ForeignKey, Integer, String, Text
from sqlalchemy.orm import relationship

from app.database import Base
from app.roles.role_model import RolePublic


class User(Base):
    """Modelo ORM da tabela users."""

    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    full_name = Column(String(255), index=True, nullable=True)
    profile_image_url = Column(String(255), nullable=True)
    profile_image_base64 = Column(Text, nullable=True)
    role_id = Column(Integer, ForeignKey("roles.id"), nullable=False)

    role = relationship("Role", back_populates="users")
    movements = relationship("Movement", back_populates="created_by", lazy="selectin")


class UserCreate(BaseModel):
    email: EmailStr
    password: str = Field(min_length=8)
    full_name: Optional[str] = Field(default=None, min_length=3)
    profile_image_url: Optional[str] = None
    profile_image_base64: Optional[str] = Field(
        default=None, description="Profile image encoded as Base64"
    )
    role_id: int = Field(description="Role ID associated with the user")


class UserUpdate(BaseModel):
    full_name: Optional[str] = Field(default=None, min_length=3)
    profile_image_url: Optional[str] = None
    profile_image_base64: Optional[str] = Field(
        default=None, description="Profile image encoded as Base64"
    )
    role_id: Optional[int] = Field(
        default=None, description="New role ID (admin only)"
    )


class UserPublic(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    email: EmailStr
    full_name: Optional[str] = None
    profile_image_url: Optional[str] = None
    profile_image_base64: Optional[str] = None
    role: RolePublic
