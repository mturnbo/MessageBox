import os

from dotenv import load_dotenv
from sqlmodel import Session, create_engine

# Environment variables for database connection
load_dotenv()
MYSQL_USER = os.getenv("MYSQL_USER", "")
MYSQL_PASSWORD = os.getenv("MYSQL_PASSWORD", "")
MYSQL_HOST = os.getenv("MYSQL_HOST", "localhost")
MYSQL_PORT = os.getenv("MYSQL_PORT", "3306")
MYSQL_DATABASE = os.getenv("MYSQL_DATABASE", "")

DATABASE_URL = f"mysql+pymysql://{MYSQL_USER}:{MYSQL_PASSWORD}@{MYSQL_HOST}:{MYSQL_PORT}/{MYSQL_DATABASE}"


def sql_echo_enabled():
    return os.getenv("SQL_ECHO", "false").strip().lower() in ("true", "1")


engine = create_engine(DATABASE_URL, echo=sql_echo_enabled())


def get_session():
    with Session(engine) as session:
        yield session
