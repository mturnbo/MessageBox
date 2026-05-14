from pydantic import BaseModel

class AuthCredentials(BaseModel):
    username: str
    password: str
