import datetime
from typing import Optional
from sqlmodel import SQLModel, Field, Column
from datetime import datetime, timezone

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

