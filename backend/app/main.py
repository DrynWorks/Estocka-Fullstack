"""FastAPI application entrypoint for Estocka."""

from __future__ import annotations

import logging
from datetime import datetime
import uvicorn
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from slowapi.util import get_remote_address
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.auth import auth_controller
from app.audit import audit_controller
from app.categories import category_controller
from app.config import get_settings
from app.dashboard import dashboard_controller
from app.database import Base, SessionLocal, engine
from app.exceptions import EstockaException
from app.logging_config import setup_logging
from app.movements import movement_controller
from app.organizations import organization_controller
from app.products import product_controller
from app.reports import report_controller
from app.roles import role_controller
from app.roles.role_model import Role
from app.users import user_controller, user_repository
from app.users.user_model import User, UserCreate

# Setup logging
setup_logging()
logger = logging.getLogger(__name__)

# Application settings control optional bootstrap steps.
settings = get_settings()


def create_all_tables() -> None:
    """Create database tables during application bootstrap (use Alembic in prod)."""
    Base.metadata.create_all(bind=engine)


def ensure_default_roles(session: Session | None = None) -> None:
    """Ensure default user roles exist."""
    managed_session = session or SessionLocal()
    try:
        # Somente duas roles: admin e user
        default_roles = {"admin", "user"}
        existing_roles = set(
            managed_session.scalars(select(Role.name).where(Role.name.in_(default_roles)))
        )
        missing_roles = default_roles - existing_roles
        if not missing_roles:
            return
        
        # Descrições das roles
        role_descriptions = {
            "admin": "Acesso total ao sistema",
            "user": "Acesso operacional (estoque, vendas)"
        }
        
        for role_name in sorted(missing_roles):
            managed_session.add(Role(name=role_name, description=role_descriptions.get(role_name)))
        managed_session.commit()
    finally:
        if session is None:
            managed_session.close()


def seed_initial_data() -> None:
    """Create default roles and admin user on startup (if enabled)."""
    with SessionLocal() as session:
        with session.begin():
            ensure_default_roles(session=session)

            admin_role = _get_role_by_name(session, "admin")
            user_role = _get_role_by_name(session, "user")

            _ensure_special_user(
                session,
                email="admin@estoque.com",
                password="1234",
                full_name="Administrador Estocka",
                role_id=admin_role.id,
            )

            _ensure_special_user(
                session,
                email="user@estoque.com",
                password="1234",
                full_name="Usuario Padrao",
                role_id=user_role.id,
            )
            
            # Note: Use 'python seed_database.py' to populate products and movements


def _get_role_by_name(session: Session, role_name: str) -> Role:
    """Return a role by name or raise if it is missing."""
    role = session.execute(select(Role).where(Role.name == role_name)).scalar_one_or_none()
    if role is None:
        raise RuntimeError(f"Role '{role_name}' should exist but was not found.")
    return role


def _ensure_special_user(
    session: Session,
    *,
    email: str,
    password: str,
    full_name: str,
    role_id: int,
) -> tuple[User, bool]:
    """Create a specific user when it does not exist."""
    user = session.execute(select(User).where(User.email == email)).scalar_one_or_none()
    if user:
        return user, False

    user_payload = UserCreate.model_construct(
        email=email,
        password=password,
        full_name=full_name,
        profile_image_url=None,
        profile_image_base64=None,
        role_id=role_id,
    )

    user = user_repository.create_user(
        session,
        user=user_payload,
        role_id=role_id,
        commit=False,
    )
    return user, True


app = FastAPI(
    title="Estocka API",
    version="1.0.0",
    description="Backend for the Estocka stock management system.",
)

# Configure rate limiting
limiter = Limiter(key_func=get_remote_address)
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.frontend_url],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.middleware("http")
async def security_headers_middleware(request: Request, call_next):
    response = await call_next(request)
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-XSS-Protection"] = "1; mode=block"
    return response

@app.get("/health", status_code=200)
def health_check() -> dict[str, str]:
    """Lightweight health endpoint for platform probes."""
    return {"status": "ok"}

app.include_router(auth_controller.router)
app.include_router(role_controller.router)
app.include_router(user_controller.router)
app.include_router(organization_controller.router)
app.include_router(category_controller.router)
app.include_router(product_controller.router)
app.include_router(movement_controller.router)
app.include_router(dashboard_controller.router)
app.include_router(report_controller.router)
app.include_router(audit_controller.router)


# ==================== Exception Handlers ====================

from fastapi import Request
from fastapi.responses import JSONResponse
from app.exceptions import EstockaException


@app.exception_handler(EstockaException)
async def estocka_exception_handler(request: Request, exc: EstockaException) -> JSONResponse:
    """Handler para exceções customizadas do Estocka."""
    logger.warning(
        f"EstockaException: {exc.error_code} - {exc.detail} - Path: {request.url.path}"
    )
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "detail": exc.detail,
            "error_code": exc.error_code,
            "timestamp": exc.timestamp,
        },
    )


@app.exception_handler(Exception)
async def generic_exception_handler(request: Request, exc: Exception) -> JSONResponse:
    """Handler para exceções genéricas não tratadas."""
    logger.error(
        f"Erro não tratado: {type(exc).__name__} - {str(exc)} - Path: {request.url.path}",
        exc_info=True,
    )
    return JSONResponse(
        status_code=500,
        content={
            "detail": "Erro interno do servidor. Contate o suporte.",
            "error_code": "INTERNAL_SERVER_ERROR",
            "timestamp": datetime.utcnow().isoformat(),
        },
    )



@app.on_event("startup")
def on_startup() -> None:
    """Execute startup routines."""
    logger.info("🚀 Estocka API iniciando...")
    if settings.seed_on_start:
        logger.info("Executando seed de dados iniciais")
        seed_initial_data()
    logger.info("✅ Estocka API pronta para receber requisições")


if __name__ == "__main__":
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
