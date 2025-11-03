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
    id: int = Field(primary_key=True)
    sender_id: int = Field(foreign_key="users.id")
    recipient_id: int = Field(foreign_key="users.id")
    subject: str
    body: str
    sent_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    sender_address: str
    read_at: datetime | None = None
    reader_address: str | None = None
    is_deleted_by_sender: bool = False
    is_deleted_by_recipient: bool = False

