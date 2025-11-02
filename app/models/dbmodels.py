# Database Models

import datetime
from sqlmodel import SQLModel, Field, Column
from datetime import datetime, timezone
from pydantic import BaseModel

class Token(BaseModel):
    username: str
    token: str

class User(SQLModel, table=True):
    __tablename__ = "users"
    id: int = Field(primary_key=True)
    username: str
    email: str
    password_hash: str
    first_name: str
    last_name: str
    device_address: str | None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    last_seen: datetime = Field(default_factory=lambda: datetime.now(timezone.utc),
                                 sa_column_kwargs={"onupdate": lambda: datetime.now(timezone.utc)})


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

