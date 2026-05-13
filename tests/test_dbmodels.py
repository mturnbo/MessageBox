from datetime import datetime, timezone
from sqlmodel import SQLModel, Session, create_engine, select
import pytest

from app.models.dbmodels import User, UserBase, UserPublic, Message


@pytest.fixture(name="session")
def session_fixture():
    engine = create_engine("sqlite:///:memory:")
    SQLModel.metadata.create_all(engine)
    with Session(engine) as session:
        yield session


def make_user(**kwargs):
    defaults = dict(
        username="alice",
        email="alice@example.com",
        first_name="Alice",
        last_name="Smith",
        device_address="aa:bb:cc:dd:ee:ff",
        password_hash="hashed",
    )
    defaults.update(kwargs)
    return User(**defaults)


# --- UserBase ---

def test_userbase_fields():
    ub = UserBase(
        username="bob",
        email="bob@example.com",
        first_name="Bob",
        last_name="Jones",
        device_address="11:22:33:44:55:66",
    )
    assert ub.username == "bob"
    assert ub.email == "bob@example.com"
    assert ub.first_name == "Bob"
    assert ub.last_name == "Jones"
    assert ub.device_address == "11:22:33:44:55:66"


def test_userbase_device_address_optional():
    ub = UserBase(
        username="bob",
        email="bob@example.com",
        first_name="Bob",
        last_name="Jones",
        device_address=None,
    )
    assert ub.device_address is None


# --- User ---

def test_user_create_and_retrieve(session):
    user = make_user()
    session.add(user)
    session.commit()
    session.refresh(user)

    result = session.get(User, user.id)
    assert result is not None
    assert result.username == "alice"
    assert result.email == "alice@example.com"
    assert result.password_hash == "hashed"


def test_user_id_assigned_on_commit(session):
    user = make_user()
    assert user.id is None
    session.add(user)
    session.commit()
    session.refresh(user)
    assert user.id is not None


def test_user_created_at_defaults(session):
    user = make_user()
    session.add(user)
    session.commit()
    session.refresh(user)
    assert isinstance(user.created_at, datetime)


def test_user_last_seen_defaults(session):
    user = make_user()
    session.add(user)
    session.commit()
    session.refresh(user)
    assert isinstance(user.last_seen, datetime)


def test_user_device_address_nullable(session):
    user = make_user(device_address=None)
    session.add(user)
    session.commit()
    session.refresh(user)
    assert user.device_address is None


def test_user_multiple_rows(session):
    session.add(make_user(username="alice", email="alice@example.com"))
    session.add(make_user(username="bob", email="bob@example.com"))
    session.commit()

    results = session.exec(select(User)).all()
    assert len(results) == 2
    usernames = {u.username for u in results}
    assert usernames == {"alice", "bob"}


# --- UserPublic ---

def test_userpublic_excludes_password_hash(session):
    user = make_user()
    session.add(user)
    session.commit()
    session.refresh(user)

    public = UserPublic.model_validate(user)
    assert public.id == user.id
    assert public.username == user.username
    assert not hasattr(public, "password_hash")


# --- Message ---

def make_message(sender_id, recipient_id, **kwargs):
    defaults = dict(
        sender_id=sender_id,
        recipient_id=recipient_id,
        subject="Hello",
        body="World",
        sender_address="aa:bb:cc:dd:ee:ff",
    )
    defaults.update(kwargs)
    return Message(**defaults)


@pytest.fixture(name="two_users")
def two_users_fixture(session):
    alice = make_user(username="alice", email="alice@example.com")
    bob = make_user(username="bob", email="bob@example.com")
    session.add(alice)
    session.add(bob)
    session.commit()
    session.refresh(alice)
    session.refresh(bob)
    return alice, bob


def test_message_create_and_retrieve(session, two_users):
    alice, bob = two_users
    msg = make_message(sender_id=alice.id, recipient_id=bob.id)
    session.add(msg)
    session.commit()
    session.refresh(msg)

    result = session.get(Message, msg.id)
    assert result is not None
    assert result.subject == "Hello"
    assert result.body == "World"
    assert result.sender_id == alice.id
    assert result.recipient_id == bob.id


def test_message_sent_at_defaults(session, two_users):
    alice, bob = two_users
    msg = make_message(sender_id=alice.id, recipient_id=bob.id)
    session.add(msg)
    session.commit()
    session.refresh(msg)
    assert isinstance(msg.sent_at, datetime)


def test_message_soft_delete_flags_default_false(session, two_users):
    alice, bob = two_users
    msg = make_message(sender_id=alice.id, recipient_id=bob.id)
    session.add(msg)
    session.commit()
    session.refresh(msg)
    assert msg.is_deleted_by_sender is False
    assert msg.is_deleted_by_recipient is False


def test_message_optional_fields_default_none(session, two_users):
    alice, bob = two_users
    msg = make_message(sender_id=alice.id, recipient_id=bob.id)
    session.add(msg)
    session.commit()
    session.refresh(msg)
    assert msg.read_at is None
    assert msg.reader_address is None


def test_message_read_fields_settable(session, two_users):
    alice, bob = two_users
    now = datetime.now(timezone.utc)
    msg = make_message(
        sender_id=alice.id,
        recipient_id=bob.id,
        read_at=now,
        reader_address="11:22:33:44:55:66",
    )
    session.add(msg)
    session.commit()
    session.refresh(msg)
    assert msg.read_at is not None
    assert msg.reader_address == "11:22:33:44:55:66"


def test_message_soft_delete_flags_settable(session, two_users):
    alice, bob = two_users
    msg = make_message(
        sender_id=alice.id,
        recipient_id=bob.id,
        is_deleted_by_sender=True,
        is_deleted_by_recipient=True,
    )
    session.add(msg)
    session.commit()
    session.refresh(msg)
    assert msg.is_deleted_by_sender is True
    assert msg.is_deleted_by_recipient is True


def test_message_filter_by_sender(session, two_users):
    alice, bob = two_users
    session.add(make_message(sender_id=alice.id, recipient_id=bob.id, subject="msg1"))
    session.add(make_message(sender_id=alice.id, recipient_id=bob.id, subject="msg2"))
    session.add(make_message(sender_id=bob.id, recipient_id=alice.id, subject="msg3"))
    session.commit()

    results = session.exec(select(Message).where(Message.sender_id == alice.id)).all()
    assert len(results) == 2
    assert all(m.sender_id == alice.id for m in results)


def test_message_filter_by_recipient(session, two_users):
    alice, bob = two_users
    session.add(make_message(sender_id=alice.id, recipient_id=bob.id, subject="msg1"))
    session.add(make_message(sender_id=bob.id, recipient_id=alice.id, subject="msg2"))
    session.commit()

    results = session.exec(select(Message).where(Message.recipient_id == bob.id)).all()
    assert len(results) == 1
    assert results[0].subject == "msg1"
