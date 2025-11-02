from datetime import datetime, timedelta
import jwt
from typing import Optional
from dotenv import load_dotenv
import os
import bcrypt

# Environment variables for JWT
load_dotenv()
JWT_SECRET = os.getenv("JWT_SECRET", "3306")
JWT_EXPIRATION_TIME = os.getenv("JWT_EXPIRATION_TIME", "users_db")
ALGORITHM = "HS256"


def generate_hashed_password(password):
    salt = bcrypt.gensalt(rounds=10)
    return bcrypt.hashpw(password.encode('utf-8'), salt)


def compare_password(password, hashed_password):
    return bcrypt.checkpw(password.encode('utf-8'), hashed_password.encode('utf-8'))


def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=30)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, JWT_SECRET, algorithm=ALGORITHM)
    return encoded_jwt