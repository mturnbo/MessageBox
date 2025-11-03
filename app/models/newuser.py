from typing import Optional
from pydantic import BaseModel

class NewUser(BaseModel):
    username: str
    password: str
    first_name: str
    last_name: str
    email: str
    device_address: Optional[str] = None
