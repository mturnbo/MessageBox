import hashlib
import os
from datetime import UTC, datetime, timedelta

import bcrypt
import jwt
from fastapi import Depends, HTTPException
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlmodel import Session

from app.config import JWT_AUDIENCE, JWT_ISSUER, JWT_SECRET
from app.database import get_session
from app.models.dbmodels import User

ALGORITHM = "HS256"

security = HTTPBearer()

# Matches the cost the Node API uses, since both write to the same users table
BCRYPT_ROUNDS = 12


def generate_hashed_password(password):
    salt = bcrypt.gensalt(rounds=BCRYPT_ROUNDS)
    return bcrypt.hashpw(password.encode("utf-8"), salt).decode("utf-8")


BCRYPT_MAX_PASSWORD_BYTES = 72


def compare_password(password, hashed_password):
    password_bytes = password.encode("utf-8")
    if len(password_bytes) > BCRYPT_MAX_PASSWORD_BYTES:
        return False
    return bcrypt.checkpw(password_bytes, hashed_password.encode("utf-8"))


def create_access_token(data: dict):
    to_encode = data.copy()
    exp_seconds = int(os.getenv("JWT_EXPIRATION_TIME", "86400"))
    expire = datetime.now(UTC) + timedelta(seconds=exp_seconds)
    to_encode.update({"exp": expire, "iss": JWT_ISSUER, "aud": JWT_AUDIENCE})
    return jwt.encode(to_encode, JWT_SECRET, algorithm=ALGORITHM)


def create_refresh_token(data: dict):
    to_encode = data.copy()
    exp_seconds = int(os.getenv("JWT_REFRESH_EXPIRATION_TIME", "604800"))
    expire = datetime.now(UTC) + timedelta(seconds=exp_seconds)
    to_encode.update({"exp": expire, "type": "refresh", "iss": JWT_ISSUER, "aud": JWT_AUDIENCE})
    return jwt.encode(to_encode, JWT_SECRET, algorithm=ALGORITHM)


def _decode(token_str: str) -> dict:
    return jwt.decode(
        token_str,
        JWT_SECRET,
        algorithms=[ALGORITHM],
        issuer=JWT_ISSUER,
        audience=JWT_AUDIENCE,
        options={"require": ["exp", "iss", "aud", "sub"]},
    )


def decode_token(token_str: str):
    try:
        return _decode(token_str)
    except jwt.PyJWTError:
        return None


def password_fingerprint(password_hash: str) -> str:
    return hashlib.sha256(password_hash.encode("utf-8")).hexdigest()[:16]


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
        payload = _decode(credentials.credentials)
        if payload.get("type") == "refresh":
            raise HTTPException(status_code=401, detail="Could not validate credentials")

        if payload.get("sub") is None:
            raise HTTPException(status_code=401, detail="Invalid credentials")

        return payload

    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token has expired") from None

    except jwt.PyJWTError:
        raise HTTPException(status_code=401, detail="Could not validate credentials") from None


def get_current_user(
    payload: dict = Depends(verify_token),
    session: Session = Depends(get_session),
) -> User:
    user = find_token_user(session, payload)
    if not user:
        raise HTTPException(status_code=401, detail="Authenticated user not found")
    return user
