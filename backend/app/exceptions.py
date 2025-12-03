"""Exceções customizadas para o sistema Estocka."""

from __future__ import annotations

from datetime import datetime
from typing import Any, Optional

from fastapi import HTTPException, status


class EstockaException(HTTPException):
    """
    Exceção base para todas as exceções customizadas do Estocka.
    
    Estende HTTPException do FastAPI e adiciona código de erro customizado
    e timestamp para melhor rastreabilidade.
    """
    
    def __init__(
        self,
        status_code: int,
        detail: str,
        error_code: Optional[str] = None,
        headers: Optional[dict[str, Any]] = None,
    ):
        super().__init__(status_code=status_code, detail=detail, headers=headers)
        self.error_code = error_code or "GENERIC_ERROR"
        self.timestamp = datetime.utcnow().isoformat()


# ==================== Exceções de Autenticação ====================

class InvalidCredentialsException(EstockaException):
    """Credenciais de login inválidas."""
    
    def __init__(self):
        super().__init__(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Email ou senha incorretos",
            error_code="INVALID_CREDENTIALS",
        )


class TokenExpiredException(EstockaException):
    """Token JWT expirado."""
    
    def __init__(self):
        super().__init__(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token expirado. Faça login novamente",
            error_code="TOKEN_EXPIRED",
        )


class UnauthorizedException(EstockaException):
    """Usuário não autorizado para a operação."""
    
    def __init__(self, detail: str = "Você não tem permissão para esta operação"):
        super().__init__(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=detail,
            error_code="UNAUTHORIZED",
        )


# ==================== Exceções de Validação ====================

class ValidationException(EstockaException):
    """Erro de validação de dados."""
    
    def __init__(self, detail: str):
        super().__init__(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=detail,
            error_code="VALIDATION_ERROR",
        )


class DuplicateSKUException(EstockaException):
    """SKU já existe no sistema."""
    
    def __init__(self, sku: str):
        super().__init__(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"SKU '{sku}' já está cadastrado no sistema",
            error_code="DUPLICATE_SKU",
        )


class DuplicateEmailException(EstockaException):
    """Email já existe no sistema."""
    
    def __init__(self, email: str):
        super().__init__(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Email '{email}' já está cadastrado no sistema",
            error_code="DUPLICATE_EMAIL",
        )


class InvalidPriceException(EstockaException):
    """Preço de venda menor que preço de custo."""
    
    def __init__(self):
        super().__init__(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Preço de venda não pode ser menor que o preço de custo",
            error_code="INVALID_PRICE",
        )


# ==================== Exceções de Estoque ====================

class InsufficientStockException(EstockaException):
    """Estoque insuficiente para a operação."""
    
    def __init__(self, product_name: str, available: int, requested: int):
        super().__init__(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Estoque insuficiente para '{product_name}'. "
                   f"Disponível: {available}, Solicitado: {requested}",
            error_code="INSUFFICIENT_STOCK",
        )


class NegativeStockException(EstockaException):
    """Tentativa de deixar estoque negativo."""
    
    def __init__(self, product_name: str):
        super().__init__(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Operação resultaria em estoque negativo para '{product_name}'",
            error_code="NEGATIVE_STOCK",
        )


# ==================== Exceções de Recursos ====================

class NotFoundException(EstockaException):
    """Recurso não encontrado."""
    
    def __init__(self, resource: str, identifier: Any):
        super().__init__(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"{resource} com identificador '{identifier}' não foi encontrado",
            error_code="NOT_FOUND",
        )


class ProductNotFoundException(NotFoundException):
    """Produto não encontrado."""
    
    def __init__(self, product_id: int):
        super().__init__(resource="Produto", identifier=product_id)


class UserNotFoundException(NotFoundException):
    """Usuário não encontrado."""
    
    def __init__(self, user_id: int):
        super().__init__(resource="Usuário", identifier=user_id)


class CategoryNotFoundException(NotFoundException):
    """Categoria não encontrada."""
    
    def __init__(self, category_id: int):
        super().__init__(resource="Categoria", identifier=category_id)


# ==================== Exceções de Organização ====================

class OrganizationMismatchException(EstockaException):
    """Tentativa de acessar recurso de outra organização."""
    
    def __init__(self):
        super().__init__(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Você não pode acessar recursos de outra organização",
            error_code="ORGANIZATION_MISMATCH",
        )
