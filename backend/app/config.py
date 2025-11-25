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
    """Return cached settings instance."""
    return Settings()
