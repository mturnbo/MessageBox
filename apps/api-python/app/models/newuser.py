from pydantic import BaseModel, EmailStr, field_validator

from app.models.validators import Password, check_username


class NewUser(BaseModel):
    username: str
    password: Password
    first_name: str
    last_name: str
    email: EmailStr
    device_address: str | None = None

    @field_validator("username")
    @classmethod
    def username_not_id_or_email(cls, username: str) -> str:
        return check_username(username)
