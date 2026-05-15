from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select
from app.database import get_session

router = APIRouter(prefix="/health", tags=["health"])

@router.get("/")
def ping_db(session: Session = Depends(get_session)):
  try:
    session.exec(select(1))
  except:
    raise HTTPException(status_code=503, detail="Database not reachable")

  return {"ping": "pong!"}
