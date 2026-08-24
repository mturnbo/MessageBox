import logging
import os
import sys
import time
from dataclasses import dataclass
from typing import TYPE_CHECKING

import structlog
from asgi_correlation_id import correlation_id

if TYPE_CHECKING:
    from starlette.types import ASGIApp, Message, Receive, Scope, Send

CENSORED = "[REDACTED]"

_SENSITIVE_FIELDS = {
    "password",
    "passwordhash",
    "token",
    "accesstoken",
    "refreshtoken",
    "authorization",
    "cookie",
    "creditcard",
    "cardnumber",
    "cvv",
    "ssn",
}


def _normalize(key: str) -> str:
    return key.lower().replace("_", "")


def _redact_value(key, value):
    if _normalize(str(key)) in _SENSITIVE_FIELDS:
        return CENSORED
    if isinstance(value, dict):
        return {k: _redact_value(k, v) for k, v in value.items()}
    if isinstance(value, list):
        return [_redact_value(key, v) for v in value]
    return value


def redact_sensitive_data(logger, method_name, event_dict):
    for key, value in event_dict.items():
        event_dict[key] = _redact_value(key, value)
    return event_dict


def add_correlation_id(logger, method_name, event_dict):
    request_id = correlation_id.get()
    if request_id:
        event_dict["request_id"] = request_id
    return event_dict


def configure_logging() -> None:
    env = os.getenv("ENV", "development")
    is_production = env == "production"
    level_name = os.getenv("LOG_LEVEL", "INFO").upper()
    level = logging.getLevelNamesMapping().get(level_name, logging.INFO)

    shared_processors = [
        structlog.stdlib.add_log_level,
        structlog.processors.TimeStamper(fmt="iso"),
        add_correlation_id,
        redact_sensitive_data,
        structlog.processors.StackInfoRenderer(),
        structlog.processors.format_exc_info,
    ]

    renderer = structlog.processors.JSONRenderer() if is_production else structlog.dev.ConsoleRenderer()

    structlog.configure(
        processors=[*shared_processors, renderer],
        wrapper_class=structlog.make_filtering_bound_logger(level),
        logger_factory=structlog.PrintLoggerFactory(file=sys.stdout),
        cache_logger_on_first_use=True,
    )


request_logger = structlog.get_logger("app.request")


@dataclass
class RequestLoggingMiddleware:
    """Logs method, path, status code, and duration for every request.

    Must run inside CorrelationIdMiddleware so request_id is already bound
    to the correlation_id contextvar by the time a request is logged.
    """

    app: "ASGIApp"

    async def __call__(self, scope: "Scope", receive: "Receive", send: "Send") -> None:
        if scope["type"] != "http":
            await self.app(scope, receive, send)
            return

        start = time.perf_counter()
        status_code = 500

        async def send_wrapper(message: "Message") -> None:
            nonlocal status_code
            if message["type"] == "http.response.start":
                status_code = message["status"]
            await send(message)

        try:
            await self.app(scope, receive, send_wrapper)
        except Exception:
            duration_ms = round((time.perf_counter() - start) * 1000, 2)
            request_logger.error(
                "request_failed",
                method=scope["method"],
                path=scope["path"],
                status_code=500,
                duration_ms=duration_ms,
                exc_info=True,
            )
            raise
        else:
            duration_ms = round((time.perf_counter() - start) * 1000, 2)
            log = request_logger.error if status_code >= 500 else request_logger.info
            log(
                "request_completed",
                method=scope["method"],
                path=scope["path"],
                status_code=status_code,
                duration_ms=duration_ms,
            )
