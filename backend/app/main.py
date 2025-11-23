"""FastAPI application entrypoint for Estocka."""

from __future__ import annotations

from decimal import Decimal

import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.auth import auth_controller
from app.categories import category_controller
from app.categories.category_model import Category
from app.config import get_settings
from app.database import Base, SessionLocal, engine
from app.movements import movement_controller, movement_model, movement_service
from app.products import product_controller
from app.products.product_model import Product
from app.reports import report_controller
from app.roles import role_controller
from app.roles.role_model import Role
from app.users import user_controller, user_repository
from app.users.user_model import User, UserCreate

# Application settings control optional bootstrap steps.
settings = get_settings()

# Sample dataset used when bootstrapping a fresh database.
INITIAL_STOCK_QUANTITY = 10

SAMPLE_CATEGORIES = (
    {"name": "Eletronicos", "description": "Dispositivos e acessorios eletronicos."},
    {"name": "Roupas", "description": "Moda masculina e feminina para o dia a dia."},
    {"name": "Casa e Jardim", "description": "Itens para organizacao, decoracao e jardim."},
    {"name": "Livros", "description": "Livros fisicos e digitais de diversos temas."},
    {"name": "Esportes", "description": "Equipamentos e acessorios esportivos."},
)

SAMPLE_PRODUCTS = (
    {
        "name": "Notebook Pro 15",
        "sku": "ELE-001",
        "price": Decimal("4500.00"),
        "quantity": 5,
        "alert_level": 2,
        "category": "Eletronicos",
    },
    {
        "name": "Fone Bluetooth Noise Cancel",
        "sku": "ELE-002",
        "price": Decimal("650.00"),
        "quantity": 0,
        "alert_level": 5,
        "category": "Eletronicos",
    },
    {
        "name": "Camisa Social Slim",
        "sku": "ROP-001",
        "price": Decimal("149.90"),
        "quantity": 18,
        "alert_level": 4,
        "category": "Roupas",
    },
    {
        "name": "Jaqueta Corta-Vento",
        "sku": "ROP-002",
        "price": Decimal("229.00"),
        "quantity": 0,
        "alert_level": 3,
        "category": "Roupas",
    },
    {
        "name": "Kit Panelas Antiaderentes",
        "sku": "CAS-001",
        "price": Decimal("399.90"),
        "quantity": 12,
        "alert_level": 2,
        "category": "Casa e Jardim",
    },
    {
        "name": "Livro Gestao Agil",
        "sku": "LIV-001",
        "price": Decimal("89.90"),
        "quantity": 8,
        "alert_level": 2,
        "category": "Livros",
    },
    {
        "name": "Bola de Futebol Pro",
        "sku": "ESP-001",
        "price": Decimal("199.90"),
        "quantity": 7,
        "alert_level": 2,
        "category": "Esportes",
    },
)


def create_all_tables() -> None:
    """Create database tables during application bootstrap."""
    Base.metadata.create_all(bind=engine)


def ensure_default_roles(session: Session | None = None) -> None:
    """Ensure default user roles exist."""
    managed_session = session or SessionLocal()
    try:
        default_roles = {"admin", "user"}
        existing_roles = set(
            managed_session.scalars(select(Role.name).where(Role.name.in_(default_roles)))
        )
        missing_roles = default_roles - existing_roles
        if not missing_roles:
            return
        for role_name in sorted(missing_roles):
            managed_session.add(Role(name=role_name))
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


def _ensure_sample_categories(session: Session) -> dict[str, Category]:
    """Ensure sample categories exist and return a mapping by name."""
    category_map: dict[str, Category] = {}
    for payload in SAMPLE_CATEGORIES:
        category = session.execute(
            select(Category).where(Category.name == payload["name"])
        ).scalar_one_or_none()
        if category is None:
            category = Category(name=payload["name"], description=payload["description"])
            session.add(category)
            session.flush()
        category_map[category.name] = category
    return category_map


def _ensure_sample_products(
    session: Session,
    category_map: dict[str, Category],
) -> list[int]:
    """Ensure sample products exist and return zero-stock product IDs."""
    zero_stock_ids: list[int] = []
    for payload in SAMPLE_PRODUCTS:
        product = session.execute(
            select(Product).where(Product.sku == payload["sku"])
        ).scalar_one_or_none()
        product_created = False
        if product is None:
            product = Product(
                name=payload["name"],
                sku=payload["sku"],
                price=payload["price"],
                quantity=payload["quantity"],
                alert_level=payload["alert_level"],
                category_id=category_map[payload["category"]].id,
            )
            session.add(product)
            session.flush()
            product_created = True
        if product_created and product.quantity == 0:
            zero_stock_ids.append(product.id)
    return zero_stock_ids


def _register_initial_stock_movements(
    session: Session,
    product_ids: list[int],
    *,
    created_by_user_id: int,
    manage_transaction: bool = True,
) -> None:
    """Register entry movements for newly created zero-stock products."""
    for product_id in product_ids:
        movement_payload = movement_model.MovementCreate(
            product_id=product_id,
            type=movement_model.MovementType.ENTRADA,
            quantity=INITIAL_STOCK_QUANTITY,
            reason="estoque inicial",
            note="Carga automatica dos dados de exemplo",
        )
        movement_service.create_movement(
            session,
            movement_payload,
            created_by_user_id=created_by_user_id,
            manage_transaction=manage_transaction,
        )


create_all_tables()

app = FastAPI(
    title="Estocka API",
    version="1.0.0",
    description="Backend for the Estocka stock management system.",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_controller.router)
app.include_router(role_controller.router)
app.include_router(user_controller.router)
app.include_router(category_controller.router)
app.include_router(product_controller.router)
app.include_router(movement_controller.router)
app.include_router(report_controller.router)


@app.on_event("startup")
def on_startup() -> None:
    """Execute startup routines."""
    if settings.seed_on_start:
        seed_initial_data()


if __name__ == "__main__":
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
