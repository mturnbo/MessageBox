from fastapi import FastAPI
from app.routers import users, messages

app = FastAPI(title="User API")
app.include_router(users.router)
app.include_router(messages.router)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="127.0.0.1", port=8000)