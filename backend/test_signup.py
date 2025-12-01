"""
Script de teste rápido do endpoint /auth/signup
"""
import requests
import json

BASE_URL = "http://localhost:8000"

def test_signup():
    """Testa o endpoint de signup"""
    print("🧪 Testando endpoint /auth/signup...")
    
    # Dados de teste
    signup_data = {
        "organization_name": "Empresa Teste API",
        "user_full_name": "Usuário Teste",
        "user_email": "teste@empresateste.com",
        "user_password": "senha12345"
    }
    
    try:
        # Fazer requisição
        response = requests.post(
            f"{BASE_URL}/auth/signup",
            json=signup_data,
            headers={"Content-Type": "application/json"}
        )
        
        # Verificar resposta
        if response.status_code == 201:
            data = response.json()
            print("✅ SUCESSO!")
            print(f"  📧 Email: {data['user_email']}")
            print(f"  🏢 Organização: {data['organization_name']}")
            print(f"  🔑 Token: {data['access_token'][:50]}...")
            print(f"  🔐 Token Type: {data['token_type']}")
            
            # Testar o token
            print("\n🔍 Testando autenticação com token...")
            me_response = requests.get(
                f"{BASE_URL}/auth/me",
                headers={"Authorization": f"Bearer {data['access_token']}"}
            )
            
            if me_response.status_code == 200:
                user_data = me_response.json()
                print("✅ Token válido!")
                print(f"  👤 Nome: {user_data['full_name']}")
                print(f"  📧 Email: {user_data['email']}")
                print(f"  🎭 Role: {user_data['role']['name']}")
                print(f"  🏢 Org ID: {user_data['organization_id']}")
            else:
                print(f"❌ Token inválido: {me_response.status_code}")
                print(me_response.json())
        
        elif response.status_code == 400:
            print("⚠️ Email já existe (esperado se já testou antes)")
            print(f"  Resposta: {response.json()}")
        else:
            print(f"❌ Erro: {response.status_code}")
            print(response.json())
    
    except requests.exceptions.ConnectionError:
        print("❌ ERRO: Backend não está rodando!")
        print("  Execute: uvicorn app.main:app --reload")
    except Exception as e:
        print(f"❌ Erro inesperado: {e}")

if __name__ == "__main__":
    test_signup()
