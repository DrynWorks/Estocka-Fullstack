"""Authentication endpoints."""

from __future__ import annotations

import logging
from fastapi import APIRouter, Depends, HTTPException, Request, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session

from app.database import get_db
from app.exceptions import InvalidCredentialsException, DuplicateEmailException
from app.security import create_access_token
from app.users.user_model import User, UserPublic
from . import auth_service
from .auth_model import TokenResponse, SignupRequest, SignupResponse

logger = logging.getLogger(__name__)

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
    logger.info(f"Tentativa de signup para organização: {signup_data.organization_name}")
    
    user, organization, access_token = auth_service.signup_new_organization(
        db=db,
        organization_name=signup_data.organization_name,
        user_full_name=signup_data.user_full_name,
        user_email=signup_data.user_email,
        user_password=signup_data.user_password
    )
    
    logger.info(f"✅ Signup bem-sucedido: {user.email} - Org: {organization.name}")
    
    return SignupResponse(
        access_token=access_token,
        token_type="bearer",
        organization_name=organization.name,
        user_email=user.email
    )


@router.post("/login", response_model=TokenResponse)
async def login_for_access_token(
    request: Request,
    db: Session = Depends(get_db),
    form_data: OAuth2PasswordRequestForm = Depends(),
) -> TokenResponse:
    """
    Authenticate a user and return the JWT token.
    
    Rate limited to 5 attempts per minute per IP to prevent brute force attacks.
    """
    logger.info(f"Tentativa de login: {form_data.username}")
    
    user = auth_service.authenticate_user(db, email=form_data.username, password=form_data.password)
    if not user:
        logger.warning(f"❌ Login falhou: credenciais inválidas para {form_data.username}")
        raise InvalidCredentialsException()

    token_data = {"sub": user.email, "role": user.role.name}
    access_token = create_access_token(data=token_data)
    
    logger.info(f"✅ Login bem-sucedido: {user.email}")
    return TokenResponse(access_token=access_token)


@router.get("/me", response_model=UserPublic)
def read_current_user(current_user: User = Depends(auth_service.get_current_user)) -> UserPublic:
    """Return the authenticated user details."""
    return current_user
