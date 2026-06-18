from pydantic import BaseModel

class Token(BaseModel):
    username: str
    token: str
    refreshToken: str
    token_type: str = "bearer"
