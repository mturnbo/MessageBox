from typing import Annotated

from pydantic import AfterValidator, StringConstraints

PASSWORD_MIN_LENGTH = 8
PASSWORD_MAX_BYTES = 72


def check_password_byte_length(password: str) -> str:
    if len(password.encode("utf-8")) > PASSWORD_MAX_BYTES:
        raise ValueError(f"Password must be at most {PASSWORD_MAX_BYTES} bytes")
    return password


Password = Annotated[
    str,
    StringConstraints(min_length=PASSWORD_MIN_LENGTH),
    AfterValidator(check_password_byte_length),
]


def check_username(username: str) -> str:
    if "@" in username:
        raise ValueError("Username must not contain '@'")
    try:
        int(username)
    except ValueError:
        return username
    raise ValueError("Username must not be numeric")
