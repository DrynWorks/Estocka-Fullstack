"""Add multi-tenancy support with organizations

Revision ID: add_organizations
Revises: (previous migration)
Create Date: 2024-11-25

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers
revision = 'add_organizations'
down_revision = None  # Update this to your last migration ID
branch_labels = None
depends_on = None


def upgrade():
    # Create organizations table
    op.create_table(
        'organizations',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('name', sa.String(length=100), nullable=False),
        sa.Column('slug', sa.String(length=100), nullable=False),
        sa.Column('cnpj', sa.String(length=14), nullable=True),
        sa.Column('active', sa.Boolean(), nullable=False, server_default='1'),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('ix_organizations_id', 'organizations', ['id'])
    op.create_index('ix_organizations_slug', 'organizations', ['slug'], unique=True)
    
    # Create default organization
    op.execute("""
        INSERT INTO organizations (name, slug, active)
        VALUES ('Default Organization', 'default', 1)
    """)
    
    # Add organization_id to users
    op.add_column('users', sa.Column('organization_id', sa.Integer(), nullable=True))
    op.execute("UPDATE users SET organization_id = 1")  # Set to default org
    op.alter_column('users', 'organization_id', nullable=False)
    op.create_foreign_key('fk_users_organization', 'users', 'organizations', ['organization_id'], ['id'])
    op.create_index('ix_users_organization_id', 'users', ['organization_id'])
    
    # Add organization_id to products
    op.add_column('products', sa.Column('organization_id', sa.Integer(), nullable=True))
    op.execute("UPDATE products SET organization_id = 1")  # Set to default org
    op.alter_column('products', 'organization_id', nullable=False)
    op.create_foreign_key('fk_products_organization', 'products', 'organizations', ['organization_id'], ['id'])
    op.create_index('ix_products_organization_id', 'products', ['organization_id'])
    
    # Add organization_id to categories
    op.add_column('categories', sa.Column('organization_id', sa.Integer(), nullable=True))
    op.execute("UPDATE categories SET organization_id = 1")  # Set to default org
    op.alter_column('categories', 'organization_id', nullable=False)
    op.create_foreign_key('fk_categories_organization', 'categories', 'organizations', ['organization_id'], ['id'])
    op.create_index('ix_categories_organization_id', 'categories', ['organization_id'])
    
    # Add organization_id to movements
    op.add_column('movements', sa.Column('organization_id', sa.Integer(), nullable=True))
    op.execute("UPDATE movements SET organization_id = 1")  # Set to default org
    op.alter_column('movements', 'organization_id', nullable=False)
    op.create_foreign_key('fk_movements_organization', 'movements', 'organizations', ['organization_id'], ['id'])
    op.create_index('ix_movements_organization_id', 'movements', ['organization_id'])
    
    # Add organization_id to audit_logs if table exists
    # This is optional - include only if you have audit_logs table
    op.add_column('audit_logs', sa.Column('organization_id', sa.Integer(), nullable=True))
    op.execute("UPDATE audit_logs SET organization_id = 1")  # Set to default org
    op.alter_column('audit_logs', 'organization_id', nullable=False)
    op.create_foreign_key('fk_audit_logs_organization', 'audit_logs', 'organizations', ['organization_id'], ['id'])
    op.create_index('ix_audit_logs_organization_id', 'audit_logs', ['organization_id'])


def downgrade():
    # Remove organization_id from audit_logs
    op.drop_constraint('fk_audit_logs_organization', 'audit_logs', type_='foreignkey')
    op.drop_index('ix_audit_logs_organization_id', 'audit_logs')
    op.drop_column('audit_logs', 'organization_id')
    
    # Remove organization_id from movements
    op.drop_constraint('fk_movements_organization', 'movements', type_='foreignkey')
    op.drop_index('ix_movements_organization_id', 'movements')
    op.drop_column('movements', 'organization_id')
    
    # Remove organization_id from categories
    op.drop_constraint('fk_categories_organization', 'categories', type_='foreignkey')
    op.drop_index('ix_categories_organization_id', 'categories')
    op.drop_column('categories', 'organization_id')
    
    # Remove organization_id from products
    op.drop_constraint('fk_products_organization', 'products', type_='foreignkey')
    op.drop_index('ix_products_organization_id', 'products')
    op.drop_column('products', 'organization_id')
    
    # Remove organization_id from users
    op.drop_constraint('fk_users_organization', 'users', type_='foreignkey')
    op.drop_index('ix_users_organization_id', 'users')
    op.drop_column('users', 'organization_id')
    
    # Drop organizations table
    op.drop_index('ix_organizations_slug', 'organizations')
    op.drop_index('ix_organizations_id', 'organizations')
    op.drop_table('organizations')
