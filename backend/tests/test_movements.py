"""
Testes de movimentações de estoque.
"""
import pytest


class TestMovementCreate:
    """Testes de criação de movimentações."""
    
    def test_movement_entrada(self, client, auth_headers):
        """Movimento de entrada deve aumentar estoque."""
        # Buscar um produto existente
        products = client.get("/products/", headers=auth_headers).json()
        assert len(products) > 0, "Nenhum produto disponível para teste"
        product = products[0]
        initial_quantity = product["quantity"]
        
        # Criar movimento de entrada
        response = client.post("/movements/", headers=auth_headers, json={
            "product_id": product["id"],
            "type": "entrada",
            "quantity": 10,
            "reason": "Compra de teste"
        })
        
        assert response.status_code == 201
        
        # Verificar se estoque aumentou
        updated_product = client.get(f"/products/{product['id']}", headers=auth_headers).json()
        assert updated_product["quantity"] == initial_quantity + 10
    
    def test_movement_saida_valid(self, client, auth_headers):
        """Movimento de saída com estoque suficiente deve funcionar."""
        # Buscar produto com estoque
        products = client.get("/products/", headers=auth_headers).json()
        product = next((p for p in products if p["quantity"] > 0), None)
        assert product is not None, "Nenhum produto com estoque disponível"
        
        initial_quantity = product["quantity"]
        
        # Criar movimento de saída (menor que estoque atual)
        quantity_to_remove = min(5, initial_quantity)
        response = client.post("/movements/", headers=auth_headers, json={
            "product_id": product["id"],
            "type": "saida",
            "quantity": quantity_to_remove,
            "reason": "Venda de teste"
        })
        
        assert response.status_code == 201
        
        # Verificar se estoque diminuiu
        updated_product = client.get(f"/products/{product['id']}", headers=auth_headers).json()
        assert updated_product["quantity"] == initial_quantity - quantity_to_remove
    
    def test_movement_saida_insufficient_stock(self, client, auth_headers):
        """Movimento de saída maior que estoque deve retornar erro."""
        # Buscar qualquer produto
        products = client.get("/products/", headers=auth_headers).json()
        assert len(products) > 0
        product = products[0]
        
        # Tentar saída de quantidade muito grande
        response = client.post("/movements/", headers=auth_headers, json={
            "product_id": product["id"],
            "type": "saida",
            "quantity": 999999,
            "reason": "Teste de estoque insuficiente"
        })
        
        assert response.status_code == 400
        assert "insuficiente" in response.json()["detail"].lower()


class TestMovementList:
    """Testes de listagem de movimentações."""
    
    def test_list_movements(self, client, auth_headers):
        """Listar movimentações deve retornar lista."""
        response = client.get("/movements/", headers=auth_headers)
        
        assert response.status_code == 200
        movements = response.json()
        assert isinstance(movements, list)
        
        # Se houver movimentos, validar estrutura
        if len(movements) > 0:
            movement = movements[0]
            assert "id" in movement
            assert "product" in movement
            assert "type" in movement
            assert "quantity" in movement
            assert movement["type"] in ["entrada", "saida"]
    
    def test_get_recent_movements(self, client, auth_headers):
        """Buscar movimentações recentes deve funcionar."""
        response = client.get("/movements/recent?limit=5", headers=auth_headers)
        
        assert response.status_code == 200
        movements = response.json()
        assert isinstance(movements, list)
        assert len(movements) <= 5
