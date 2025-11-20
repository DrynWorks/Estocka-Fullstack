"""Database configuration module."""

from __future__ import annotations

from typing import Generator

from sqlalchemy import create_engine
from sqlalchemy.engine import Engine
from sqlalchemy.orm import Session, declarative_base, sessionmaker

from app.config import get_settings

settings = get_settings()

SQLALCHEMY_DATABASE_URL = settings.database_url

engine_kwargs: dict[str, object] = {}
if SQLALCHEMY_DATABASE_URL.startswith("sqlite"):
    engine_kwargs["connect_args"] = {"check_same_thread": False}

# Engine manages all database connections.
engine: Engine = create_engine(SQLALCHEMY_DATABASE_URL, **engine_kwargs)

# Session factory per request.
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Base class for SQLAlchemy models.
Base = declarative_base()


def get_db() -> Generator[Session, None, None]:
    """Yield a database session per HTTP request."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
