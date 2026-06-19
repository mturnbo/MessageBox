from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from app.utilites.password import decode_token, create_access_token

router = APIRouter(prefix="/auth", tags=["auth"])


class RefreshRequest(BaseModel):
    refreshToken: str


@router.post("/refresh")
def refresh_token(body: RefreshRequest):
    payload = decode_token(body.refreshToken)
    if not payload or payload.get("type") != "refresh":
        raise HTTPException(status_code=401, detail="Invalid refresh token")
    token = create_access_token(data={"sub": payload["sub"]})
    return {"token": token}
