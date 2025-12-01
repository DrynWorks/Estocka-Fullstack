"""Authentication endpoints."""

from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session

from app.database import get_db
from app.security import create_access_token
from app.users.user_model import User, UserPublic
from . import auth_service
from .auth_model import TokenResponse, SignupRequest, SignupResponse

router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post("/signup", response_model=SignupResponse, status_code=status.HTTP_201_CREATED)
def signup(
    signup_data: SignupRequest,
    db: Session = Depends(get_db)
) -> SignupResponse:
    """
    Public endpoint to create a new organization and its first user (Owner).
    No authentication required.
    """
    user, organization, access_token = auth_service.signup_new_organization(
        db=db,
        organization_name=signup_data.organization_name,
        user_full_name=signup_data.user_full_name,
        user_email=signup_data.user_email,
        user_password=signup_data.user_password
    )
    
    return SignupResponse(
        access_token=access_token,
        token_type="bearer",
        organization_name=organization.name,
        user_email=user.email
    )


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
