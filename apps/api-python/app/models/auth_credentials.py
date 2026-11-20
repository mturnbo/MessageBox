from pydantic import BaseModel

from app.models.dbmodels import ShortText


class AuthCredentials(BaseModel):
    username: ShortText
    password: str
