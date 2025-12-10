
import sys
import os
# Adiciona o diretório pai (backend) ao sys.path para encontrar o módulo 'app'
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from sqlalchemy import create_engine, inspect
from dotenv import load_dotenv

load_dotenv()

engine = create_engine(os.getenv("DATABASE_URL"))
inspector = inspect(engine)
columns = [col['name'] for col in inspector.get_columns('products')]
print(f"Colunas em products: {columns}")
