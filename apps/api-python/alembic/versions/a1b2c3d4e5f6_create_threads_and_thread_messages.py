"""create threads and thread_messages tables

Revision ID: a1b2c3d4e5f6
Revises: 5bdab6b9dc7a
Create Date: 2026-06-29 00:00:00.000000

"""

from collections.abc import Sequence

import sqlalchemy as sa

from alembic import op

# revision identifiers, used by Alembic.
revision: str = "a1b2c3d4e5f6"
down_revision: str | Sequence[str] | None = "5bdab6b9dc7a"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.create_table(
        "threads",
        sa.Column("id", sa.Integer, primary_key=True, autoincrement=True, nullable=False),
        sa.Column("origin_msg", sa.Integer, sa.ForeignKey("messages.id"), nullable=False, unique=True),
        sa.Column("created_at", sa.DateTime, nullable=False, server_default=sa.func.now()),
    )
    op.create_table(
        "thread_messages",
        sa.Column("thread_id", sa.Integer, sa.ForeignKey("threads.id"), primary_key=True, nullable=False),
        sa.Column("msg_id", sa.Integer, sa.ForeignKey("messages.id"), primary_key=True, nullable=False),
        sa.Column("reply_to", sa.Integer, sa.ForeignKey("messages.id"), primary_key=True, nullable=False),
    )


def downgrade() -> None:
    op.drop_table("thread_messages")
    op.drop_table("threads")
