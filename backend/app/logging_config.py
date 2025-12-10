"""Centralized logging configuration for Estocka."""

from __future__ import annotations

import logging
import os
import sys
from pathlib import Path


def setup_logging() -> None:
    """
    Configure logging for the application.

    - Logs always go to stdout (cloud-friendly default)
    - Optional file logging when LOG_TO_FILE is set
    - Includes timestamp, module, level, and message
    """
    log_format = "%(asctime)s - %(name)s - %(levelname)s - %(message)s"
    date_format = "%Y-%m-%d %H:%M:%S"

    console_handler = logging.StreamHandler(sys.stdout)
    console_handler.setLevel(logging.INFO)
    console_handler.setFormatter(logging.Formatter(log_format, date_format))

    handlers: list[logging.Handler] = [console_handler]

    if os.getenv("LOG_TO_FILE"):
        log_dir = Path("logs")
        log_dir.mkdir(exist_ok=True)
        file_handler = logging.FileHandler(log_dir / "estocka.log", encoding="utf-8")
        file_handler.setLevel(logging.INFO)
        file_handler.setFormatter(logging.Formatter(log_format, date_format))
        handlers.append(file_handler)

    root_logger = logging.getLogger()
    root_logger.setLevel(logging.INFO)
    for handler in handlers:
        root_logger.addHandler(handler)

    logging.getLogger("sqlalchemy.engine").setLevel(logging.WARNING)
    logging.getLogger("uvicorn.access").setLevel(logging.WARNING)

    logging.info("Logging initialized")
