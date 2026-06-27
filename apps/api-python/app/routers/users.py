from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, Path, Query, Request
from fastapi.security import HTTPBearer
from typing import List
from sqlalchemy import or_
from sqlmodel import Session, select
from app.models.dbmodels import User, UserOut, UserPublic, UserUpdateRequest
from app.models.newuser import NewUser
from app.database import get_session
from app.utilites.password import verify_token, generate_hashed_password
from app.limiter import limiter, API_RATE_LIMIT

router = APIRouter(prefix="/users", tags=["users"])
security = HTTPBearer()

MAX_LIMIT = 100


def _user_out(user: User) -> UserOut:
    return UserOut(
        id=user.id,
        username=user.username,
        email=user.email,
        first_name=user.first_name,
        last_name=user.last_name,
        device_address=user.device_address,
        date_created=user.created_at,
        last_login=user.last_seen,
    )


@router.get("/", response_model=List[UserOut])
@limiter.limit(API_RATE_LIMIT)
def get_all_users(
        request: Request,
        session: Session = Depends(get_session),
        username: str = Depends(verify_token),
        offset: int = 0,
        limit: int = Query(default=100, le=MAX_LIMIT)
):
    users = session.exec(select(User).offset(offset).limit(limit)).all()
    return [_user_out(u) for u in users]


@router.get("/{limit}/{page}", response_model=List[UserOut])
@limiter.limit(API_RATE_LIMIT)
def get_all_users_paginated(
    request: Request,
    limit: int = Path(ge=1, le=MAX_LIMIT),
    page: int = Path(ge=1),
    session: Session = Depends(get_session),
    username: str = Depends(verify_token),
):
    offset = (page - 1) * limit
    users = session.exec(select(User).offset(offset).limit(limit)).all()
    return [_user_out(u) for u in users]


@router.get("/{user_id}", response_model=UserOut)
@limiter.limit(API_RATE_LIMIT)
def get_user(
    request: Request,
    user_id: str,
    session: Session = Depends(get_session),
    username: str = Depends(verify_token),
):
    try:
        uid = int(user_id)
    except ValueError:
        uid = None

    user = session.exec(
        select(User).where(or_(User.id == uid, User.username == user_id, User.email == user_id))
    ).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    return _user_out(user)


@router.post("/register", response_model=UserOut, status_code=201)
@limiter.limit(API_RATE_LIMIT)
def create_user(
    request: Request,
    user_data: NewUser,
    session: Session = Depends(get_session),
    username: str = Depends(verify_token),
):
    if session.exec(select(User).where(User.username == user_data.username)).first():
        raise HTTPException(status_code=400, detail="Username already exists")

    if session.exec(select(User).where(User.email == user_data.email)).first():
        raise HTTPException(status_code=400, detail="Email already exists")

    new_user = User(
        username=user_data.username,
        email=user_data.email,
        password_hash=generate_hashed_password(user_data.password),
        first_name=user_data.first_name,
        last_name=user_data.last_name,
        device_address=user_data.device_address,
        created_at=datetime.now(timezone.utc),
    )

    session.add(new_user)
    session.commit()
    session.refresh(new_user)
    return _user_out(new_user)


@router.post("/update", response_model=UserOut)
@limiter.limit(API_RATE_LIMIT)
def update_user(
    request: Request,
    payload: UserUpdateRequest,
    session: Session = Depends(get_session),
    username: str = Depends(verify_token),
):
    user = session.get(User, payload.id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    fields = payload.user_update
    if fields.username is not None:
        user.username = fields.username
    if fields.email is not None:
        user.email = fields.email
    if fields.password is not None:
        user.password_hash = generate_hashed_password(fields.password)
    if fields.first_name is not None:
        user.first_name = fields.first_name
    if fields.last_name is not None:
        user.last_name = fields.last_name
    if fields.device_address is not None:
        user.device_address = fields.device_address

    session.add(user)
    session.commit()
    session.refresh(user)
    return _user_out(user)


@router.delete("/delete/{id}", response_model=UserOut)
@limiter.limit(API_RATE_LIMIT)
def delete_user(
    request: Request,
    id: int,
    session: Session = Depends(get_session),
    username: str = Depends(verify_token),
):
    user = session.get(User, id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    out = _user_out(user)
    session.delete(user)
    session.commit()
    return out
