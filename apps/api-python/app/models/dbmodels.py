# Database Models

import datetime
from sqlmodel import SQLModel, Field, Column
from datetime import datetime, timezone

class UserBase(SQLModel):
    username: str
    email: str
    first_name: str
    last_name: str
    device_address: str | None

class User(UserBase, table=True):
    __tablename__ = "users"
    id: int = Field(primary_key=True)
    password_hash: str
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    last_seen: datetime = Field(default_factory=lambda: datetime.now(timezone.utc),
                                 sa_column_kwargs={"onupdate": lambda: datetime.now(timezone.utc)})

class UserPublic(UserBase):
    id: int

class Message(SQLModel, table=True):
    __tablename__ = "messages"
    id: int | None = Field(default=None, primary_key=True)
    sender_id: int = Field(foreign_key="users.id")
    recipient_id: int = Field(foreign_key="users.id")
    subject: str | None = None
    body: str | None = None
    sent_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    sender_address: str | None = None
    client_message_id: str | None = Field(default=None, unique=True)
    read_at: datetime | None = None
    reader_address: str | None = None
    deleted_by_sender: datetime | None = None
    deleted_by_recipient: datetime | None = None

