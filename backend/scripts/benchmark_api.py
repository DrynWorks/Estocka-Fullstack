"""Benchmark simples da API Estocka usando TestClient.

Executa 100 requisições para endpoints chave e imprime tempo médio em ms.
"""

from __future__ import annotations

import sys
import os
# Adiciona o diretório pai (backend) ao sys.path para encontrar o módulo 'app'
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

import time
from typing import Callable

from fastapi.testclient import TestClient

from app.main import app


def get_token(client: TestClient, username: str, password: str) -> str | None:
    """Autentica e retorna o access token JWT."""
    resp = client.post(
        "/auth/login",
        data={"username": username, "password": password},
        headers={"Content-Type": "application/x-www-form-urlencoded"},
    )
    if resp.status_code != 200:
        print(f"Erro ao autenticar ({resp.status_code}): {resp.text}")
        return None
    return resp.json().get("access_token")


def measure(client: TestClient, path: str, iterations: int, headers: dict[str, str]) -> float:
    """Mede tempo médio (ms) de GET em um endpoint."""
    start = time.perf_counter()
    for _ in range(iterations):
        resp = client.get(path, headers=headers)
        if resp.status_code >= 400:
            print(f"Erro {resp.status_code} em {path}: {resp.text}")
    total = time.perf_counter() - start
    return (total / iterations) * 1000


def main() -> None:
    client = TestClient(app)
    token = get_token(client, "admin@estoque.com", "1234")
    if not token:
        return

    headers = {"Authorization": f"Bearer {token}"}
    iterations = 100

    benchmarks: list[tuple[str, Callable[[], float]]] = [
        ("/dashboard/overview", lambda: measure(client, "/dashboard/overview", iterations, headers)),
        ("/products", lambda: measure(client, "/products", iterations, headers)),
        ("/reports/overview", lambda: measure(client, "/reports/overview", iterations, headers)),
    ]

    for path, runner in benchmarks:
        avg_ms = runner()
        print(f"{path}: {avg_ms:.1f} ms por requisição (n={iterations})")


if __name__ == "__main__":
    main()
