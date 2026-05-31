# Changelog

## [Unreleased] — branch `message-routes`

### Added

- **Message service** (`app/services/message_service.py`) — new service layer replicating the functionality of the Node API's `message.controller.js`:
  - `get_sent` — paginated sent messages, excludes soft-deleted
  - `get_inbox` — paginated inbox, excludes soft-deleted
  - `get_message_by_id` — single message lookup
  - `get_thread_by_message_id` — full thread with all messages and reply indices
  - `create_message` — create with automatic and explicit idempotency (30-second window, SHA-256 hash)
  - `reply_to_message` — reply with automatic thread creation and idempotency
  - `read_message` — mark message as read with timestamp and reader address
  - `delete_message` — per-party soft delete (sender or recipient)

- **Thread and ThreadMessage models** (`app/models/dbmodels.py`) — `threads` and `thread_messages` tables matching the Node API schema

- **Message request schemas** (`app/models/dbmodels.py`) — `CreateMessageRequest`, `ReplyToMessageRequest`, `ReadMessageRequest`, `DeleteMessageRequest`

- **New endpoints** (`app/routers/messages.py`):
  - `GET /messages/inbox?recipient_id=X` — paginated inbox
  - `GET /messages/sent?sender_id=X` — paginated sent messages
  - `GET /messages/{id}/thread` — conversation thread
  - `POST /messages/post` — create message (201; 200 on idempotency replay)
  - `POST /messages/reply` — reply to message (201; 200 on replay)
  - `POST /messages/read` — mark as read
  - `POST /messages/delete` — soft delete

### Changed

- **Message router** (`app/routers/messages.py`) — routes renamed to match Node API naming conventions:
  - `GET /messages/sender/{user_id}` → `GET /messages/sent?sender_id=X`
  - `GET /messages/recipient/{user_id}` → `GET /messages/inbox?recipient_id=X`
  - `GET /messages/{message_id}` → `GET /messages/{id}`
  - Business logic extracted to `message_service`; router is now a thin HTTP layer

- **Message model** (`app/models/dbmodels.py`):
  - `is_deleted_by_sender: bool` → `deleted_by_sender: datetime | None` (soft delete now stores deletion timestamp, matching Node)
  - `is_deleted_by_recipient: bool` → `deleted_by_recipient: datetime | None`
  - `subject`, `body`, `sender_address` are now optional (`str | None`) to match Node
  - Added `client_message_id: str | None` (unique) for idempotency support

- **Auth router** (`app/routers/auth.py`) — fixed pre-existing bug where unknown username caused `AttributeError` and `HTTPException` was returned instead of raised

### Tests

- Updated existing message tests to use renamed routes and new paginated response format (`{ messages, total, page, limit }`)
- Added 30 new tests covering all new endpoints: create, reply, thread, read, delete, idempotency, soft-delete exclusion, and auth guards
- Fixed auth tests to use correct endpoint `POST /auth/` (previously tested non-existent `POST /users/auth`)
- Updated `test_dbmodels.py` soft-delete tests to reflect `datetime | None` model change

### Notes

> **Database migration required for production.** The `messages` table schema has changed: `is_deleted_by_sender`/`is_deleted_by_recipient` columns (boolean) must be replaced by `deleted_by_sender`/`deleted_by_recipient` (datetime, nullable), and `client_message_id` (varchar, unique, nullable) and `thread_id` columns must be added. New `threads` and `thread_messages` tables must also be created.
