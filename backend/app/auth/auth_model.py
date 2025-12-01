"""Authentication-related schemas."""

from __future__ import annotations

from pydantic import BaseModel, EmailStr, Field


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"


class SignupRequest(BaseModel):
    """Schema for organization and owner registration."""
    organization_name: str = Field(min_length=3, max_length=255, description="Company/Organization name")
    user_full_name: str = Field(min_length=3, max_length=255, description="Owner's full name")
    user_email: EmailStr = Field(description="Owner's email")
    user_password: str = Field(min_length=8, description="Owner's password")


class SignupResponse(BaseModel):
    """Response after successful signup."""
    access_token: str
    token_type: str = "bearer"
    organization_name: str
    user_email: str
