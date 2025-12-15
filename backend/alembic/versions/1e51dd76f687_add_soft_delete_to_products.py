"""add_soft_delete_to_products

Revision ID: 1e51dd76f687
Revises: 
Create Date: 2025-12-03 19:54:08.315070

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import sqlite

# revision identifiers, used by Alembic.
revision: str = '1e51dd76f687'
down_revision: Union[str, Sequence[str], None] = "7d52d1d72b3e"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """No-op (schema covered by baseline)."""
    # Soft-delete columns are part of the baseline migration (7d52d1d72b3e).
    pass


def downgrade() -> None:
    """No-op (schema covered by baseline)."""
    pass
