"""
Consolidated Database Seeding Script for Estocka
Supports 3 levels: minimal, medium, full
"""
import random
import argparse
from datetime import datetime, timedelta
from decimal import Decimal

from sqlalchemy import create_engine, select
from sqlalchemy.orm import sessionmaker

from app.config import get_settings
from app.database import Base
from app.products.product_model import Product
from app.categories.category_model import Category
from app.movements.movement_model import Movement, MovementType
from app.users.user_model import User
from app.roles.role_model import Role
from app.security import get_password_hash

# Configuration
settings = get_settings()
engine = create_engine(settings.database_url)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Seed Levels Configuration
SEED_LEVELS = {
    'minimal': {
        'products': 12,
        'categories': 5,
        'days_history': 7,
        'sale_frequency': 0.2  # 20% chance of sale per day
    },
    'medium': {
        'products': 35,
        'categories': 10,
        'days_history': 30,
        'sale_frequency': 0.3  # 30% chance of sale per day
    },
    'full': {
        'products': 70,
        'categories': 12,
        'days_history': 90,
        'sale_frequency': 0.4  # 40% chance of sale per day
    }
}

# Categories with descriptions
CATEGORIES_DATA = [
    ("Eletrônicos", "Computadores, smartphones e acessórios tecnológicos"),
    ("Roupas", "Vestuário masculino, feminino e infantil"),
    ("Casa e Jardim", "Móveis, decoração e utensílios domésticos"),
    ("Esportes", "Equipamentos esportivos e fitness"),
    ("Livros", "Livros físicos, digitais e revistas"),
    ("Alimentos", "Alimentos não perecíveis e bebidas"),
    ("Beleza", "Cosméticos e produtos de cuidados pessoais"),
    ("Brinquedos", "Brinquedos e jogos infantis"),
    ("Automotivo", "Peças e acessórios para veículos"),
    ("Pet Shop", "Produtos para animais de estimação"),
    ("Ferramentas", "Ferramentas manuais e elétricas"),
    ("Papelaria", "Material de escritório e escolar"),
]

# Product templates by category
PRODUCT_TEMPLATES = {
    "Eletrônicos": [
        ("Mouse Gamer RGB", 89.90, 149.90),
        ("Teclado Mecânico", 189.00, 349.00),
        ("Webcam HD 1080p", 149.00, 259.00),
        ("Fone Bluetooth", 99.90, 189.90),
        ("Carregador USB-C", 29.90, 59.90),
        ("Hub USB 4 Portas", 39.90, 79.90),
        ("Mousepad Gamer", 29.90, 69.90),
        ("Suporte para Notebook", 49.90, 119.90),
    ],
    "Roupas": [
        ("Camiseta Básica", 19.90, 39.90),
        ("Calça Jeans", 79.00, 149.00),
        ("Jaqueta Corta-Vento", 99.00, 229.00),
        ("Tênis Esportivo", 129.00, 299.00),
        ("Boné Aba Reta", 24.90, 49.90),
        ("Meia Esportiva (3 pares)", 14.90, 29.90),
        ("Bermuda Moletom", 39.90, 89.90),
        ("Moletom com Capuz", 69.90, 159.90),
    ],
    "Casa e Jardim": [
        ("Jogo de Panelas 5 Peças", 149.00, 399.00),
        ("Organizador Multiuso", 29.90, 79.90),
        ("Luminária LED", 59.90, 159.00),
        ("Tapete Decorativo", 49.90, 149.00),
        ("Conjunto de Facas", 39.90, 119.90),
        ("Varal Retrátil", 24.90, 59.90),
        ("Espelho Decorativo", 79.00, 199.00),
        ("Prateleira Flutuante", 34.90, 89.90),
    ],
    "Esportes": [
        ("Bola de Futebol", 39.90, 99.90),
        ("Garrafa Térmica 1L", 29.90, 79.90),
        ("Corda de Pular", 14.90, 39.90),
        ("Kit Halteres 2kg", 39.90, 89.90),
        ("Tapete de Yoga", 49.90, 129.00),
        ("Munhequeira Par", 14.90, 34.90),
        ("Bolsa Esportiva", 59.90, 149.00),
        ("Squeeze 500ml", 9.90, 29.90),
    ],
    "Livros": [
        ("Livro de Ficção Best-Seller", 24.90, 59.90),
        ("Livro Técnico Programação", 49.90, 129.00),
        ("Livro de Auto-Ajuda", 19.90, 49.90),
        ("Livro Infantil Ilustrado", 14.90, 39.90),
        ("Revista Mensal", 9.90, 19.90),
        ("Quadrinho Edição Especial", 19.90, 44.90),
    ],
    "Alimentos": [
        ("Caixa de Chocolates 300g", 14.90, 34.90),
        ("Café Gourmet 500g", 19.90, 45.90),
        ("Biscoito Sortido", 7.90, 17.90),
        ("Barra de Cereal (6un)", 9.90, 22.90),
        ("Chá Premium Caixa", 12.90, 29.90),
    ],
    "Beleza": [
        ("Shampoo Premium 400ml", 19.90, 49.90),
        ("Creme Hidratante", 14.90, 39.90),
        ("Perfume 50ml", 59.90, 149.00),
        ("Kit Maquiagem", 39.90, 119.00),
        ("Escova de Cabelo", 12.90, 34.90),
        ("Sabonete Líquido", 9.90, 24.90),
    ],
    "Brinquedos": [
        ("Carrinho Controle Remoto", 79.00, 199.00),
        ("Boneca Articulada", 39.90, 99.90),
        ("Quebra-Cabeça 500 Peças", 19.90, 49.90),
        ("Jogo de Tabuleiro", 29.90, 89.90),
        ("Pelúcia Grande", 34.90, 79.90),
    ],
    "Automotivo": [
        ("Óleo Motor Sintético 1L", 29.90, 79.90),
        ("Lâmpada LED Automotiva", 19.90, 49.90),
        ("Cera Automotiva", 14.90, 39.90),
        ("Shampoo Automotivo", 12.90, 34.90),
        ("Tapete Automotivo", 39.90, 99.90),
    ],
    "Pet Shop": [
        ("Ração Premium 1kg", 19.90, 49.90),
        ("Brinquedo Pet", 9.90, 29.90),
        ("Coleira Ajustável", 14.90, 39.90),
        ("Comedouro Duplo", 19.90, 49.90),
        ("Cama Pet Pequena", 39.90, 99.90),
    ],
    "Ferramentas": [
        ("Jogo de Chaves Allen", 19.90, 49.90),
        ("Trena 5 Metros", 12.90, 34.90),
        ("Martelo de Borracha", 14.90, 39.90),
        ("Alicate Universal", 19.90, 54.90),
        ("Kit Bits 32 Peças", 24.90, 69.90),
    ],
    "Papelaria": [
        ("Caderno 200 Folhas", 14.90, 34.90),
        ("Caneta Gel (12un)", 12.90, 29.90),
        ("Marcador  de Texto (4un)", 9.90, 24.90),
        ("Corretivo Líquido", 4.90, 12.90),
        ("Agenda 2025", 19.90, 49.90),
        ("Post-it Colorido", 7.90, 19.90),
    ],
}


def clean_database(session):
    """Remove all data from database"""
    print("🧹 Limpando banco de dados...")
    session.query(Movement).delete()
    session.query(Product).delete()
    session.query(Category).delete()
    # Don't delete users and roles - keep admin
    session.commit()
    print("✅ Banco de dados limpo!")


def ensure_roles_and_users(session):
    """Ensure default roles and users exist"""
    print("👥 Verificando roles e usuários...")
    
    # Create roles if they don't exist
    admin_role = session.execute(select(Role).where(Role.name == "admin")).scalar_one_or_none()
    if not admin_role:
        admin_role = Role(name="admin")
        session.add(admin_role)
        session.flush()
    
    user_role = session.execute(select(Role).where(Role.name == "user")).scalar_one_or_none()
    if not user_role:
        user_role = Role(name="user")
        session.add(user_role)
        session.flush()
    
    # Create admin user if doesn't exist
    admin = session.execute(select(User).where(User.email == "admin@estoque.com")).scalar_one_or_none()
    if not admin:
        admin = User(
            email="admin@estoque.com",
            hashed_password=get_password_hash("1234"),
            full_name="Administrador Estocka",
            role_id=admin_role.id
        )
        session.add(admin)
        session.flush()
    
    session.commit()
    print("✅ Roles e usuários criados!")
    return admin


def create_categories(session, level_config):
    """Create categories based on level"""
    num_categories = level_config['categories']
    print(f"📁 Criando {num_categories} categorias...")
    
    categories = []
    for name, desc in CATEGORIES_DATA[:num_categories]:
        existing = session.execute(select(Category).where(Category.name == name)).scalar_one_or_none()
        if existing:
            categories.append(existing)
        else:
            category = Category(name=name, description=desc)
            session.add(category)
            session.flush()
            categories.append(category)
    
    session.commit()
    print(f"✅ {len(categories)} categorias criadas!")
    return categories


def create_products(session, categories, level_config):
    """Create products based on level"""
    num_products = level_config['products']
    print(f"📦 Criando {num_products} produtos...")
    
    products = []
    products_per_category = num_products // len(categories)
    
    for category in categories:
        templates = PRODUCT_TEMPLATES.get(category.name, [])
        if not templates:
            continue
        
        # Create products for this category
        for i in range(min(products_per_category, len(templates))):
            template = templates[i % len(templates)]
            name_base, cost_base, price_base = template
            
            # Add variation to avoid duplicates
            if i >= len(templates):
                name = f"{name_base} Modelo {i+1}"
            else:
                name = name_base
            
            # Check if exists
            existing = session.execute(
                select(Product).where(
                    Product.name == name,
                    Product.category_id == category.id
                )
            ).scalar_one_or_none()
            
            if existing:
                products.append(existing)
                continue
            
            # Random variations
            cost_variation = random.uniform(0.9, 1.1)
            price_variation = random.uniform(0.9, 1.1)
            
            cost = Decimal(str(round(cost_base * cost_variation, 2)))
            price = Decimal(str(round(price_base * price_variation, 2)))
            
            # Initial stock: some empty, most with stock
            if random.random() < 0.15:  # 15% empty
                quantity = 0
            else:
                quantity = random.randint(10, 200)
            
            alert_level = max(5, int(quantity * random.uniform(0.15, 0.25)))
            lead_time = random.randint(3, 21)
            
            # Generate SKU
            category_prefix = category.name[:3].upper()
            sku = f"{category_prefix}-{len(products) + 1:03d}"
            
            product = Product(
                name=name,
                sku=sku,
                price=price,
                cost_price=cost,
                quantity=quantity,
                alert_level=alert_level,
                lead_time=lead_time,
                category_id=category.id
            )
            session.add(product)
            session.flush()
            products.append(product)
    
    session.commit()
    print(f"✅ {len(products)} produtos criados!")
    return products


def create_movements(session, products, admin_user, level_config):
    """Create realistic movement history"""
    days_history = level_config['days_history']
    sale_frequency = level_config['sale_frequency']
    
    print(f"📊 Criando histórico de {days_history} dias...")
    
    end_date = datetime.utcnow()
    start_date = end_date - timedelta(days=days_history)
    
    total_movements = 0
    
    for product in products:
        # Initial stock entry (if product has stock now)
        if product.quantity > 0:
            initial_qty = random.randint(product.quantity, product.quantity + 50)
            entry = Movement(
                product_id=product.id,
                type=MovementType.ENTRADA,
                quantity=initial_qty,
                reason="Estoque Inicial",
                created_at=start_date,
                created_by_id=admin_user.id
            )
            session.add(entry)
            total_movements += 1
        
        # Simulate sales over time
        current_date = start_date
        product_sales = 0
        
        while current_date <= end_date:
            # Weekend bonus (30% more sales)
            is_weekend = current_date.weekday() >= 5
            adjusted_frequency = sale_frequency * 1.3 if is_weekend else sale_frequency
            
            # Sale probability based on price (cheaper items sell more)
            if float(product.price) < 50:
                price_multiplier = 1.5
            elif float(product.price) < 200:
                price_multiplier = 1.0
            else:
                price_multiplier = 0.5
            
            if random.random() < (adjusted_frequency * price_multiplier):
                # Determine quantity sold
                if float(product.price) < 50:
                    qty = random.randint(1, 5)
                elif float(product.price) < 200:
                    qty = random.randint(1, 3)
                else:
                    qty = 1
                
                sale = Movement(
                    product_id=product.id,
                    type=MovementType.SAIDA,
                    quantity=qty,
                    reason="Venda",
                    created_at=current_date + timedelta(hours=random.randint(9, 20)),
                    created_by_id=admin_user.id
                )
                session.add(sale)
                product_sales += qty
                total_movements += 1
            
            current_date += timedelta(days=1)
        
        # Periodic stock replenishment (every 2-3 weeks)
        replenishment_interval = random.randint(14, 21)
        current_date = start_date + timedelta(days=replenishment_interval)
        
        while current_date <= end_date:
            if product_sales > 0:  # Only replenish if there were sales
                replenish_qty = random.randint(20, 100)
                entry = Movement(
                    product_id=product.id,
                    type=MovementType.ENTRADA,
                    quantity=replenish_qty,
                    reason="Reposição de Estoque",
                    created_at=current_date,
                    created_by_id=admin_user.id
                )
                session.add(entry)
                total_movements += 1
            
            current_date += timedelta(days=replenishment_interval)
    
    session.commit()
    print(f"✅ {total_movements} movimentações criadas!")


def seed_database(level='medium', clean=False):
    """Main seeding function"""
    print(f"\n🌱 Iniciando seed do banco de dados (nível: {level.upper()})...\n")
    
    level_config = SEED_LEVELS.get(level)
    if not level_config:
        print(f"❌ Nível inválido: {level}")
        print(f"   Níveis disponíveis: {', '.join(SEED_LEVELS.keys())}")
        return
    
    session = SessionLocal()
    
    try:
        # Create tables if they don't exist
        Base.metadata.create_all(bind=engine)
        
        # Clean if requested
        if clean:
            clean_database(session)
        
        # Ensure roles and admin user
        admin_user = ensure_roles_and_users(session)
        
        # Create categories
        categories = create_categories(session, level_config)
        
        # Create products
        products = create_products(session, categories, level_config)
        
        # Create movement history
        create_movements(session, products, admin_user, level_config)
        
        print("\n✨ Seed concluído com sucesso!")
        print(f"   📁 Categorias: {len(categories)}")
        print(f"   📦 Produtos: {len(products)}")
        print(f"   📅 Histórico: {level_config['days_history']} dias")
        
    except Exception as e:
        print(f"\n❌ Erro durante seed: {e}")
        session.rollback()
        raise
    finally:
        session.close()


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Seed Estocka database")
    parser.add_argument(
        '--level',
        choices=['minimal', 'medium', 'full'],
        default='medium',
        help='Seed level (default: medium)'
    )
    parser.add_argument(
        '--clean',
        action='store_true',
        help='Clean database before seeding'
    )
    
    args = parser.parse_args()
    seed_database(level=args.level, clean=args.clean)
