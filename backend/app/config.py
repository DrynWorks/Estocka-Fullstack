"""Application configuration loaded from environment variables."""

from __future__ import annotations

from functools import lru_cache

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Centralized application settings."""

    secret_key: str = Field(..., alias="SECRET_KEY")
    database_url: str = Field(default="sqlite:///./estocka_dev.db", alias="DATABASE_URL")
    seed_on_start: bool = Field(default=True, alias="SEED_ON_START")
    frontend_url: str = Field(default="http://localhost:5173", alias="FRONTEND_URL")

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")


@lru_cache()
def get_settings() -> Settings:
    """Return cached settings instance with normalized values.

    In particular, normalize DATABASE_URL for providers like Render that
    still expose URLs starting with ``postgres://`` instead of
    ``postgresql://``, which is what SQLAlchemy expects.
    """
    settings = Settings()

    # Normalize legacy postgres scheme for SQLAlchemy compatibility.
    if settings.database_url.startswith("postgres://"):
        settings.database_url = settings.database_url.replace("postgres://", "postgresql://", 1)

    return settings
