"""Organization model for multi-tenancy support."""

from __future__ import annotations

from datetime import datetime
from typing import TYPE_CHECKING

from sqlalchemy import Boolean, DateTime, Integer, String, text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base

if TYPE_CHECKING:
    from app.users.user_model import User
    from app.products.product_model import Product
    from app.categories.category_model import Category


class Organization(Base):
    """
    Organization model for multi-tenancy.
    
    Each organization represents a separate company/business using the system.
    All data (products, users, movements) is isolated by organization.
    """
    __tablename__ = "organizations"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    slug: Mapped[str] = mapped_column(String(100), unique=True, nullable=False, index=True)
    cnpj: Mapped[str | None] = mapped_column(String(14), nullable=True)
    active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=text("CURRENT_TIMESTAMP"),
        nullable=False
    )
    
    # Relationships
    users: Mapped[list["User"]] = relationship("User", back_populates="organization")
    products: Mapped[list["Product"]] = relationship("Product", back_populates="organization")
    categories: Mapped[list["Category"]] = relationship("Category", back_populates="organization")
    audit_logs: Mapped[list["AuditLog"]] = relationship("AuditLog", back_populates="organization")

    def __repr__(self) -> str:
        return f"<Organization(id={self.id}, name={self.name}, slug={self.slug})>"
