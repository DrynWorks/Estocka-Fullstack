"""
Testes de validações e regras de negócio.
"""
import pytest


class TestEmailValidation:
    """Testes de validação de email único."""
    
    def test_check_email_exists(self, client, auth_headers):
        """Verificar se email existe deve retornar true para emails cadastrados."""
        response = client.get("/users/check-email?email=admin@estoque.com", headers=auth_headers)
        
        assert response.status_code == 200
        assert response.json()["exists"] is True
    
    def test_check_email_not_exists(self, client, auth_headers):
        """Verificar email não cadastrado deve retornar false."""
        response = client.get("/users/check-email?email=naoexiste@teste.com", headers=auth_headers)
        
        assert response.status_code == 200
        assert response.json()["exists"] is False


class TestPriceValidation:
    """Testes de validação de preços."""
    
    def test_price_greater_than_cost(self, client, auth_headers, sample_product_data):
        """Preço de venda maior que custo deve ser aceito."""
        sample_product_data["price"] = 100.00
        sample_product_data["cost_price"] = 50.00
        
        response = client.post("/products/", headers=auth_headers, json=sample_product_data)
        assert response.status_code == 201
    
    def test_price_equal_to_cost(self, client, auth_headers, sample_product_data):
        """Preço igual ao custo deve retornar erro."""
        sample_product_data["price"] = 50.00
        sample_product_data["cost_price"] = 50.00
        
        response = client.post("/products/", headers=auth_headers, json=sample_product_data)
        # Validação Pydantic retorna 422
        assert response.status_code == 422


class TestSKUValidation:
    """Testes de validação de SKU."""
    
    def test_valid_sku_formats(self, client, auth_headers, sample_product_data):
        """SKUs válidos devem ser aceitos."""
        valid_skus = ["ABC-123", "PROD-001", "SKU123", "TEST-ABC-123"]
        
        for sku in valid_skus:
            sample_product_data["sku"] = sku
            response = client.post("/products/", headers=auth_headers, json=sample_product_data)
            assert response.status_code == 201, f"SKU {sku} deveria ser válido"
    
    def test_invalid_sku_formats(self, client, auth_headers, sample_product_data):
        """SKUs inválidos devem ser rejeitados."""
        invalid_skus = ["sku com espaço", "sku@invalido", "sku#123", ""]
        
        for sku in invalid_skus:
            sample_product_data["sku"] = sku
            response = client.post("/products/", headers=auth_headers, json=sample_product_data)
            # Validação Pydantic retorna 422
            assert response.status_code == 422, f"SKU {sku} deveria ser inválido"


class TestRateLimiting:
    """Testes de rate limiting no login."""
    
    @pytest.mark.skip(reason="Rate limiting pode interferir com outros testes")
    def test_login_rate_limit(self, client):
        """Múltiplas tentativas de login devem ser limitadas."""
        # Tentar login 10 vezes rapidamente
        for _ in range(10):
            client.post("/auth/login", json={
                "email": "test@test.com",
                "password": "wrongpassword"
            })
        
        # A próxima deve retornar 429 (Too Many Requests)
        response = client.post("/auth/login", json={
            "email": "test@test.com",
            "password": "wrongpassword"
        })
        
        assert response.status_code == 429
