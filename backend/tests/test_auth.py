"""
Testes de autenticação.
"""
import pytest


class TestLogin:
    """Testes de login."""
    
    def test_login_success(self, client):
        """Login com credenciais válidas deve retornar token."""
        response = client.post("/auth/login", data={
            "username": "admin@estoque.com",
            "password": "1234"
        })
        
        assert response.status_code == 200
        data = response.json()
        assert "access_token" in data
        assert "user" in data
        assert data["user"]["email"] == "admin@estoque.com"
    
    def test_login_invalid_email(self, client):
        """Login com email inexistente deve falhar."""
        response = client.post("/auth/login", data={
            "username": "naoexiste@teste.com",
            "password": "1234"
        })
        
        assert response.status_code == 401
        assert "detail" in response.json()
    
    def test_login_invalid_password(self, client):
        """Login com senha incorreta deve falhar."""
        response = client.post("/auth/login", data={
            "username": "admin@estoque.com",
            "password": "senhaerrada"
        })
        
        assert response.status_code == 401
    
    def test_login_missing_fields(self, client):
        """Login sem email ou senha deve retornar erro de validação."""
        response = client.post("/auth/login", data={
            "username": "admin@estoque.com"
            # falta password
        })
        
        assert response.status_code == 422  # Validation error


class TestSignup:
    """Testes de registro."""
    
    def test_signup_duplicate_email(self, client):
        """Criar organização com email já existente deve falhar."""
        response = client.post("/auth/signup", json={
            "organization_name": "Nova Empresa",
            "user_full_name": "Teste Usuario",
            "user_email": "admin@estoque.com",  # email já existe
            "user_password": "senha123456"
        })
        
        assert response.status_code == 400
        assert "já cadastrado" in response.json()["detail"].lower()


class TestAuthorization:
    """Testes de autorização."""
    
    def test_access_without_token(self, client):
        """Acessar rota protegida sem token deve falhar."""
        response = client.get("/products/")
        assert response.status_code == 401
    
    def test_access_with_invalid_token(self, client):
        """Acessar com token inválido deve falhar."""
        headers = {"Authorization": "Bearer tokeninvalido"}
        response = client.get("/products/", headers=headers)
        assert response.status_code == 401
