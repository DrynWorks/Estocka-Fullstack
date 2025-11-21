import random
from datetime import datetime, timedelta
from decimal import Decimal

from sqlalchemy import create_engine, select
from sqlalchemy.orm import sessionmaker

from app.config import get_settings
from app.database import Base
from app.products.product_model import Product
from app.movements.movement_model import Movement, MovementType
from app.users.user_model import User

# Setup database connection
settings = get_settings()
engine = create_engine(settings.database_url)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def seed_history():
    session = SessionLocal()
    try:
        print("Starting historical data seeding...")
        
        # Get admin user for "created_by"
        admin = session.execute(select(User).where(User.email == "admin@estoque.com")).scalar_one_or_none()
        if not admin:
            print("Admin user not found. Please run the backend first to seed initial users.")
            return

        products = session.execute(select(Product)).scalars().all()
        if not products:
            print("No products found. Please run the backend first to seed initial products.")
            return

        # Time range: last 90 days
        end_date = datetime.utcnow()
        start_date = end_date - timedelta(days=90)

        total_movements = 0

        for product in products:
            print(f"Processing product: {product.name}")
            
            # 0. Update cost_price and lead_time if missing
            if product.cost_price == 0 or product.lead_time == 0:
                # Cost is roughly 40-70% of price
                cost_factor = random.uniform(0.4, 0.7)
                product.cost_price = Decimal(float(product.price) * cost_factor).quantize(Decimal("0.01"))
                product.lead_time = random.randint(3, 15)
                session.add(product)

            # 1. Add initial stock 90 days ago (ENTRADA)
            initial_stock = random.randint(50, 200)
            entry = Movement(
                product_id=product.id,
                type=MovementType.ENTRADA,
                quantity=initial_stock,
                reason="Estoque Inicial (Histórico)",
                created_at=start_date,
                created_by_id=admin.id
            )
            session.add(entry)
            
            # Update product quantity
            product.quantity += initial_stock
            
            # 2. Simulate sales over the last 90 days (SAIDA)
            current_date = start_date
            while current_date <= end_date:
                # Random chance of sale each day (e.g., 30% chance)
                if random.random() < 0.3:
                    # Random quantity based on product price (cheaper items sell more)
                    if product.price < 100:
                        qty = random.randint(1, 5)
                    elif product.price < 1000:
                        qty = random.randint(1, 2)
                    else:
                        qty = 1

                    # Ensure we have stock
                    if product.quantity >= qty:
                        sale = Movement(
                            product_id=product.id,
                            type=MovementType.SAIDA,
                            quantity=qty,
                            reason="Venda",
                            created_at=current_date + timedelta(hours=random.randint(8, 18)), # Business hours
                            created_by_id=admin.id
                        )
                        session.add(sale)
                        product.quantity -= qty
                        total_movements += 1
                
                current_date += timedelta(days=1)

        session.commit()
        print(f"Successfully seeded {total_movements} sales movements and updated stock.")

    except Exception as e:
        print(f"Error seeding data: {e}")
        session.rollback()
    finally:
        session.close()

if __name__ == "__main__":
    seed_history()
