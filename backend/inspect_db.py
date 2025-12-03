
from sqlalchemy import create_engine, inspect
import os
from dotenv import load_dotenv

load_dotenv()

engine = create_engine(os.getenv("DATABASE_URL"))
inspector = inspect(engine)
columns = [col['name'] for col in inspector.get_columns('products')]
print(f"Colunas em products: {columns}")
