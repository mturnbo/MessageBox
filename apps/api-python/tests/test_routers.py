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
    resp = client.post("/auth", json={"username": "alice", "password": "secret"})
    assert resp.status_code == 200
    body = resp.json()
    assert body["username"] == "alice"
    assert "token" in body
    assert body["token_type"] == "bearer"


def test_auth_wrong_password(client, session):
    make_user(session)
    resp = client.post("/auth", json={"username": "alice", "password": "wrong"})
    assert resp.status_code == 401


def test_auth_unknown_user(client, session):
    resp = client.post("/auth", json={"username": "ghost", "password": "x"})
    assert resp.status_code == 401


def test_auth_with_email(client, session):
    make_user(session, email="alice@example.com")
    resp = client.post("/auth", json={"username": "alice@example.com", "password": "secret"})
    assert resp.status_code == 200
    body = resp.json()
    assert body["username"] == "alice"
    assert "token" in body


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


def test_get_user_by_username(client, session):
    make_user(session)
    resp = client.get("/users/alice", headers=auth_headers())
    assert resp.status_code == 200
    assert resp.json()["username"] == "alice"


def test_get_user_by_email(client, session):
    make_user(session, email="alice@example.com")
    resp = client.get("/users/alice@example.com", headers=auth_headers())
    assert resp.status_code == 200
    assert resp.json()["username"] == "alice"


def test_get_user_returns_camel_case(client, session):
    make_user(session)
    resp = client.get("/users/alice", headers=auth_headers())
    body = resp.json()
    assert "firstName" in body
    assert "lastName" in body
    assert "deviceAddress" in body


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
    assert resp.status_code == 201
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


# ── GET /users/{limit}/{page} ─────────────────────────────────────────────────

def test_get_all_users_path_pagination_page1(client, session):
    for i in range(5):
        make_user(session, username=f"user{i}", email=f"user{i}@example.com")
    resp = client.get("/users/3/1", headers=auth_headers())
    assert resp.status_code == 200
    assert len(resp.json()) == 3


def test_get_all_users_path_pagination_page2(client, session):
    for i in range(5):
        make_user(session, username=f"user{i}", email=f"user{i}@example.com")
    resp = client.get("/users/3/2", headers=auth_headers())
    assert resp.status_code == 200
    assert len(resp.json()) == 2


def test_get_all_users_path_pagination_requires_auth(client, session):
    make_user(session)
    resp = client.get("/users/10/1")
    assert resp.status_code == 403


# ── POST /users/update ────────────────────────────────────────────────────────

def test_update_user(client, session):
    user = make_user(session)
    resp = client.post(
        "/users/update",
        headers=auth_headers(),
        json={"id": user.id, "userUpdate": {"firstName": "Bob"}},
    )
    assert resp.status_code == 200
    assert resp.json()["firstName"] == "Bob"


def test_update_user_not_found(client):
    resp = client.post(
        "/users/update",
        headers=auth_headers(),
        json={"id": 9999, "userUpdate": {"firstName": "X"}},
    )
    assert resp.status_code == 404


def test_update_user_requires_auth(client, session):
    user = make_user(session)
    resp = client.post("/users/update", json={"id": user.id, "userUpdate": {}})
    assert resp.status_code == 403


# ── DELETE /users/delete/{id} ─────────────────────────────────────────────────

def test_delete_user(client, session):
    user = make_user(session)
    resp = client.delete(f"/users/delete/{user.id}", headers=auth_headers())
    assert resp.status_code == 200
    assert resp.json()["username"] == "alice"
    resp2 = client.get(f"/users/{user.id}", headers=auth_headers())
    assert resp2.status_code == 404


def test_delete_user_not_found(client):
    resp = client.delete("/users/delete/9999", headers=auth_headers())
    assert resp.status_code == 404


def test_delete_user_requires_auth(client, session):
    user = make_user(session)
    resp = client.delete(f"/users/delete/{user.id}")
    assert resp.status_code == 403


# ── GET /health ───────────────────────────────────────────────────────────────

def test_health(client):
    resp = client.get("/health")
    assert resp.status_code == 200
    assert resp.json()["status"] == "ok"


# ── GET /users — camelCase response shape ─────────────────────────────────────

def test_get_user_includes_date_fields(client, session):
    make_user(session)
    resp = client.get("/users/alice", headers=auth_headers())
    body = resp.json()
    assert "dateCreated" in body
    assert "lastLogin" in body


# ── Fixtures ──────────────────────────────────────────────────────────────────

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
        sender_address="1.2.3.4",
    )
    session.add(msg)
    session.commit()
    session.refresh(msg)
    return msg


# ── GET /messages/{id} ────────────────────────────────────────────────────────

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


# ── GET /messages/sent ────────────────────────────────────────────────────────

def test_get_sent_messages(client, session, two_users):
    alice, bob = two_users
    make_message(session, alice.id, bob.id, subject="msg1")
    make_message(session, alice.id, bob.id, subject="msg2")
    resp = client.get(f"/messages/sent?senderId={alice.id}", headers=auth_headers())
    assert resp.status_code == 200
    body = resp.json()
    assert body["total"] == 2
    assert len(body["messages"]) == 2
    assert all(m["senderId"] == alice.id for m in body["messages"])


def test_get_sent_messages_empty(client, session, two_users):
    resp = client.get("/messages/sent?senderId=9999", headers=auth_headers())
    assert resp.status_code == 200
    body = resp.json()
    assert body["messages"] == []
    assert body["total"] == 0


def test_get_sent_missing_sender_id(client):
    resp = client.get("/messages/sent", headers=auth_headers())
    assert resp.status_code == 422


def test_get_sent_requires_auth(client, session, two_users):
    alice, bob = two_users
    resp = client.get(f"/messages/sent?senderId={alice.id}")
    assert resp.status_code == 403


# ── GET /messages/inbox ───────────────────────────────────────────────────────

def test_get_inbox_messages(client, session, two_users):
    alice, bob = two_users
    make_message(session, alice.id, bob.id, subject="for bob")
    make_message(session, alice.id, alice.id, subject="for alice")
    resp = client.get(f"/messages/inbox?recipientId={bob.id}", headers=auth_headers())
    assert resp.status_code == 200
    body = resp.json()
    assert body["total"] == 1
    assert body["messages"][0]["subject"] == "for bob"


def test_get_inbox_messages_empty(client, session, two_users):
    resp = client.get("/messages/inbox?recipientId=9999", headers=auth_headers())
    assert resp.status_code == 200
    body = resp.json()
    assert body["messages"] == []
    assert body["total"] == 0


def test_get_inbox_missing_recipient_id(client):
    resp = client.get("/messages/inbox", headers=auth_headers())
    assert resp.status_code == 422


def test_get_inbox_requires_auth(client, session, two_users):
    alice, bob = two_users
    resp = client.get(f"/messages/inbox?recipientId={bob.id}")
    assert resp.status_code == 403


# ── POST /messages/post ───────────────────────────────────────────────────────

def test_create_message(client, session, two_users):
    alice, bob = two_users
    resp = client.post(
        "/messages/post",
        headers=auth_headers(),
        json={
            "sender_id": alice.id,
            "recipient_id": bob.id,
            "subject": "Hello",
            "body": "World",
            "sender_address": "1.2.3.4",
        },
    )
    assert resp.status_code == 201
    body = resp.json()
    assert body["subject"] == "Hello"
    assert body["idempotencyReplayed"] == False


def test_create_message_idempotency_replay(client, session, two_users):
    alice, bob = two_users
    payload = {
        "sender_id": alice.id,
        "recipient_id": bob.id,
        "subject": "Hi",
        "body": "Test",
        "sender_address": "1.2.3.4",
        "client_message_id": "explicit-key-123",
    }
    resp1 = client.post("/messages/post", headers=auth_headers(), json=payload)
    assert resp1.status_code == 201
    resp2 = client.post("/messages/post", headers=auth_headers(), json=payload)
    assert resp2.status_code == 200
    assert resp2.json()["idempotencyReplayed"] == True


def test_create_message_idempotency_conflict(client, session, two_users):
    alice, bob = two_users
    client.post(
        "/messages/post",
        headers=auth_headers(),
        json={
            "sender_id": alice.id,
            "recipient_id": bob.id,
            "subject": "First",
            "body": "Body",
            "sender_address": "1.2.3.4",
            "client_message_id": "conflict-key",
        },
    )
    resp = client.post(
        "/messages/post",
        headers=auth_headers(),
        json={
            "sender_id": alice.id,
            "recipient_id": bob.id,
            "subject": "Different subject",
            "body": "Body",
            "sender_address": "1.2.3.4",
            "client_message_id": "conflict-key",
        },
    )
    assert resp.status_code == 409


def test_create_message_requires_auth(client, session, two_users):
    alice, bob = two_users
    resp = client.post(
        "/messages/post",
        json={"sender_id": alice.id, "recipient_id": bob.id, "body": "hi"},
    )
    assert resp.status_code == 403


# ── POST /messages/reply ──────────────────────────────────────────────────────

def test_reply_to_message(client, session, two_users):
    alice, bob = two_users
    parent = make_message(session, alice.id, bob.id)
    resp = client.post(
        "/messages/reply",
        headers=auth_headers(),
        json={
            "reply_to_id": parent.id,
            "sender_id": bob.id,
            "recipient_id": alice.id,
            "subject": "Re: Hello",
            "body": "Reply body",
            "sender_address": "1.2.3.4",
        },
    )
    assert resp.status_code == 201
    body = resp.json()
    assert body["threadId"] is not None
    assert body["replyTo"] == parent.id
    assert body["idempotencyReplayed"] == False


def test_reply_to_nonexistent_message(client):
    resp = client.post(
        "/messages/reply",
        headers=auth_headers(),
        json={
            "reply_to_id": 9999,
            "sender_id": 1,
            "recipient_id": 2,
            "body": "reply",
        },
    )
    assert resp.status_code == 404


def test_reply_idempotency_replay(client, session, two_users):
    alice, bob = two_users
    parent = make_message(session, alice.id, bob.id)
    payload = {
        "reply_to_id": parent.id,
        "sender_id": bob.id,
        "recipient_id": alice.id,
        "body": "reply",
        "client_message_id": "reply-key-abc",
    }
    resp1 = client.post("/messages/reply", headers=auth_headers(), json=payload)
    assert resp1.status_code == 201
    resp2 = client.post("/messages/reply", headers=auth_headers(), json=payload)
    assert resp2.status_code == 200
    assert resp2.json()["idempotencyReplayed"] == True


def test_reply_requires_auth(client, session, two_users):
    alice, bob = two_users
    parent = make_message(session, alice.id, bob.id)
    resp = client.post(
        "/messages/reply",
        json={"reply_to_id": parent.id, "sender_id": bob.id, "recipient_id": alice.id},
    )
    assert resp.status_code == 403


# ── GET /messages/{id}/thread ─────────────────────────────────────────────────

def test_get_thread_by_message_id(client, session, two_users):
    alice, bob = two_users
    parent = make_message(session, alice.id, bob.id)
    client.post(
        "/messages/reply",
        headers=auth_headers(),
        json={
            "reply_to_id": parent.id,
            "sender_id": bob.id,
            "recipient_id": alice.id,
            "body": "reply",
        },
    )
    resp = client.get(f"/messages/{parent.id}/thread", headers=auth_headers())
    assert resp.status_code == 200
    body = resp.json()
    assert body["thread"] is not None
    assert body["thread"]["origin_msg"] == parent.id
    assert len(body["messages"]) == 2


def test_get_thread_no_thread(client, session, two_users):
    alice, bob = two_users
    msg = make_message(session, alice.id, bob.id)
    resp = client.get(f"/messages/{msg.id}/thread", headers=auth_headers())
    assert resp.status_code == 200
    body = resp.json()
    assert body["thread"] is None
    assert len(body["messages"]) == 1


def test_get_thread_not_found(client):
    resp = client.get("/messages/9999/thread", headers=auth_headers())
    assert resp.status_code == 404


def test_get_thread_requires_auth(client, session, two_users):
    alice, bob = two_users
    msg = make_message(session, alice.id, bob.id)
    resp = client.get(f"/messages/{msg.id}/thread")
    assert resp.status_code == 403


# ── POST /messages/read ───────────────────────────────────────────────────────

def test_read_message(client, session, two_users):
    alice, bob = two_users
    msg = make_message(session, alice.id, bob.id)
    resp = client.post(
        "/messages/read",
        headers=auth_headers(),
        json={"id": msg.id, "reader_address": "1.2.3.4"},
    )
    assert resp.status_code == 200
    assert resp.json()["status"] == "Message read successfully"


def test_read_message_not_found(client):
    resp = client.post(
        "/messages/read",
        headers=auth_headers(),
        json={"id": 9999, "reader_address": "1.2.3.4"},
    )
    assert resp.status_code == 404


def test_read_message_requires_auth(client, session, two_users):
    alice, bob = two_users
    msg = make_message(session, alice.id, bob.id)
    resp = client.post("/messages/read", json={"id": msg.id, "reader_address": "1.2.3.4"})
    assert resp.status_code == 403


# ── POST /messages/delete ─────────────────────────────────────────────────────

def test_delete_message_by_sender(client, session, two_users):
    alice, bob = two_users
    msg = make_message(session, alice.id, bob.id)
    resp = client.post(
        "/messages/delete",
        headers=auth_headers(),
        json={"id": msg.id, "deleted_by": alice.id},
    )
    assert resp.status_code == 200
    assert "sender" in resp.json()["status"]


def test_delete_message_by_recipient(client, session, two_users):
    alice, bob = two_users
    msg = make_message(session, alice.id, bob.id)
    resp = client.post(
        "/messages/delete",
        headers=auth_headers(),
        json={"id": msg.id, "deleted_by": bob.id},
    )
    assert resp.status_code == 200
    assert "recipient" in resp.json()["status"]


def test_delete_message_not_found(client):
    resp = client.post(
        "/messages/delete",
        headers=auth_headers(),
        json={"id": 9999, "deleted_by": 1},
    )
    assert resp.status_code == 404


def test_delete_message_requires_auth(client, session, two_users):
    alice, bob = two_users
    msg = make_message(session, alice.id, bob.id)
    resp = client.post("/messages/delete", json={"id": msg.id, "deleted_by": alice.id})
    assert resp.status_code == 403


# ── Soft delete exclusion ─────────────────────────────────────────────────────

def test_sent_excludes_soft_deleted(client, session, two_users):
    alice, bob = two_users
    msg = make_message(session, alice.id, bob.id)
    client.post(
        "/messages/delete",
        headers=auth_headers(),
        json={"id": msg.id, "deleted_by": alice.id},
    )
    resp = client.get(f"/messages/sent?senderId={alice.id}", headers=auth_headers())
    assert resp.status_code == 200
    assert resp.json()["messages"] == []
    assert resp.json()["total"] == 0


def test_inbox_excludes_soft_deleted(client, session, two_users):
    alice, bob = two_users
    msg = make_message(session, alice.id, bob.id)
    client.post(
        "/messages/delete",
        headers=auth_headers(),
        json={"id": msg.id, "deleted_by": bob.id},
    )
    resp = client.get(f"/messages/inbox?recipientId={bob.id}", headers=auth_headers())
    assert resp.status_code == 200
    assert resp.json()["messages"] == []
    assert resp.json()["total"] == 0


def test_soft_delete_is_per_party(client, session, two_users):
    alice, bob = two_users
    msg = make_message(session, alice.id, bob.id)
    client.post(
        "/messages/delete",
        headers=auth_headers(),
        json={"id": msg.id, "deleted_by": alice.id},
    )
    resp = client.get(f"/messages/inbox?recipientId={bob.id}", headers=auth_headers())
    assert resp.status_code == 200
    assert resp.json()["total"] == 1
