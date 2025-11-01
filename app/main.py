from fastapi import FastAPI
from app.routers import users, messages

app = FastAPI(title="User API")
app.include_router(users.router)
app.include_router(messages.router)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)