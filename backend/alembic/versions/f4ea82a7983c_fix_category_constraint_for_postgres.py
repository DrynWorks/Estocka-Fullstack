"""fix category constraint for postgres

Revision ID: f4ea82a7983c
Revises: 3818a7b1c460
Create Date: 2025-12-19 14:08:00

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'f4ea82a7983c'
down_revision: Union[str, Sequence[str], None] = '3818a7b1c460'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Fix category constraint - PostgreSQL specific commands."""
    # Try to drop old constraint if it exists
    try:
        op.drop_index('ix_categories_name', table_name='categories')
    except Exception:
        pass  # Index may not exist
    
    # Create non-unique index
    op.create_index('ix_categories_name', 'categories', ['name'], unique=False)
    
    # Add composite unique constraint
    op.create_unique_constraint('uq_category_name_org', 'categories', ['name', 'organization_id'])


def downgrade() -> None:
    """Revert changes."""
    op.drop_constraint('uq_category_name_org', 'categories', type_='unique')
    op.drop_index('ix_categories_name', table_name='categories')
    op.create_index('ix_categories_name', 'categories', ['name'], unique=True)
