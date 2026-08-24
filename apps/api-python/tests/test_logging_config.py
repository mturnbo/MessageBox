import pytest
import structlog
from asgi_correlation_id import correlation_id
from fastapi.testclient import TestClient
from sqlmodel import Session, SQLModel, create_engine
from sqlmodel.pool import StaticPool
from structlog.testing import capture_logs

from app.database import get_session
from app.limiter import limiter
from app.logging_config import (
    add_correlation_id,
    configure_logging,
    redact_sensitive_data,
)
from app.main import app


@pytest.fixture(name="session")
def session_fixture():
    engine = create_engine(
        "sqlite:///:memory:",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    SQLModel.metadata.create_all(engine)
    with Session(engine) as session:
        yield session


@pytest.fixture(name="client")
def client_fixture(session):
    def override_get_session():
        yield session

    limiter._storage.reset()
    app.dependency_overrides[get_session] = override_get_session
    yield TestClient(app)
    app.dependency_overrides.clear()


def test_redact_sensitive_data_top_level_fields():
    event_dict = {
        "event": "user_created",
        "password": "hunter2",
        "token": "abc123",
        "authorization": "Bearer abc123",
        "username": "alice",
    }

    result = redact_sensitive_data(None, "info", event_dict)

    assert result["password"] == "[REDACTED]"
    assert result["token"] == "[REDACTED]"
    assert result["authorization"] == "[REDACTED]"
    assert result["username"] == "alice"


def test_redact_sensitive_data_nested_and_camelcase():
    event_dict = {
        "event": "payment_attempted",
        "headers": {"Authorization": "Bearer secret", "content-type": "json"},
        "payment": {"creditCard": "4111111111111111", "cardNumber": "4111", "cvv": "123"},
    }

    result = redact_sensitive_data(None, "info", event_dict)

    assert result["headers"]["Authorization"] == "[REDACTED]"
    assert result["headers"]["content-type"] == "json"
    assert result["payment"]["creditCard"] == "[REDACTED]"
    assert result["payment"]["cardNumber"] == "[REDACTED]"
    assert result["payment"]["cvv"] == "[REDACTED]"


def test_redact_sensitive_data_within_list():
    event_dict = {"users": [{"passwordHash": "abc"}, {"ssn": "123-45-6789"}]}

    result = redact_sensitive_data(None, "info", event_dict)

    assert result["users"][0]["passwordHash"] == "[REDACTED]"
    assert result["users"][1]["ssn"] == "[REDACTED]"


def test_add_correlation_id_present():
    token = correlation_id.set("test-request-id")
    try:
        result = add_correlation_id(None, "info", {"event": "x"})
        assert result["request_id"] == "test-request-id"
    finally:
        correlation_id.reset(token)


def test_add_correlation_id_absent():
    token = correlation_id.set(None)
    try:
        result = add_correlation_id(None, "info", {"event": "x"})
        assert "request_id" not in result
    finally:
        correlation_id.reset(token)


def test_configure_logging_uses_json_renderer_in_production(monkeypatch):
    monkeypatch.setenv("ENV", "production")
    try:
        configure_logging()
        renderer = structlog.get_config()["processors"][-1]
        assert isinstance(renderer, structlog.processors.JSONRenderer)
    finally:
        configure_logging()


def test_configure_logging_uses_console_renderer_in_development(monkeypatch):
    monkeypatch.setenv("ENV", "development")
    configure_logging()
    renderer = structlog.get_config()["processors"][-1]
    assert isinstance(renderer, structlog.dev.ConsoleRenderer)


def test_request_logging_middleware_logs_completed_request(client):
    processors = [add_correlation_id, redact_sensitive_data]
    with capture_logs(processors=processors) as logs:
        resp = client.get("/v1/health")

    assert resp.status_code == 200
    request_id = resp.headers["x-request-id"]

    completed = [e for e in logs if e.get("event") == "request_completed"]
    assert len(completed) == 1
    entry = completed[0]
    assert entry["method"] == "GET"
    assert entry["path"] == "/v1/health"
    assert entry["status_code"] == 200
    assert isinstance(entry["duration_ms"], float)
    assert entry["request_id"] == request_id


def test_request_logging_middleware_logs_traceback_on_500(client):
    def broken_session():
        raise RuntimeError("boom")
        yield  # pragma: no cover

    app.dependency_overrides[get_session] = broken_session
    broken_client = TestClient(app, raise_server_exceptions=False)

    processors = [add_correlation_id, redact_sensitive_data, structlog.processors.format_exc_info]
    with capture_logs(processors=processors) as logs:
        resp = broken_client.get("/v1/health")

    assert resp.status_code == 500

    failed = [e for e in logs if e.get("event") == "request_failed"]
    assert len(failed) == 1
    entry = failed[0]
    assert entry["method"] == "GET"
    assert entry["path"] == "/v1/health"
    assert entry["status_code"] == 500
    assert "RuntimeError" in entry["exception"]
    assert "boom" in entry["exception"]
