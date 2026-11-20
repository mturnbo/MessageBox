import os
from uuid import uuid4

from dotenv import load_dotenv

load_dotenv()

from app.config import validate_env

validate_env()

from app.logging_config import RequestLoggingMiddleware, configure_logging

configure_logging()

from asgi_correlation_id import CorrelationIdMiddleware
from fastapi import APIRouter, FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from slowapi.errors import RateLimitExceeded
from slowapi.middleware import SlowAPIMiddleware
from starlette.exceptions import HTTPException as StarletteHTTPException

from app.limiter import limiter
from app.routers import auth, health, messages, refresh, users

origins = [
    "http://localhost",
]

origin_port = os.getenv("ORIGIN", "")
if origin_port:
    origins.append(f"http://localhost:{origin_port}")


def api_docs_urls(env: str) -> dict:
    if env == "production":
        return {"docs_url": None, "redoc_url": None, "openapi_url": None}
    return {"docs_url": "/docs", "redoc_url": "/redoc", "openapi_url": "/openapi.json"}


app = FastAPI(title="MessageBox API", **api_docs_urls(os.getenv("ENV", "development")))


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


@app.exception_handler(Exception)
async def unhandled_exception_handler(request: Request, exc: Exception):
    return JSONResponse(status_code=500, content={"error": {"message": "Internal Server Error"}})


app.state.limiter = limiter
app.add_middleware(SlowAPIMiddleware)
app.add_middleware(RequestLoggingMiddleware)
app.add_middleware(CorrelationIdMiddleware, header_name="X-Request-ID", generator=lambda: str(uuid4()))
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
    uvicorn.run("app.main:app", host="127.0.0.1", port=port, access_log=False)


if __name__ == "__main__":
    main()
