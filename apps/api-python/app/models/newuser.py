
from pydantic import BaseModel


class NewUser(BaseModel):
    username: str
    password: str
    first_name: str
    last_name: str
    email: str
    device_address: str | None = None
