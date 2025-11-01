from fastapi import FastAPI
from app.routers import users

app = FastAPI(title="User API")
app.include_router(users.router)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)