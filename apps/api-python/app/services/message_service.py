import hashlib
import json
import time
from datetime import datetime, timezone
from fastapi import HTTPException
from sqlalchemy import func
from sqlmodel import Session, select
from sqlalchemy.exc import IntegrityError

from app.models.dbmodels import (
    Message, Thread, ThreadMessage,
    CreateMessageRequest, ReplyToMessageRequest,
)

DEFAULT_LIMIT = 10
AUTO_IDEMPOTENCY_WINDOW_MS = 30_000


def _build_request_hash(payload, reply_to_id=None):
    data = {
        "replyToId": reply_to_id,
        "senderId": payload.sender_id,
        "recipientId": payload.recipient_id,
        "subject": payload.subject,
        "body": payload.body,
        "senderAddress": payload.sender_address,
    }
    return hashlib.sha256(json.dumps(data, sort_keys=True).encode()).hexdigest()


def _resolve_client_message_id(header_key, payload_key, payload_hash, reply_to_id=None):
    explicit_key = header_key or payload_key
    if explicit_key:
        return explicit_key
    bucket = int(time.time() * 1000) // AUTO_IDEMPOTENCY_WINDOW_MS
    return f"auto:{payload_hash}:{bucket}"


def _is_same_request(message, payload, reply_to=None):
    return (
        message.sender_id == payload.sender_id
        and message.recipient_id == payload.recipient_id
        and message.subject == payload.subject
        and message.body == payload.body
        and message.sender_address == payload.sender_address
        and reply_to == getattr(payload, "reply_to_id", None)
    )


def _find_thread_for_message(session, message_id):
    thread = session.exec(select(Thread).where(Thread.origin_msg == message_id)).first()
    if thread:
        return thread
    thread_msg = session.exec(
        select(ThreadMessage).where(ThreadMessage.msg_id == message_id)
    ).first()
    if not thread_msg:
        return None
    return session.get(Thread, thread_msg.thread_id)


def get_sent(session: Session, sender_id: int, limit: int = DEFAULT_LIMIT, page: int = 1) -> dict:
    page = max(page, 1)
    offset = (page - 1) * limit
    messages = session.exec(
        select(Message)
        .where(Message.sender_id == sender_id, Message.deleted_by_sender == None)
        .order_by(Message.sent_at.desc())
        .offset(offset)
        .limit(limit)
    ).all()
    total = session.exec(
        select(func.count(Message.id)).where(
            Message.sender_id == sender_id, Message.deleted_by_sender == None
        )
    ).one()
    return {"messages": messages, "total": total, "page": page, "limit": limit}


def get_inbox(session: Session, recipient_id: int, limit: int = DEFAULT_LIMIT, page: int = 1) -> dict:
    page = max(page, 1)
    offset = (page - 1) * limit
    messages = session.exec(
        select(Message)
        .where(Message.recipient_id == recipient_id, Message.deleted_by_recipient == None)
        .order_by(Message.sent_at.desc())
        .offset(offset)
        .limit(limit)
    ).all()
    total = session.exec(
        select(func.count(Message.id)).where(
            Message.recipient_id == recipient_id, Message.deleted_by_recipient == None
        )
    ).one()
    return {"messages": messages, "total": total, "page": page, "limit": limit}


def get_message_by_id(session: Session, message_id: int) -> Message | None:
    return session.get(Message, message_id)


def get_thread_by_message_id(session: Session, message_id: int) -> dict | None:
    message = session.get(Message, message_id)
    if not message:
        return None

    thread = _find_thread_for_message(session, message_id)
    if not thread:
        return {"thread": None, "messages": [message.model_dump()]}

    thread_messages = session.exec(
        select(ThreadMessage)
        .where(ThreadMessage.thread_id == thread.id)
        .order_by(ThreadMessage.msg_id)
    ).all()

    related_ids = [thread.origin_msg] + [tm.msg_id for tm in thread_messages]
    messages = session.exec(
        select(Message)
        .where(Message.id.in_(related_ids))
        .order_by(Message.sent_at)
    ).all()

    reply_index = {tm.msg_id: tm.reply_to for tm in thread_messages}

    return {
        "thread": {
            "id": thread.id,
            "origin_msg": thread.origin_msg,
            "created_at": thread.created_at,
        },
        "messages": [
            {**msg.model_dump(), "reply_to": reply_index.get(msg.id)}
            for msg in messages
        ],
    }


def create_message(
    session: Session,
    payload: CreateMessageRequest,
    idempotency_key_header: str | None = None,
) -> tuple[Message, bool]:
    request_hash = _build_request_hash(payload)
    client_message_id = _resolve_client_message_id(
        idempotency_key_header, payload.client_message_id, request_hash
    )
    message = Message(
        sender_id=payload.sender_id,
        recipient_id=payload.recipient_id,
        subject=payload.subject,
        body=payload.body,
        sender_address=payload.sender_address,
        client_message_id=client_message_id,
    )
    try:
        session.add(message)
        session.commit()
        session.refresh(message)
        return message, False
    except IntegrityError:
        session.rollback()

    existing = session.exec(
        select(Message).where(Message.client_message_id == client_message_id)
    ).first()
    if not existing:
        raise HTTPException(
            status_code=409,
            detail="Message request already processed but response could not be reconstructed",
        )
    if not _is_same_request(existing, payload):
        raise HTTPException(
            status_code=409,
            detail="clientMessageId reuse with different payload is not allowed",
        )
    return existing, True


def reply_to_message(
    session: Session,
    payload: ReplyToMessageRequest,
    idempotency_key_header: str | None = None,
) -> tuple[Message, int | None, int, bool]:
    parent = session.get(Message, payload.reply_to_id)
    if not parent:
        raise HTTPException(status_code=404, detail="Message not found")

    request_hash = _build_request_hash(payload, payload.reply_to_id)
    client_message_id = _resolve_client_message_id(
        idempotency_key_header, payload.client_message_id, request_hash, payload.reply_to_id
    )
    try:
        thread = _find_thread_for_message(session, payload.reply_to_id)
        if not thread:
            thread = Thread(origin_msg=payload.reply_to_id)
            session.add(thread)
            session.flush()

        reply = Message(
            sender_id=payload.sender_id,
            recipient_id=payload.recipient_id,
            subject=payload.subject,
            body=payload.body,
            sender_address=payload.sender_address,
            client_message_id=client_message_id,
        )
        session.add(reply)
        session.flush()

        thread_entry = ThreadMessage(
            thread_id=thread.id,
            msg_id=reply.id,
            reply_to=payload.reply_to_id,
        )
        session.add(thread_entry)
        session.commit()
        session.refresh(reply)
        return reply, thread.id, payload.reply_to_id, False

    except IntegrityError:
        session.rollback()

    existing = session.exec(
        select(Message).where(Message.client_message_id == client_message_id)
    ).first()
    if not existing:
        raise HTTPException(
            status_code=409,
            detail="Message request already processed but response could not be reconstructed",
        )
    existing_tm = session.exec(
        select(ThreadMessage).where(ThreadMessage.msg_id == existing.id)
    ).first()
    reply_to = existing_tm.reply_to if existing_tm else None
    if not _is_same_request(existing, payload, reply_to):
        raise HTTPException(
            status_code=409,
            detail="clientMessageId reuse with different payload is not allowed",
        )
    thread_id = existing_tm.thread_id if existing_tm else None
    return existing, thread_id, reply_to, True


def read_message(session: Session, message_id: int, reader_address: str | None) -> Message | None:
    message = session.get(Message, message_id)
    if not message:
        return None
    message.read_at = datetime.now(timezone.utc)
    message.reader_address = reader_address
    session.add(message)
    session.commit()
    session.refresh(message)
    return message


def delete_message(
    session: Session, message_id: int, deleted_by_user_id: int
) -> tuple[Message, str] | tuple[None, None]:
    message = session.get(Message, message_id)
    if not message:
        return None, None
    now = datetime.now(timezone.utc)
    status_msg = ""
    if deleted_by_user_id == message.sender_id:
        message.deleted_by_sender = now
        status_msg = "Message deleted successfully by sender"
    if deleted_by_user_id == message.recipient_id:
        message.deleted_by_recipient = now
        status_msg = "Message deleted successfully by recipient"
    session.add(message)
    session.commit()
    session.refresh(message)
    return message, status_msg
