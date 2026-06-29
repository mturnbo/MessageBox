from datetime import datetime, timedelta, timezone
import jwt
from dotenv import load_dotenv
import os
import bcrypt
from fastapi import Depends, HTTPException
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

load_dotenv()
JWT_SECRET = os.getenv("JWT_SECRET", "")
ALGORITHM = "HS256"

security = HTTPBearer()


def generate_hashed_password(password):
    salt = bcrypt.gensalt(rounds=10)
    return bcrypt.hashpw(password.encode('utf-8'), salt)


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
    expire = datetime.utcnow() + timedelta(seconds=exp_seconds)
    to_encode.update({"exp": expire, "type": "refresh"})
    return jwt.encode(to_encode, JWT_SECRET, algorithm=ALGORITHM)


def decode_token(token_str: str):
    try:
        return jwt.decode(token_str, JWT_SECRET, algorithms=[ALGORITHM])
    except jwt.PyJWTError:
        return None


def verify_token(credentials: HTTPAuthorizationCredentials = Depends(security)):
    try:
        payload = jwt.decode(credentials.credentials, JWT_SECRET, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        if username is None:
            raise HTTPException(status_code=401, detail="Invalid credentials")

        return username

    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token has expired")

    except jwt.PyJWTError:
        raise HTTPException(status_code=401, detail="Could not validate credentials")
