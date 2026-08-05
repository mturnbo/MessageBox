import os
import sys
from dotenv import load_dotenv

load_dotenv()

from app.config import validate_env
validate_env()

from fastapi import FastAPI, APIRouter, Request
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from starlette.exceptions import HTTPException as StarletteHTTPException
from app.routers import auth, users, messages, health, refresh
from fastapi.middleware.cors import CORSMiddleware
from slowapi.errors import RateLimitExceeded
from slowapi.middleware import SlowAPIMiddleware
from app.limiter import limiter

origins = [
    "http://localhost",
]

origin_port = os.getenv("ORIGIN", "")
if origin_port:
    origins.append(f"http://localhost:{origin_port}")

app = FastAPI(title="MessageBox API")


@app.exception_handler(StarletteHTTPException)
async def http_exception_handler(request: Request, exc: StarletteHTTPException):
    return JSONResponse(status_code=exc.status_code, content={"error": {"message": exc.detail}})


@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    details = [f"{'.'.join(str(part) for part in e['loc'])}: {e['msg']}" for e in exc.errors()]
    return JSONResponse(
        status_code=422,
        content={"error": {"message": "Validation error", "details": details}},
    )


@app.exception_handler(RateLimitExceeded)
async def rate_limit_exception_handler(request: Request, exc: RateLimitExceeded):
    return JSONResponse(status_code=429, content={"error": {"message": f"Rate limit exceeded: {exc.detail}"}})


app.state.limiter = limiter
app.add_middleware(SlowAPIMiddleware)
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
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
