from pydantic import BaseModel, EmailStr

from app.models.validators import Password


class NewUser(BaseModel):
    username: str
    password: Password
    first_name: str
    last_name: str
    email: EmailStr
    device_address: str | None = None
