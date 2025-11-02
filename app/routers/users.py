from fastapi import APIRouter, Depends, HTTPException, Query
from typing import List
from sqlmodel import Session, select
from app.models.dbmodels import User
from app.database import get_session
from app.models.token import Token
from app.utilites.password import compare_password, create_access_token
from app.models.auth_credentials import AuthCredentials

router = APIRouter(prefix="/users", tags=["users"])

@router.post("/auth", response_model=Token)
def authenticate_user(auth_cred: AuthCredentials, session: Session = Depends(get_session)):
    user = session.exec(select(User).where(User.username == auth_cred.username)).first()
    if compare_password(auth_cred.password, user.password_hash):
        token_str = create_access_token(data={"sub": user.username})
        token = Token(token=token_str)
        return token

    return HTTPException(status_code=401, detail="Invalid credentials")

@router.get("/", response_model=List[User])
def read_users(session: Session = Depends(get_session), offset: int = 0, limit: int = Query(default=100, le=100)):
    users = session.exec(select(User).offset(offset).limit(limit)).all()
    return users


@router.get("/{user_id}", response_model=User)
def read_user(user_id: int, session: Session = Depends(get_session)):
    user = session.get(User, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    return user
