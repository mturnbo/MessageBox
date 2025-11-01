from sqlmodel import Session, select
from dbmodels import User
from database import engine


with Session(engine) as session:
    statement = select(User).where(User.id == 10001)
    results = session.exec(statement)
    for user in results:
        print(user)
