from pydantic import BaseModel

class Token(BaseModel):
    username: str
    token: str
    token_type: str = "bearer"
