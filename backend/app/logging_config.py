"""Configuração centralizada de logging para o sistema Estocka."""

from __future__ import annotations

import logging
import sys
from pathlib import Path


def setup_logging() -> None:
    """
    Configura o sistema de logging da aplicação.
    
    - Logs são salvos em arquivo (logs/estocka.log)
    - Logs também aparecem no console
    - Formato inclui timestamp, nome do módulo, nível e mensagem
    """
    # Criar diretório de logs se não existir
    log_dir = Path("logs")
    log_dir.mkdir(exist_ok=True)
    
    # Formato dos logs
    log_format = '%(asctime)s - %(name)s - %(levelname)s - %(message)s'
    date_format = '%Y-%m-%d %H:%M:%S'
    
    # Handler para console (stdout)
    console_handler = logging.StreamHandler(sys.stdout)
    console_handler.setLevel(logging.INFO)
    console_handler.setFormatter(logging.Formatter(log_format, date_format))
    
    # Handler para arquivo
    file_handler = logging.FileHandler(log_dir / 'estocka.log', encoding='utf-8')
    file_handler.setLevel(logging.INFO)
    file_handler.setFormatter(logging.Formatter(log_format, date_format))
    
    # Configurar root logger
    root_logger = logging.getLogger()
    root_logger.setLevel(logging.INFO)
    root_logger.addHandler(console_handler)
    root_logger.addHandler(file_handler)
    
    # Reduzir verbosidade de bibliotecas externas
    logging.getLogger('sqlalchemy.engine').setLevel(logging.WARNING)
    logging.getLogger('uvicorn.access').setLevel(logging.WARNING)
    
    logging.info("Sistema de logging inicializado com sucesso")
