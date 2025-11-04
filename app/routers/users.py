from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from typing import List
from sqlmodel import Session, select
from app.models.dbmodels import User, UserPublic
from app.models.newuser import NewUser
from app.database import get_session
from app.models.token import Token
from app.utilites.password import compare_password, create_access_token, verify_token, generate_hashed_password
from app.models.auth_credentials import AuthCredentials

router = APIRouter(prefix="/users", tags=["users"])
security = HTTPBearer()

@router.post("/auth", response_model=Token)
def authenticate_user(auth_cred: AuthCredentials, session: Session = Depends(get_session)):
    user = session.exec(select(User).where(User.username == auth_cred.username)).first()
    if compare_password(auth_cred.password, user.password_hash):
        token_str = create_access_token(data={"sub": user.username})
        token = Token(token=token_str)
        return token

    return HTTPException(status_code=401, detail="Invalid credentials")

@router.get("/", response_model=List[UserPublic])
def get_all_users(
        session: Session = Depends(get_session),
        username: str = Depends(verify_token),
        offset: int = 0,
        limit: int = Query(default=100, le=100)
):
    users = session.exec(select(User).offset(offset).limit(limit)).all()
    return users


@router.get("/{user_id}", response_model=UserPublic)
def get_user(
    user_id: int,
    session: Session = Depends(get_session),
    username: str = Depends(verify_token),
):
    user = session.get(User, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    return user

@router.post("/register", response_model=User)
def create_user(
    user_data: NewUser,
    session: Session = Depends(get_session),
    username: str = Depends(verify_token),
):
    # Check if username already exists
    if session.exec(select(User).where(User.username == user_data.username)).first():
        raise HTTPException(status_code=400, detail="Username already exists")

    # Check if email already exists
    if session.exec(select(User).where(User.email == user_data.email)).first():
        raise HTTPException(status_code=400, detail="Email already exists")

    new_user = User(
        username=user_data.username,
        email=user_data.email,
        password_hash=generate_hashed_password(user_data.password),
        first_name=user_data.first_name,
        last_name=user_data.last_name,
        device_address=user_data.device_address,
        created_at=datetime.utcnow().isoformat()
    )

    session.add(new_user)
    session.commit()
    session.refresh(new_user)
    return new_user
