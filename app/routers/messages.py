from fastapi import APIRouter, Depends, HTTPException
from typing import List
from sqlmodel import Session, select
from app.models.dbmodels import Message
from app.database import get_session

router = APIRouter(prefix="/messages", tags=["messages"])

@router.get("/{message_id}", response_model=Message)
def get_messages_by_sender(message_id: int, session: Session = Depends(get_session)):
    message = session.exec(select(Message).where(Message.id == message_id)).first()
    if not message:
        raise HTTPException(status_code=404, detail="Message not found")

    return message


@router.get("/sender/{user_id}", response_model=List[Message])
def get_messages_by_sender(user_id: int, session: Session = Depends(get_session)):
    messages = session.exec(select(Message).where(Message.sender_id == user_id)).all()
    if not messages:
        raise HTTPException(status_code=404, detail="Messages not found")

    return messages


@router.get("/recipient/{user_id}", response_model=List[Message])
def get_messages_by_sender(user_id: int, session: Session = Depends(get_session)):
    messages = session.exec(select(Message).where(Message.recipient_id == user_id)).all()
    if not messages:
        raise HTTPException(status_code=404, detail="Messages not found")

    return messages