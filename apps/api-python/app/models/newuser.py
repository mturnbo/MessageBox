from pydantic import BaseModel

from app.models.dbmodels import ShortText


class NewUser(BaseModel):
    username: ShortText
    password: str
    first_name: ShortText
    last_name: ShortText
    email: ShortText
    device_address: ShortText | None = None
