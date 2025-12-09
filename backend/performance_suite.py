"""Teste de desempenho simples da API Estocka.

Mede tempo médio/mínimo/máximo e taxa de sucesso para endpoints chave,
além de um mini teste de carga (10 requisições simultâneas).
"""

from __future__ import annotations

import concurrent.futures
import statistics
import time
from typing import Any, Dict, Tuple

import platform
import logging
from fastapi.testclient import TestClient

from app.main import app

ITERATIONS = 50
CONCURRENT_REQUESTS = 10


def login(client: TestClient, username: str, password: str) -> str | None:
    """Autentica e devolve o token JWT."""
    resp = client.post(
        "/auth/login",
        data={"username": username, "password": password},
        headers={"Content-Type": "application/x-www-form-urlencoded"},
    )
    if resp.status_code != 200:
        print(f"Falha no login ({resp.status_code}): {resp.text}")
        return None
    return resp.json().get("access_token")


def measure(
    client: TestClient,
    method: str,
    path: str,
    iterations: int,
    headers: Dict[str, str] | None = None,
    data: Any = None,
) -> Dict[str, Any]:
    """Executa N requisições e calcula métricas."""
    headers = headers or {}
    times_ms: list[float] = []
    success = 0

    for _ in range(iterations):
        start = time.perf_counter()
        resp = client.request(method, path, headers=headers, data=data)
        elapsed = (time.perf_counter() - start) * 1000
        times_ms.append(elapsed)
        if 200 <= resp.status_code < 300:
            success += 1

    return {
        "avg_ms": statistics.mean(times_ms),
        "min_ms": min(times_ms),
        "max_ms": max(times_ms),
        "success_rate": success / iterations * 100,
    }


def measure_concurrent(client: TestClient, path: str, headers: Dict[str, str]) -> Dict[str, Any]:
    """Executa 10 requisições simultâneas e mede tempos."""
    times_ms: list[float] = []

    def call() -> float:
        start = time.perf_counter()
        resp = client.get(path, headers=headers)
        elapsed = (time.perf_counter() - start) * 1000
        if not (200 <= resp.status_code < 300):
            print(f"Erro em {path}: {resp.status_code}")
        return elapsed

    start_total = time.perf_counter()
    with concurrent.futures.ThreadPoolExecutor(max_workers=CONCURRENT_REQUESTS) as executor:
        for t in executor.map(lambda _: call(), range(CONCURRENT_REQUESTS)):
            times_ms.append(t)
    total_time = (time.perf_counter() - start_total) * 1000

    return {
        "avg_ms": statistics.mean(times_ms),
        "min_ms": min(times_ms),
        "max_ms": max(times_ms),
        "total_ms": total_time,
    }


def main() -> None:
    logging.disable(logging.CRITICAL)
    client = TestClient(app)
    token = login(client, "admin@estoque.com", "1234")
    if not token:
        return
    headers = {"Authorization": f"Bearer {token}"}

    results: list[Tuple[str, Dict[str, Any]]] = []

    # Endpoints GET autenticados
    for path in ["/dashboard/overview", "/products", "/reports/overview", "/reports/financial"]:
        results.append((path, measure(client, "GET", path, ITERATIONS, headers=headers)))

    # Endpoint de login (sem header)
    results.append(
        (
            "/auth/login",
            measure(
                client,
                "POST",
                "/auth/login",
                ITERATIONS,
                data={
                    "username": "admin@estoque.com",
                    "password": "1234",
                    "grant_type": "password",
                },
                headers={"Content-Type": "application/x-www-form-urlencoded"},
            ),
        )
    )

    # Teste concorrente em /reports/overview
    concurrent_res = measure_concurrent(client, "/reports/overview", headers)

    # Ambiente
    print("\n=== Ambiente ===")
    print(f"Data: {time.strftime('%Y-%m-%d %H:%M:%S')}")
    print(f"OS: {platform.platform()}")
    print(f"Python: {platform.python_version()}")
    print(f"Processador: {platform.processor() or 'n/d'}")
    print("Banco: SQLite (DATABASE_URL padrão) em execução local via TestClient/Uvicorn in-process")

    print("\n=== Resultados sequenciais (50 req) ===")
    for path, data in results:
        print(
            f"{path}: média {data['avg_ms']:.1f} ms | "
            f"mín {data['min_ms']:.1f} ms | "
            f"máx {data['max_ms']:.1f} ms | "
            f"sucesso {data['success_rate']:.1f}%"
        )

    print("\n=== Resultado concorrente (10 req simultâneas) ===")
    print(
        f"/reports/overview: média {concurrent_res['avg_ms']:.1f} ms | "
        f"mín {concurrent_res['min_ms']:.1f} ms | "
        f"máx {concurrent_res['max_ms']:.1f} ms | "
        f"tempo total {concurrent_res['total_ms']:.1f} ms"
    )


if __name__ == "__main__":
    main()
