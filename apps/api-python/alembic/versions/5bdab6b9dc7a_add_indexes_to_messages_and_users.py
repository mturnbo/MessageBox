"""add indexes to messages and users

Revision ID: 5bdab6b9dc7a
Revises: 
Create Date: 2026-06-19 15:07:49.907669

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '5bdab6b9dc7a'
down_revision: Union[str, Sequence[str], None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_index('users_username_unique', 'users', ['username'], unique=True)
    op.create_index('messages_sender_id_idx', 'messages', ['sender_id'])
    op.create_index('messages_recipient_id_idx', 'messages', ['recipient_id'])


def downgrade() -> None:
    op.drop_index('messages_recipient_id_idx', table_name='messages')
    op.drop_index('messages_sender_id_idx', table_name='messages')
    op.drop_index('users_username_unique', table_name='users')
