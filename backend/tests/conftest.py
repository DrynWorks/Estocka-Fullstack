"""
Fixtures globais para os testes.
"""
import pytest
from fastapi.testclient import TestClient
from app.main import app


@pytest.fixture(scope="session")
def client():
    """Cliente de teste para a API."""
    return TestClient(app)


@pytest.fixture(scope="session")
def admin_token(client):
    """Token de autenticação do admin para reutilizar nos testes."""
    # Login usa OAuth2 form-data (não JSON)
    response = client.post("/auth/login", data={
        "username": "admin@estoque.com",
        "password": "1234"
    })
    assert response.status_code == 200, f"Falha ao fazer login com admin: {response.text}"
    return response.json()["access_token"]


@pytest.fixture(scope="session")
def auth_headers(admin_token):
    """Headers com token de autenticação."""
    return {"Authorization": f"Bearer {admin_token}"}


@pytest.fixture
def sample_product_data():
    """Dados de exemplo para criar produto."""
    import random
    sku = f"TEST-{random.randint(1000, 9999)}"
    return {
        "name": "Produto Teste",
        "sku": sku,
        "price": 100.00,
        "cost_price": 50.00,
        "quantity": 10,
        "alert_level": 5,
        "category_id": 1
    }
