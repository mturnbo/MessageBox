from fastapi import APIRouter, Depends, HTTPException
from fastapi.security import HTTPBearer
from sqlmodel import Session, select
from app.models.dbmodels import User
from app.database import get_session
from app.models.token import Token
from app.utilites.password import compare_password, create_access_token, verify_token, generate_hashed_password
from app.models.auth_credentials import AuthCredentials

router = APIRouter(prefix="/auth", tags=["auth"])
security = HTTPBearer()

@router.post("/", response_model=Token)
def authenticate_user(auth_cred: AuthCredentials, session: Session = Depends(get_session)):
    if auth_cred.username and auth_cred.password:
        user = session.exec(select(User).where(User.username == auth_cred.username)).first()
        if compare_password(auth_cred.password, user.password_hash):
            token_str = create_access_token(data={"sub": user.username})
            token = Token(token=token_str)
            return token

    return HTTPException(status_code=401, detail="Invalid credentials")
