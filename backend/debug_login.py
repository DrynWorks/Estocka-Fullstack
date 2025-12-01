from sqlalchemy import create_engine, select
from sqlalchemy.orm import sessionmaker
from app.config import get_settings
from app.users.user_model import User
from app.security import verify_password, get_password_hash

settings = get_settings()
engine = create_engine(settings.database_url)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def debug_users():
    db = SessionLocal()
    try:
        print("🔎 Verificando usuários no banco...")
        users = db.query(User).all()
        print(f"Total de usuários encontrados: {len(users)}")

        for user in users:
            print(f"\n👤 Usuário: {user.email}")
            print(f"   Role ID: {user.role_id}")
            print(f"   Org ID: {user.organization_id}")
            print(f"   Hash no banco: {user.hashed_password[:20]}...")

            # Testar senha padrão (admin/user)
            senha_teste = "1234"
            is_valid = verify_password(senha_teste, user.hashed_password)
            print(f"   🔐 Teste senha '{senha_teste}': {'✅ OK' if is_valid else '❌ FALHOU'}")

            if not is_valid:
                print(f"   🔑 Hash esperado para '{senha_teste}': {get_password_hash(senha_teste)[:20]}...")

    except Exception as e:
        print(f"❌ Erro: {e}")
    finally:
        db.close()


if __name__ == "__main__":
    debug_users()
