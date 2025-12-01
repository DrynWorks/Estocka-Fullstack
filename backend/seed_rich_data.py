"""
Script para popular o banco com MUITOS dados de teste
- Múltiplos usuários com diferentes roles
- Muitos produtos e categorias
- Histórico extenso de movimentações (para relatórios serem significativos)
"""
import random
from datetime import datetime, timedelta
from decimal import Decimal

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.config import get_settings
from app.organizations.organization_model import Organization
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

def create_rich_seed_data():
    """Cria MUITOS dados de teste"""
    db = SessionLocal()
    
    try:
        print("🚀 Iniciando população do banco com MUITOS dados...")
        
        # 1. Criar organização
        org = db.query(Organization).filter(Organization.slug == "empresa-teste").first()
        if not org:
            org = Organization(
                name="Empresa Teste Ltda",
                slug="empresa-teste",
                active=True
            )
            db.add(org)
            db.flush()
            print(f"✅ Organização criada: {org.name}")
        
        # 2. Criar todas as roles
        roles_data = ["owner", "admin", "manager", "operator", "viewer"]
        roles = {}
        for role_name in roles_data:
            role = db.query(Role).filter(Role.name == role_name).first()
            if not role:
                role = Role(name=role_name)
                db.add(role)
                db.flush()
            roles[role_name] = role
        print(f"✅ {len(roles)} roles criadas/verificadas")
        
        # 3. Criar VÁRIOS usuários
        users_to_create = [
            ("owner@empresa.com", "owner123", "João Silva (Owner)", "owner"),
            ("admin@empresa.com", "admin123", "Maria Santos (Admin)", "admin"),
            ("gerente@empresa.com", "gerente123", "Carlos Oliveira (Gerente)", "manager"),
            ("operador1@empresa.com", "operador123", "Ana Costa (Operadora)", "operator"),
            ("operador2@empresa.com", "operador123", "Pedro Mendes (Operador)", "operator"),
            ("visualizador@empresa.com", "viewer123", "Lucas Lima (Visor)", "viewer"),
        ]
        
        users = []
        for email, password, full_name, role_name in users_to_create:
            user = db.query(User).filter(User.email == email).first()
            if not user:
                user = User(
                    email=email,
                    hashed_password=get_password_hash(password),
                    full_name=full_name,
                    role_id=roles[role_name].id,
                    organization_id=org.id
                )
                db.add(user)
                db.flush()
            users.append(user)
        print(f"✅ {len(users)} usuários criados")
        
        # 4. Criar MUITAS categorias
        categories_data = [
            ("Eletrônicos", "Computadores, smartphones e acessórios"),
            ("Roupas e Acessórios", "Vestuário e moda"),
            ("Casa e Decoração", "Móveis e utensílios domésticos"),
            ("Esportes e Fitness", "Equipamentos esportivos"),
            ("Livros e Mídia", "Livros, DVDs, jogos"),
            ("Alimentos e Bebidas", "Produtos alimentícios"),
            ("Beleza e Saúde", "Cosméticos e cuidados pessoais"),
            ("Brinquedos e Jogos", "Entretenimento infantil"),
            ("Automotivo", "Peças e acessórios para veículos"),
            ("Pet Shop", "Produtos para animais"),
            ("Ferramentas", "Ferramentas manuais e elétricas"),
            ("Papelaria e Escritório", "Material escolar e escritório"),
        ]
        
        categories = []
        for name, desc in categories_data:
            cat = db.query(Category).filter(
                Category.name == name,
                Category.organization_id == org.id
            ).first()
            if not cat:
                cat = Category(
                    name=name,
                    description=desc,
                    organization_id=org.id
                )
                db.add(cat)
                db.flush()
            categories.append(cat)
        print(f"✅ {len(categories)} categorias criadas")
        
        # 5. Criar MUITOS produtos (pelo menos 10 por categoria)
        products_templates = {
            "Eletrônicos": [
                ("Mouse Gamer RGB", 89.90, 149.90, 50, 10),
                ("Teclado Mecânico", 189.00, 349.00, 30, 5),
                ("Webcam HD 1080p", 149.00, 259.00, 40, 8),
                ("Fone Bluetooth", 99.90, 189.90, 60, 15),
                ("Carregador USB-C 65W", 59.90, 119.90, 80, 20),
                ("Hub USB 7 Portas", 79.90, 159.90, 35, 8),
                ("Mousepad Gamer XXL", 49.90, 99.90, 70, 15),
                ("Suporte para Monitor", 89.90, 179.90, 25, 5),
                ("Cabo HDMI 2.1", 39.90, 79.90, 90, 20),
                ("Adaptador USB-C para HDMI", 69.90, 139.90, 45, 10),
            ],
            "Roupas e Acessórios": [
                ("Camiseta Básica Algodão", 29.90, 59.90, 120, 30),
                ("Calça Jeans Slim", 99.00, 199.00, 60, 15),
                ("Jaqueta Corta-Vento", 149.00, 299.00, 40, 10),
                ("Tênis Esportivo Running", 179.00, 359.00, 50, 12),
                ("Boné Aba Reta", 34.90, 69.90, 80, 20),
                ("Meia Esportiva (3 pares)", 24.90, 49.90, 100, 25),
                ("Bermuda Tactel", 49.90, 99.90, 70, 18),
                ("Moletom com Capuz", 89.90, 179.90, 55, 12),
                ("Regata Fitness", 34.90, 69.90, 90, 22),
                ("Legging Fitness", 59.90, 119.90, 75, 18),
            ],
            "Casa e Decoração": [
                ("Jogo de Panelas Antiaderente 5pç", 199.00, 399.00, 30, 8),
                ("Organizador Multiuso 3 Gavetas", 49.90, 99.90, 50, 12),
                ("Luminária LED de Mesa", 79.90, 159.90, 45, 10),
                ("Tapete Decorativo 1,5x2m", 89.90, 179.90, 25, 5),
                ("Conjunto de Facas Inox 6pç", 69.90, 139.90, 40, 10),
                ("Varal Retrátil 5m", 39.90, 79.90, 60, 15),
                ("Espelho Decorativo 60x80cm", 129.00, 259.00, 20, 5),
                ("Prateleira Flutuante MDF", 54.90, 109.90, 35, 8),
                ("Cesto Organizador Bambu", 44.90, 89.90, 55, 12),
                ("Quadro Decorativo 40x60cm", 59.90, 119.90, 40, 10),
            ],
            # ... mais categorias com produtos
        }
        
        products = []
        for cat in categories:
            templates = products_templates.get(cat.name, [
                (f"Produto {cat.name} A", 29.90, 59.90, 50, 10),
                (f"Produto {cat.name} B", 49.90, 99.90, 40, 8),
                (f"Produto {cat.name} C", 69.90, 139.90, 30, 6),
                (f"Produto {cat.name} D", 89.90, 179.90, 35, 7),
                (f"Produto {cat.name} E", 39.90, 79.90, 60, 12),
                (f"Produto {cat.name} F", 59.90, 119.90, 45, 10),
                (f"Produto {cat.name} G", 79.90, 159.90, 30, 6),
                (f"Produto {cat.name} H", 99.90, 199.90, 25, 5),
                (f"Produto {cat.name} I", 44.90, 89.90, 50, 10),
                (f"Produto {cat.name} J", 54.90, 109.90, 40, 8),
            ])
            
            for i, (name, cost, price, qty, alert) in enumerate(templates, 1):
                sku = f"{cat.name[:3].upper()}-{i:03d}"
                prod = db.query(Product).filter(
                    Product.sku == sku,
                    Product.organization_id == org.id
                ).first()
                if not prod:
                    prod = Product(
                        name=name,
                        sku=sku,
                        cost_price=Decimal(str(cost)),
                        price=Decimal(str(price)),
                        quantity=qty,
                        alert_level=alert,
                        category_id=cat.id,
                        organization_id=org.id,
                        lead_time=random.randint(3, 15)
                    )
                    db.add(prod)
                    db.flush()
                products.append(prod)
        print(f"✅ {len(products)} produtos criados")
        
        # 6. Criar MUITAS movimentações (90 dias de histórico)
        print("📦 Criando movimentações históricas...")
        movements_created = 0
        start_date = datetime.now() - timedelta(days=90)
        
        for day in range(90):
            current_date = start_date + timedelta(days=day)
            
            # Entradas (menos frequentes, maiores quantidades)
            if random.random() < 0.15:  # 15% chance por dia
                num_entradas = random.randint(1, 3)
                for _ in range(num_entradas):
                    product = random.choice(products)
                    quantity = random.randint(20, 100)
                    
                    movement = Movement(
                        product_id=product.id,
                        type=MovementType.ENTRADA,
                        quantity=quantity,
                        reason="Compra de estoque",
                        note=f"Reposição programada",
                        created_by_id=random.choice(users).id,
                        organization_id=org.id,
                        created_at=current_date
                    )
                    db.add(movement)
                    movements_created += 1
            
            # Saídas (mais frequentes, menores quantidades)
            num_saidas = random.randint(2, 8)
            for _ in range(num_saidas):
                product = random.choice(products)
                quantity = random.randint(1, 15)
                
                movement = Movement(
                    product_id=product.id,
                    type=MovementType.SAIDA,
                    quantity=quantity,
                    reason=random.choice(["Venda", "Venda online", "Venda loja física"]),
                    note="",
                    created_by_id=random.choice(users).id,
                    organization_id=org.id,
                    created_at=current_date + timedelta(hours=random.randint(8, 20))
                )
                db.add(movement)
                movements_created += 1
        
        print(f"✅ {movements_created} movimentações criadas")
        
        db.commit()
        print("\n🎉 BANCO POPULADO COM SUCESSO!")
        print(f"📊 Resumo:")
        print(f"  - Organização: {org.name}")
        print(f"  - Usuários: {len(users)}")
        print(f"  - Categorias: {len(categories)}")
        print(f"  - Produtos: {len(products)}")
        print(f"  - Movimentações: {movements_created}")
        print(f"\n🔐 Credenciais de acesso:")
        for email, password, name, _ in users_to_create:
            print(f"  - {email} / {password} ({name})")
        
    except Exception as e:
        print(f"❌ Erro: {e}")
        db.rollback()
        raise
    finally:
        db.close()

if __name__ == "__main__":
    create_rich_seed_data()
