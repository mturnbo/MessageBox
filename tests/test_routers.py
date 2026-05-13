from datetime import datetime, timezone
import pytest
from fastapi.testclient import TestClient
from sqlmodel import SQLModel, Session, create_engine
from sqlmodel.pool import StaticPool

from app.main import app
from app.database import get_session
from app.models.dbmodels import User, Message
from app.utilites.password import generate_hashed_password, create_access_token


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

    app.dependency_overrides[get_session] = override_get_session
    yield TestClient(app)
    app.dependency_overrides.clear()


def make_user(session, username="alice", email="alice@example.com", password="secret"):
    user = User(
        username=username,
        email=email,
        first_name="Alice",
        last_name="Smith",
        device_address="aa:bb:cc:dd:ee:ff",
        password_hash=generate_hashed_password(password).decode("utf-8"),
    )
    session.add(user)
    session.commit()
    session.refresh(user)
    return user


def auth_headers(username="alice"):
    token = create_access_token({"sub": username})
    return {"Authorization": f"Bearer {token}"}


# ── /users/auth ───────────────────────────────────────────────────────────────

def test_auth_returns_token(client, session):
    make_user(session)
    resp = client.post("/users/auth", json={"username": "alice", "password": "secret"})
    assert resp.status_code == 200
    body = resp.json()
    assert "token" in body
    assert body["token_type"] == "bearer"


def test_auth_wrong_password(client, session):
    make_user(session)
    resp = client.post("/users/auth", json={"username": "alice", "password": "wrong"})
    assert resp.status_code == 401


def test_auth_unknown_user(client, session):
    resp = client.post("/users/auth", json={"username": "ghost", "password": "x"})
    assert resp.status_code == 401


# ── GET /users/ ───────────────────────────────────────────────────────────────

def test_get_all_users_returns_list(client, session):
    make_user(session, username="alice", email="alice@example.com")
    make_user(session, username="bob", email="bob@example.com")
    resp = client.get("/users/", headers=auth_headers())
    assert resp.status_code == 200
    data = resp.json()
    assert len(data) == 2
    usernames = {u["username"] for u in data}
    assert usernames == {"alice", "bob"}


def test_get_all_users_no_password_hash(client, session):
    make_user(session)
    resp = client.get("/users/", headers=auth_headers())
    assert resp.status_code == 200
    for user in resp.json():
        assert "password_hash" not in user


def test_get_all_users_requires_auth(client):
    resp = client.get("/users/")
    assert resp.status_code == 403


def test_get_all_users_invalid_token(client):
    resp = client.get("/users/", headers={"Authorization": "Bearer bad.token.here"})
    assert resp.status_code == 401


def test_get_all_users_limit(client, session):
    for i in range(5):
        make_user(session, username=f"user{i}", email=f"user{i}@example.com")
    resp = client.get("/users/?limit=3", headers=auth_headers())
    assert resp.status_code == 200
    assert len(resp.json()) == 3


def test_get_all_users_offset(client, session):
    for i in range(5):
        make_user(session, username=f"user{i}", email=f"user{i}@example.com")
    resp = client.get("/users/?offset=3", headers=auth_headers())
    assert resp.status_code == 200
    assert len(resp.json()) == 2


# ── GET /users/{user_id} ──────────────────────────────────────────────────────

def test_get_user_by_id(client, session):
    user = make_user(session)
    resp = client.get(f"/users/{user.id}", headers=auth_headers())
    assert resp.status_code == 200
    assert resp.json()["username"] == "alice"


def test_get_user_by_id_not_found(client):
    resp = client.get("/users/9999", headers=auth_headers())
    assert resp.status_code == 404


def test_get_user_by_id_requires_auth(client, session):
    user = make_user(session)
    resp = client.get(f"/users/{user.id}")
    assert resp.status_code == 403


def test_get_user_no_password_hash(client, session):
    user = make_user(session)
    resp = client.get(f"/users/{user.id}", headers=auth_headers())
    assert "password_hash" not in resp.json()


# ── POST /users/register ──────────────────────────────────────────────────────

def test_register_new_user(client):
    resp = client.post(
        "/users/register",
        headers=auth_headers(),
        json={
            "username": "newuser",
            "password": "pw123",
            "first_name": "New",
            "last_name": "User",
            "email": "new@example.com",
        },
    )
    assert resp.status_code == 200
    assert resp.json()["username"] == "newuser"


def test_register_duplicate_username(client, session):
    make_user(session)
    resp = client.post(
        "/users/register",
        headers=auth_headers(),
        json={
            "username": "alice",
            "password": "pw",
            "first_name": "A",
            "last_name": "B",
            "email": "other@example.com",
        },
    )
    assert resp.status_code == 400


def test_register_duplicate_email(client, session):
    make_user(session)
    resp = client.post(
        "/users/register",
        headers=auth_headers(),
        json={
            "username": "other",
            "password": "pw",
            "first_name": "A",
            "last_name": "B",
            "email": "alice@example.com",
        },
    )
    assert resp.status_code == 400


def test_register_requires_auth(client):
    resp = client.post(
        "/users/register",
        json={
            "username": "u",
            "password": "p",
            "first_name": "F",
            "last_name": "L",
            "email": "u@example.com",
        },
    )
    assert resp.status_code == 403


# ── GET /messages/{message_id} ────────────────────────────────────────────────

@pytest.fixture(name="two_users")
def two_users_fixture(session):
    alice = make_user(session, username="alice", email="alice@example.com")
    bob = make_user(session, username="bob", email="bob@example.com")
    return alice, bob


def make_message(session, sender_id, recipient_id, **kwargs):
    msg = Message(
        sender_id=sender_id,
        recipient_id=recipient_id,
        subject=kwargs.get("subject", "Hello"),
        body=kwargs.get("body", "World"),
        sender_address="aa:bb:cc:dd:ee:ff",
    )
    session.add(msg)
    session.commit()
    session.refresh(msg)
    return msg


def test_get_message_by_id(client, session, two_users):
    alice, bob = two_users
    msg = make_message(session, alice.id, bob.id)
    resp = client.get(f"/messages/{msg.id}", headers=auth_headers())
    assert resp.status_code == 200
    assert resp.json()["subject"] == "Hello"


def test_get_message_by_id_not_found(client):
    resp = client.get("/messages/9999", headers=auth_headers())
    assert resp.status_code == 404


def test_get_message_by_id_requires_auth(client, session, two_users):
    alice, bob = two_users
    msg = make_message(session, alice.id, bob.id)
    resp = client.get(f"/messages/{msg.id}")
    assert resp.status_code == 403


# ── GET /messages/sender/{user_id} ────────────────────────────────────────────

def test_get_messages_by_sender(client, session, two_users):
    alice, bob = two_users
    make_message(session, alice.id, bob.id, subject="msg1")
    make_message(session, alice.id, bob.id, subject="msg2")
    resp = client.get(f"/messages/sender/{alice.id}", headers=auth_headers())
    assert resp.status_code == 200
    assert len(resp.json()) == 2
    assert all(m["sender_id"] == alice.id for m in resp.json())


def test_get_messages_by_sender_not_found(client):
    resp = client.get("/messages/sender/9999", headers=auth_headers())
    assert resp.status_code == 404


def test_get_messages_by_sender_requires_auth(client, session, two_users):
    alice, bob = two_users
    resp = client.get(f"/messages/sender/{alice.id}")
    assert resp.status_code == 403


# ── GET /messages/recipient/{user_id} ─────────────────────────────────────────

def test_get_messages_by_recipient(client, session, two_users):
    alice, bob = two_users
    make_message(session, alice.id, bob.id, subject="for bob")
    make_message(session, alice.id, alice.id, subject="for alice")
    resp = client.get(f"/messages/recipient/{bob.id}", headers=auth_headers())
    assert resp.status_code == 200
    data = resp.json()
    assert len(data) == 1
    assert data[0]["subject"] == "for bob"


def test_get_messages_by_recipient_not_found(client):
    resp = client.get("/messages/recipient/9999", headers=auth_headers())
    assert resp.status_code == 404


def test_get_messages_by_recipient_requires_auth(client, session, two_users):
    alice, bob = two_users
    resp = client.get(f"/messages/recipient/{bob.id}")
    assert resp.status_code == 403
