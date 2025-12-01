"""Authentication service utilities."""

from __future__ import annotations

from typing import Callable

from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt
from pydantic import ValidationError
from sqlalchemy.orm import Session
from sqlalchemy import select

from app.database import get_db
from app.security import ALGORITHM, SECRET_KEY, TokenData, verify_password, create_access_token
from app.users import user_repository
from app.users.user_model import User, UserCreate

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login")


def authenticate_user(db: Session, email: str, password: str) -> User | None:
    """Validate user credentials and return the matching user, if any."""
    user = user_repository.get_user_by_email(db, email=email)
    if not user or not verify_password(password, user.hashed_password):
        return None
    return user


def signup_new_organization(
    db: Session,
    organization_name: str,
    user_full_name: str,
    user_email: str,
    user_password: str
):
    """
    Create a new organization and its first user (Admin).
    Returns (user, organization, access_token)
    """
    # Import here to avoid circular imports
    from app.organizations.organization_model import Organization
    from app.roles.role_model import Role
    
    # 1. Check if email already exists
    existing_user = user_repository.get_user_by_email(db, email=user_email)
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )
    
    # 2. Create organization slug from name
    slug = organization_name.lower().replace(" ", "-")[:50]
    
    # Check if organization slug exists
    existing_org = db.execute(
        select(Organization).where(Organization.slug == slug)
    ).scalar_one_or_none()
    
    if existing_org:
        # Add random suffix if slug exists
        import random
        slug = f"{slug}-{random.randint(1000, 9999)}"
    
    # 3. Create organization
    organization = Organization(
        name=organization_name,
        slug=slug,
        active=True
    )
    db.add(organization)
    db.flush()  # Get organization.id
    
    # 4. Ensure "admin" role exists
    admin_role = db.execute(
        select(Role).where(Role.name == "admin")
    ).scalar_one_or_none()
    
    if not admin_role:
        admin_role = Role(name="admin")
        db.add(admin_role)
        db.flush()
    
    # 5. Create admin user
    user_data = UserCreate(
        email=user_email,
        password=user_password,
        full_name=user_full_name,
        role_id=admin_role.id,
        organization_id=organization.id
    )
    
    user = user_repository.create_user(
        db=db,
        user=user_data,
        role_id=admin_role.id,
        commit=False
    )
    
    # 6. Commit all changes
    db.commit()
    db.refresh(user)
    db.refresh(organization)
    
    # 7. Generate access token
    token_data = {"sub": user.email, "role": user.role.name}
    access_token = create_access_token(data=token_data)
    
    return user, organization, access_token


def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)) -> User:
    """Resolve the current authenticated user from the provided JWT token."""
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email = payload.get("sub")
        role = payload.get("role")
        if not isinstance(email, str) or not isinstance(role, str):
            raise credentials_exception
        token_data = TokenData(email=email, role=role)
    except (JWTError, ValidationError):
        raise credentials_exception

    if token_data.email is None:
        raise credentials_exception

    user = user_repository.get_user_by_email(db, email=token_data.email)
    if user is None:
        raise credentials_exception
    return user


def require_role(*allowed_roles: str) -> Callable[[User], User]:
    """Ensure the current user has one of the expected roles before proceeding."""

    def role_checker(current_user: User = Depends(get_current_user)) -> User:
        if not current_user.role or current_user.role.name not in allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Operation not permitted for this user role",
            )
        return current_user

    return role_checker
