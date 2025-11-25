"""Add granular roles (owner, admin, manager, operator, viewer)

Revision ID: add_granular_roles
Revises: add_organizations
Create Date: 2024-11-25

"""
from alembic import op


# revision identifiers
revision = 'add_granular_roles'
down_revision = 'add_organizations'
branch_labels = None
depends_on = None


def upgrade():
    """
    Add new granular roles to the system.
    
    New roles: owner, manager, operator, viewer
    Existing roles are preserved: admin, user
    
    Note: Existing 'user' role will remain for backward compatibility,
    but new users should use the more specific roles.
    """
    # Insert new roles
    op.execute("""
        INSERT INTO roles (name) VALUES ('owner')
        ON CONFLICT (name) DO NOTHING;
    """)
    
    op.execute("""
        INSERT INTO roles (name) VALUES ('manager')
        ON CONFLICT (name) DO NOTHING;
    """)
    
    op.execute("""
        INSERT INTO roles (name) VALUES ('operator')
        ON CONFLICT (name) DO NOTHING;
    """)
    
    op.execute("""
        INSERT INTO roles (name) VALUES ('viewer')
        ON CONFLICT (name) DO NOTHING;
    """)
    
    # Optional: Migrate existing 'user' roles to 'operator' (more specific)
    # Uncomment if you want to update existing users
    # op.execute("""
    #     UPDATE users 
    #     SET role_id = (SELECT id FROM roles WHERE name = 'operator')
    #     WHERE role_id = (SELECT id FROM roles WHERE name = 'user');
    # """)


def downgrade():
    """
    Remove the new roles.
    
    Warning: This will fail if any users are assigned to these roles.
    You should reassign users to 'admin' or 'user' before downgrading.
    """
    op.execute("DELETE FROM roles WHERE name = 'owner';")
    op.execute("DELETE FROM roles WHERE name = 'manager';")
    op.execute("DELETE FROM roles WHERE name = 'operator';")
    op.execute("DELETE FROM roles WHERE name = 'viewer';")
