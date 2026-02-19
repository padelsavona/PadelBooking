"""Add payment and block fields to bookings

Revision ID: 002
Revises: 001
Create Date: 2026-02-19

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = "002"
down_revision = "001"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column(
        "bookings",
        sa.Column("payment_status", sa.String(length=20), nullable=False, server_default="pending"),
    )
    op.add_column(
        "bookings",
        sa.Column("is_blocked", sa.Boolean(), nullable=False, server_default=sa.false()),
    )
    op.add_column(
        "bookings",
        sa.Column("stripe_session_id", sa.String(length=255), nullable=True),
    )


def downgrade() -> None:
    op.drop_column("bookings", "stripe_session_id")
    op.drop_column("bookings", "is_blocked")
    op.drop_column("bookings", "payment_status")
