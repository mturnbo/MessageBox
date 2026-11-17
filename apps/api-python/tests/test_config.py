import pytest

from app.config import validate_env
from app.database import engine, sql_echo_enabled

ALL_REQUIRED = {
    "MYSQL_USER": "root",
    "MYSQL_PASSWORD": "secret",
    "MYSQL_DATABASE": "testdb",
    "JWT_SECRET": "supersecret",
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


def test_sql_echo_disabled_when_unset(monkeypatch):
    monkeypatch.delenv("SQL_ECHO", raising=False)
    assert sql_echo_enabled() is False


@pytest.mark.parametrize("value", ["true", "TRUE", "True", "1", " true "])
def test_sql_echo_enabled_for_truthy_values(monkeypatch, value):
    monkeypatch.setenv("SQL_ECHO", value)
    assert sql_echo_enabled() is True


@pytest.mark.parametrize("value", ["", "false", "0", "yes", "on", "2", "truthy"])
def test_sql_echo_disabled_for_other_values(monkeypatch, value):
    monkeypatch.setenv("SQL_ECHO", value)
    assert sql_echo_enabled() is False


def test_engine_echo_follows_sql_echo_setting():
    assert engine.echo is sql_echo_enabled()
