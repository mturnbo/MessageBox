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

router = APIRouter(prefix="/messages", tags=["messages"])


@router.get("/inbox", response_model=MessageListResponse)
def get_inbox(
    recipient_id: int = Query(..., alias="recipientId"),
    limit: int = Query(default=10),
    page: int = Query(default=1, ge=1),
    session: Session = Depends(get_session),
    username: str = Depends(verify_token),
):
    return message_service.get_inbox(session, recipient_id, limit, page)


@router.get("/sent", response_model=MessageListResponse)
def get_sent(
    sender_id: int = Query(..., alias="senderId"),
    limit: int = Query(default=10),
    page: int = Query(default=1, ge=1),
    session: Session = Depends(get_session),
    username: str = Depends(verify_token),
):
    return message_service.get_sent(session, sender_id, limit, page)


@router.get("/{id}/thread")
def get_thread(
    id: int,
    session: Session = Depends(get_session),
    username: str = Depends(verify_token),
):
    result = message_service.get_thread_by_message_id(session, id)
    if result is None:
        raise HTTPException(status_code=404, detail="Message not found")
    return result


@router.get("/{id}", response_model=MessageOut)
def get_message(
    id: int,
    session: Session = Depends(get_session),
    username: str = Depends(verify_token),
):
    message = message_service.get_message_by_id(session, id)
    if not message:
        raise HTTPException(status_code=404, detail="Message not found")
    return message


@router.post("/post", response_model=MessagePostResponse, status_code=201)
def create_message(
    payload: CreateMessageRequest,
    request: Request,
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
def reply_to_message(
    payload: ReplyToMessageRequest,
    request: Request,
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
def read_message(
    payload: ReadMessageRequest,
    session: Session = Depends(get_session),
    username: str = Depends(verify_token),
):
    message = message_service.read_message(session, payload.id, payload.reader_address)
    if not message:
        raise HTTPException(status_code=404, detail="Message not found")
    return {"status": "Message read successfully"}


@router.post("/delete")
def delete_message(
    payload: DeleteMessageRequest,
    session: Session = Depends(get_session),
    username: str = Depends(verify_token),
):
    message, status_msg = message_service.delete_message(session, payload.id, payload.deleted_by)
    if message is None:
        raise HTTPException(status_code=404, detail="Message not found")
    return {"status": status_msg}
