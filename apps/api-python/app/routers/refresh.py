from fastapi import APIRouter, Depends, HTTPException, Request
from pydantic import BaseModel
from sqlmodel import Session

from app.database import get_session
from app.limiter import AUTH_RATE_LIMIT, limiter
from app.utilites.password import create_access_token, decode_token, find_token_user, token_claims

router = APIRouter(prefix="/auth", tags=["auth"])


class RefreshRequest(BaseModel):
    refreshToken: str


@router.post("/refresh")
@limiter.limit(AUTH_RATE_LIMIT)
def refresh_token(request: Request, body: RefreshRequest, session: Session = Depends(get_session)):
    payload = decode_token(body.refreshToken)
    if not payload or payload.get("type") != "refresh":
        raise HTTPException(status_code=401, detail="Invalid refresh token")
    user = find_token_user(session, payload)
    if not user:
        raise HTTPException(status_code=401, detail="Invalid refresh token")
    token = create_access_token(data=token_claims(user))
    return {"token": token}
