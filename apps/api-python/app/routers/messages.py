from fastapi import APIRouter, Depends, HTTPException, Query, Request, Response
from sqlmodel import Session
from app.models.dbmodels import (
    CreateMessageRequest,
    ReplyToMessageRequest,
    ReadMessageRequest,
    DeleteMessageRequest,
    MessageOut,
    MessageListResponse,
    MessagePostResponse,
)
from app.database import get_session
from app.utilites.password import verify_token
from app.services import message_service
from app.limiter import limiter, API_RATE_LIMIT

router = APIRouter(prefix="/messages", tags=["messages"])

MAX_LIMIT = 100
DEFAULT_LIMIT = 10


@router.get("/inbox", response_model=MessageListResponse)
@limiter.limit(API_RATE_LIMIT)
def get_inbox(
    request: Request,
    recipient_id: int = Query(..., alias="recipientId"),
    limit: int = Query(default=DEFAULT_LIMIT, ge=1, le=MAX_LIMIT),
    page: int = Query(default=1, ge=1),
    session: Session = Depends(get_session),
    username: str = Depends(verify_token),
):
    return message_service.get_inbox(session, recipient_id, limit, page)


@router.get("/sent", response_model=MessageListResponse)
@limiter.limit(API_RATE_LIMIT)
def get_sent(
    request: Request,
    sender_id: int = Query(..., alias="senderId"),
    limit: int = Query(default=DEFAULT_LIMIT, ge=1, le=MAX_LIMIT),
    page: int = Query(default=1, ge=1),
    session: Session = Depends(get_session),
    username: str = Depends(verify_token),
):
    return message_service.get_sent(session, sender_id, limit, page)


@router.get("/{id}/thread")
@limiter.limit(API_RATE_LIMIT)
def get_thread(
    request: Request,
    id: int,
    session: Session = Depends(get_session),
    username: str = Depends(verify_token),
):
    result = message_service.get_thread_by_message_id(session, id)
    if result is None:
        raise HTTPException(status_code=404, detail="Message not found")
    return result


@router.get("/{id}", response_model=MessageOut)
@limiter.limit(API_RATE_LIMIT)
def get_message(
    request: Request,
    id: int,
    session: Session = Depends(get_session),
    username: str = Depends(verify_token),
):
    message = message_service.get_message_by_id(session, id)
    if not message:
        raise HTTPException(status_code=404, detail="Message not found")
    return message


@router.post("/post", response_model=MessagePostResponse, status_code=201)
@limiter.limit(API_RATE_LIMIT)
def create_message(
    request: Request,
    payload: CreateMessageRequest,
    response: Response,
    session: Session = Depends(get_session),
    username: str = Depends(verify_token),
):
    idempotency_key = request.headers.get("idempotency-key")
    message, replayed = message_service.create_message(session, payload, idempotency_key)
    if replayed:
        response.status_code = 200
    return MessagePostResponse.model_validate(
        {**message.model_dump(), "idempotency_replayed": replayed}
    )


@router.post("/reply", response_model=MessagePostResponse, status_code=201)
@limiter.limit(API_RATE_LIMIT)
def reply_to_message(
    request: Request,
    payload: ReplyToMessageRequest,
    response: Response,
    session: Session = Depends(get_session),
    username: str = Depends(verify_token),
):
    idempotency_key = request.headers.get("idempotency-key")
    message, thread_id, reply_to, replayed = message_service.reply_to_message(
        session, payload, idempotency_key
    )
    if replayed:
        response.status_code = 200
    return MessagePostResponse.model_validate(
        {
            **message.model_dump(),
            "thread_id": thread_id,
            "reply_to": reply_to,
            "idempotency_replayed": replayed,
        }
    )


@router.post("/read")
@limiter.limit(API_RATE_LIMIT)
def read_message(
    request: Request,
    payload: ReadMessageRequest,
    session: Session = Depends(get_session),
    username: str = Depends(verify_token),
):
    message = message_service.read_message(session, payload.id, payload.reader_address)
    if not message:
        raise HTTPException(status_code=404, detail="Message not found")
    return {"status": "Message read successfully"}


@router.post("/delete")
@limiter.limit(API_RATE_LIMIT)
def delete_message(
    request: Request,
    payload: DeleteMessageRequest,
    session: Session = Depends(get_session),
    username: str = Depends(verify_token),
):
    message, status_msg = message_service.delete_message(session, payload.id, payload.deleted_by)
    if message is None:
        raise HTTPException(status_code=404, detail="Message not found")
    return {"status": status_msg}
