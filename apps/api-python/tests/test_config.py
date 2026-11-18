import pytest

from app.config import validate_env

ALL_REQUIRED = {
    "MYSQL_USER": "root",
    "MYSQL_PASSWORD": "secret",
    "MYSQL_DATABASE": "testdb",
    "JWT_SECRET": "s" * 32,
}


def test_validate_env_passes_when_all_vars_set(monkeypatch):
    for var, val in ALL_REQUIRED.items():
        monkeypatch.setenv(var, val)
    validate_env()


def test_validate_env_exits_when_jwt_secret_missing(monkeypatch):
    for var, val in ALL_REQUIRED.items():
        monkeypatch.setenv(var, val)
    monkeypatch.delenv("JWT_SECRET")
    with pytest.raises(SystemExit) as exc:
        validate_env()
    assert exc.value.code == 1


def test_validate_env_exits_when_multiple_vars_missing(monkeypatch, capsys):
    monkeypatch.delenv("MYSQL_USER", raising=False)
    monkeypatch.delenv("MYSQL_PASSWORD", raising=False)
    monkeypatch.delenv("MYSQL_DATABASE", raising=False)
    monkeypatch.delenv("JWT_SECRET", raising=False)
    with pytest.raises(SystemExit) as exc:
        validate_env()
    assert exc.value.code == 1
    stderr = capsys.readouterr().err
    assert "MYSQL_USER" in stderr
    assert "JWT_SECRET" in stderr


def test_validate_env_exits_when_jwt_secret_too_short(monkeypatch, capsys):
    for var, val in ALL_REQUIRED.items():
        monkeypatch.setenv(var, val)
    monkeypatch.setenv("JWT_SECRET", "s" * 31)
    with pytest.raises(SystemExit) as exc:
        validate_env()
    assert exc.value.code == 1
    assert "JWT_SECRET must be at least 32 characters" in capsys.readouterr().err


def test_validate_env_accepts_jwt_secret_of_minimum_length(monkeypatch):
    for var, val in ALL_REQUIRED.items():
        monkeypatch.setenv(var, val)
    monkeypatch.setenv("JWT_SECRET", "s" * 32)
    validate_env()


@pytest.mark.parametrize("path", ["/docs", "/redoc", "/openapi.json"])
def test_api_docs_disabled_in_production(path):
    from fastapi import FastAPI
    from fastapi.testclient import TestClient

    from app.main import api_docs_urls

    resp = TestClient(FastAPI(**api_docs_urls("production"))).get(path)
    assert resp.status_code == 404


@pytest.mark.parametrize("env", ["development", "test"])
def test_api_docs_enabled_outside_production(env):
    from app.main import api_docs_urls

    assert api_docs_urls(env) == {"docs_url": "/docs", "redoc_url": "/redoc", "openapi_url": "/openapi.json"}
