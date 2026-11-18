import os
import sys

from dotenv import load_dotenv

load_dotenv()

_REQUIRED = [
    ("MYSQL_USER", "MySQL username"),
    ("MYSQL_PASSWORD", "MySQL password"),
    ("MYSQL_DATABASE", "MySQL database name"),
    ("JWT_SECRET", "JWT signing secret"),
]

JWT_SECRET = os.getenv("JWT_SECRET")
JWT_SECRET_MIN_LENGTH = 32
JWT_ISSUER = os.getenv("JWT_ISSUER", "messagebox-api-python")
JWT_AUDIENCE = os.getenv("JWT_AUDIENCE", "messagebox")


def validate_env():
    missing = [(var, desc) for var, desc in _REQUIRED if not os.getenv(var)]
    if missing:
        for var, desc in missing:
            print(f"[CONFIG] Missing required env var: {var} ({desc})", file=sys.stderr, flush=True)
        sys.exit(1)
    if len(os.getenv("JWT_SECRET")) < JWT_SECRET_MIN_LENGTH:
        print(
            f"[CONFIG] JWT_SECRET must be at least {JWT_SECRET_MIN_LENGTH} characters",
            file=sys.stderr,
            flush=True,
        )
        sys.exit(1)
