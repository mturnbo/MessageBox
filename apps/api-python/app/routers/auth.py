from fastapi import APIRouter, Depends, HTTPException, Request
from fastapi.security import HTTPBearer
from sqlalchemy import or_
from sqlmodel import Session, select
from app.models.dbmodels import User
from app.database import get_session
from app.models.token import Token
from app.utilites.password import compare_password, create_access_token, verify_token, generate_hashed_password
from app.models.auth_credentials import AuthCredentials
from app.limiter import limiter, AUTH_RATE_LIMIT

router = APIRouter(prefix="/auth", tags=["auth"])
security = HTTPBearer()

@router.post("", response_model=Token)
@limiter.limit(AUTH_RATE_LIMIT)
def authenticate_user(request: Request, auth_cred: AuthCredentials, session: Session = Depends(get_session)):
    user = session.exec(
        select(User).where(or_(User.username == auth_cred.username, User.email == auth_cred.username))
    ).first()
    if user and compare_password(auth_cred.password, user.password_hash):
        token_str = create_access_token(data={"sub": user.username})
        return Token(username=user.username, token=token_str)
    raise HTTPException(status_code=401, detail="Invalid credentials")
