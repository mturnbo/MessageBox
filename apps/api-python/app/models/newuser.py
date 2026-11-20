from pydantic import BaseModel, EmailStr, field_validator

from app.models.dbmodels import ShortText
from app.models.validators import Password, check_username


class NewUser(BaseModel):
    username: ShortText
    password: Password
    first_name: ShortText
    last_name: ShortText
    email: EmailStr
    device_address: ShortText | None = None

    @field_validator("username")
    @classmethod
    def username_not_id_or_email(cls, username: str) -> str:
        return check_username(username)
