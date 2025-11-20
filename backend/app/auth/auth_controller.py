"""Authentication endpoints."""

from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session

from app.database import get_db
from app.security import create_access_token
from app.users.user_model import User, UserPublic
from . import auth_service
from .auth_model import TokenResponse

router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post("/login", response_model=TokenResponse)
def login_for_access_token(
    db: Session = Depends(get_db),
    form_data: OAuth2PasswordRequestForm = Depends(),
) -> TokenResponse:
    """Authenticate a user and return the JWT token."""
    user = auth_service.authenticate_user(db, email=form_data.username, password=form_data.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    token_data = {"sub": user.email, "role": user.role.name}
    access_token = create_access_token(data=token_data)
    return TokenResponse(access_token=access_token)


@router.get("/me", response_model=UserPublic)
def read_current_user(current_user: User = Depends(auth_service.get_current_user)) -> UserPublic:
    """Return the authenticated user details."""
    return current_user
