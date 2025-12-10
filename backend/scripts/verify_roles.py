import sys
import os
# Adiciona o diretório pai (backend) ao sys.path para encontrar o módulo 'app'
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

import requests

BASE_URL = "http://localhost:8000"


def verify_setup():
    print("✅ Verificando setup do banco...")

    try:
        # 1) Login como admin padrão
        resp = requests.post(
            f"{BASE_URL}/auth/login",
            data={"username": "admin@estoque.com", "password": "1234"},
            timeout=5,
        )
        if resp.status_code != 200:
            print(f"❌ Falha no login: {resp.status_code}")
            print(resp.text)
            return

        token = resp.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}
        print("✅ Login admin OK")

        # 2) Roles (esperado: admin, user)
        resp = requests.get(f"{BASE_URL}/roles", headers=headers, timeout=5)
        roles = resp.json()
        print(f"📋 Roles encontradas: {len(roles)}")
        for r in roles:
            print(f"  - {r['name']}: {r.get('description', '')}")
        if len(roles) != 2:
            print("⚠️ Esperado 2 roles (admin, user)")

        # 3) Usuários da organização
        resp = requests.get(f"{BASE_URL}/users", headers=headers, timeout=5)
        users = resp.json()
        print(f"👥 Usuários na organização: {len(users)}")
        for u in users:
            print(f"  - {u['full_name']} ({u['email']}) - Role: {u['role']['name']}")

    except Exception as e:
        print(f"❌ Erro de conexão: {e}")
        print("Certifique-se que o backend está rodando!")


if __name__ == "__main__":
    verify_setup()
