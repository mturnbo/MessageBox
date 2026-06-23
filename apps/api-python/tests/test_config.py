import pytest
from app.config import validate_env

ALL_REQUIRED = {
    'MYSQL_USER': 'root',
    'MYSQL_PASSWORD': 'secret',
    'MYSQL_DATABASE': 'testdb',
    'JWT_SECRET': 'supersecret',
}


def test_validate_env_passes_when_all_vars_set(monkeypatch):
    for var, val in ALL_REQUIRED.items():
        monkeypatch.setenv(var, val)
    validate_env()


def test_validate_env_exits_when_jwt_secret_missing(monkeypatch):
    for var, val in ALL_REQUIRED.items():
        monkeypatch.setenv(var, val)
    monkeypatch.delenv('JWT_SECRET')
    with pytest.raises(SystemExit) as exc:
        validate_env()
    assert exc.value.code == 1


def test_validate_env_exits_when_multiple_vars_missing(monkeypatch, capsys):
    monkeypatch.delenv('MYSQL_USER', raising=False)
    monkeypatch.delenv('MYSQL_PASSWORD', raising=False)
    monkeypatch.delenv('MYSQL_DATABASE', raising=False)
    monkeypatch.delenv('JWT_SECRET', raising=False)
    with pytest.raises(SystemExit) as exc:
        validate_env()
    assert exc.value.code == 1
    stderr = capsys.readouterr().err
    assert 'MYSQL_USER' in stderr
    assert 'JWT_SECRET' in stderr
