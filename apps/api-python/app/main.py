from fastapi import FastAPI, APIRouter
from app.routers import auth, users, messages, health, refresh
from fastapi.middleware.cors import CORSMiddleware
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from slowapi.middleware import SlowAPIMiddleware
from app.limiter import limiter
from dotenv import load_dotenv
import os

load_dotenv()

origins = [
    "http://localhost",
]

origin_port = os.getenv("ORIGIN", "")
if origin_port:
    origins.append(f"http://localhost:{origin_port}")

app = FastAPI(title="MessageBox API")

app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)
app.add_middleware(SlowAPIMiddleware)
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,  # Allow cookies to be sent with cross-origin requests
    allow_methods=["*"],     # Allow all HTTP methods (GET, POST, PUT, DELETE, etc.)
    allow_headers=["*"],     # Allow all headers
)

v1_router = APIRouter(prefix="/v1")
v1_router.include_router(auth.router)
v1_router.include_router(refresh.router)
v1_router.include_router(users.router)
v1_router.include_router(messages.router)
v1_router.include_router(health.router)

app.include_router(v1_router)

def main():
    import uvicorn
    port = int(os.getenv("PORT", "8000"))
    uvicorn.run("app.main:app", host="127.0.0.1", port=port)

if __name__ == "__main__":
    main()
