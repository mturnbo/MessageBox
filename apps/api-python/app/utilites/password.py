from datetime import datetime, timedelta, timezone
import hashlib
import jwt
import os
import bcrypt
from fastapi import Depends, HTTPException
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlmodel import Session
from app.config import JWT_SECRET
from app.database import get_session
from app.models.dbmodels import User

ALGORITHM = "HS256"

security = HTTPBearer()


def generate_hashed_password(password):
    salt = bcrypt.gensalt(rounds=10)
    return bcrypt.hashpw(password.encode('utf-8'), salt).decode('utf-8')


def compare_password(password, hashed_password):
    return bcrypt.checkpw(password.encode('utf-8'), hashed_password.encode('utf-8'))


def create_access_token(data: dict):
    to_encode = data.copy()
    exp_seconds = int(os.getenv('JWT_EXPIRATION_TIME', '86400'))
    expire = datetime.now(timezone.utc) + timedelta(seconds=exp_seconds)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, JWT_SECRET, algorithm=ALGORITHM)


def create_refresh_token(data: dict):
    to_encode = data.copy()
    exp_seconds = int(os.getenv('JWT_REFRESH_EXPIRATION_TIME', '604800'))
    expire = datetime.now(timezone.utc) + timedelta(seconds=exp_seconds)
    to_encode.update({"exp": expire, "type": "refresh"})
    return jwt.encode(to_encode, JWT_SECRET, algorithm=ALGORITHM)


def decode_token(token_str: str):
    try:
        return jwt.decode(token_str, JWT_SECRET, algorithms=[ALGORITHM])
    except jwt.PyJWTError:
        return None


def password_fingerprint(password_hash: str) -> str:
    return hashlib.sha256(password_hash.encode('utf-8')).hexdigest()[:16]


def token_claims(user: User) -> dict:
    return {"sub": str(user.id), "pwd_fp": password_fingerprint(user.password_hash)}


def find_token_user(session: Session, payload: dict) -> User | None:
    try:
        user_id = int(payload.get("sub"))
    except (TypeError, ValueError):
        return None
    user = session.get(User, user_id)
    if not user or payload.get("pwd_fp") != password_fingerprint(user.password_hash):
        return None
    return user


def verify_token(credentials: HTTPAuthorizationCredentials = Depends(security)):
    try:
        payload = jwt.decode(credentials.credentials, JWT_SECRET, algorithms=[ALGORITHM])
        if payload.get("type") == "refresh":
            raise HTTPException(status_code=401, detail="Could not validate credentials")

        if payload.get("sub") is None:
            raise HTTPException(status_code=401, detail="Invalid credentials")

        return payload

    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token has expired")

    except jwt.PyJWTError:
        raise HTTPException(status_code=401, detail="Could not validate credentials")


def get_current_user(
    payload: dict = Depends(verify_token),
    session: Session = Depends(get_session),
) -> User:
    user = find_token_user(session, payload)
    if not user:
        raise HTTPException(status_code=401, detail="Authenticated user not found")
    return user
