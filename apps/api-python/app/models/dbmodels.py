# Database Models

from datetime import UTC, datetime

from pydantic import BaseModel, ConfigDict, ValidationInfo, field_validator
from pydantic.alias_generators import to_camel
from sqlmodel import Field, SQLModel


def scope_client_message_id(sender_id: int, key: str) -> str:
    return f"{sender_id}:{key}"


def unscope_client_message_id(sender_id: int, stored_key: str | None) -> str | None:
    prefix = f"{sender_id}:"
    if stored_key and stored_key.startswith(prefix):
        return stored_key[len(prefix) :]
    return stored_key


class UserBase(SQLModel):
    username: str = Field(unique=True, index=True)
    email: str = Field(unique=True, index=True)
    first_name: str
    last_name: str
    device_address: str | None


class User(UserBase, table=True):
    __tablename__ = "users"
    id: int = Field(primary_key=True)
    password_hash: str
    created_at: datetime = Field(default_factory=lambda: datetime.now(UTC))
    last_seen: datetime = Field(
        default_factory=lambda: datetime.now(UTC), sa_column_kwargs={"onupdate": lambda: datetime.now(UTC)}
    )


class UserPublic(UserBase):
    id: int


class UserOut(BaseModel):
    model_config = ConfigDict(alias_generator=to_camel, populate_by_name=True)
    id: int
    username: str
    email: str
    first_name: str
    last_name: str
    device_address: str | None = None
    date_created: datetime | None = None
    last_login: datetime | None = None


class UserSummary(BaseModel):
    model_config = ConfigDict(alias_generator=to_camel, populate_by_name=True)
    id: int
    username: str
    first_name: str
    last_name: str


class UserUpdateFields(BaseModel):
    model_config = ConfigDict(alias_generator=to_camel, populate_by_name=True)
    username: str | None = None
    email: str | None = None
    password: str | None = None
    first_name: str | None = None
    last_name: str | None = None
    device_address: str | None = None


class UserUpdateRequest(BaseModel):
    model_config = ConfigDict(alias_generator=to_camel, populate_by_name=True)
    id: int
    user_update: UserUpdateFields


class Message(SQLModel, table=True):
    __tablename__ = "messages"
    id: int | None = Field(default=None, primary_key=True)
    sender_id: int = Field(foreign_key="users.id", index=True)
    recipient_id: int = Field(foreign_key="users.id", index=True)
    subject: str | None = None
    body: str | None = None
    sent_at: datetime = Field(default_factory=lambda: datetime.now(UTC))
    sender_address: str | None = None
    client_message_id: str | None = Field(default=None, unique=True)
    read_at: datetime | None = None
    reader_address: str | None = None
    deleted_by_sender: datetime | None = None
    deleted_by_recipient: datetime | None = None


class Thread(SQLModel, table=True):
    __tablename__ = "threads"
    id: int | None = Field(default=None, primary_key=True)
    origin_msg: int = Field(foreign_key="messages.id", unique=True)
    created_at: datetime = Field(default_factory=lambda: datetime.now(UTC))


class ThreadMessage(SQLModel, table=True):
    __tablename__ = "thread_messages"
    thread_id: int = Field(foreign_key="threads.id", primary_key=True)
    msg_id: int = Field(foreign_key="messages.id", primary_key=True)
    reply_to: int = Field(foreign_key="messages.id", primary_key=True)


_camel = ConfigDict(alias_generator=to_camel, populate_by_name=True)


class CreateMessageRequest(BaseModel):
    model_config = _camel
    sender_id: int
    recipient_id: int
    subject: str | None = None
    body: str | None = None
    sender_address: str | None = None
    client_message_id: str | None = None


class ReplyToMessageRequest(BaseModel):
    model_config = _camel
    reply_to_id: int
    sender_id: int
    recipient_id: int
    subject: str | None = None
    body: str | None = None
    sender_address: str | None = None
    client_message_id: str | None = None


class ReadMessageRequest(BaseModel):
    model_config = _camel
    id: int
    reader_address: str | None = None


class DeleteMessageRequest(BaseModel):
    model_config = _camel
    id: int
    deleted_by: int


# ── Response models (camelCase for Angular/Node parity) ───────────────────────


class MessageOut(BaseModel):
    model_config = _camel
    id: int | None = None
    sender_id: int
    recipient_id: int
    subject: str | None = None
    body: str | None = None
    sent_at: datetime
    sender_address: str | None = None
    client_message_id: str | None = None
    read_at: datetime | None = None
    reader_address: str | None = None
    deleted_by_sender: datetime | None = None
    deleted_by_recipient: datetime | None = None

    @field_validator("client_message_id")
    @classmethod
    def strip_sender_scope(cls, value: str | None, info: ValidationInfo) -> str | None:
        return unscope_client_message_id(info.data["sender_id"], value)


class MessageListResponse(BaseModel):
    messages: list[MessageOut]
    total: int
    page: int
    limit: int


class MessagePostResponse(MessageOut):
    thread_id: int | None = None
    reply_to: int | None = None
    idempotency_replayed: bool = False
