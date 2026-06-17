# MessageBox API — Python (FastAPI)

FastAPI REST API for MessageBox. Uses SQLModel + SQLAlchemy with MySQL and JWT authentication.

## Requirements

- Python >= 3.13
- MySQL
- [uv](https://docs.astral.sh/uv/) for package management

## Setup

```bash
uv sync
cp .env.example .env   # then fill in your values
```

## Running

```bash
uv run uvicorn app.main:app --reload   # development (hot reload, port 8000)
uv run messagebox-api                  # production (port from PORT env var)
```

Development server: `http://127.0.0.1:8000`  
Interactive API docs: `http://127.0.0.1:8000/docs`

## Testing

```bash
uv run pytest
uv run pytest -v           # verbose output
uv run pytest tests/ -v    # specific directory
```

## Environment Variables

| Variable               | Description                                        |
|------------------------|----------------------------------------------------|
| `MYSQL_HOST`           | Database host                                      |
| `MYSQL_PORT`           | Database port (default `3306`)                     |
| `MYSQL_USER`           | Database user                                      |
| `MYSQL_PASSWORD`       | Database password                                  |
| `MYSQL_DATABASE`       | Database name                                      |
| `MYSQL_CONNECT_TIMEOUT`| Connection timeout in ms (default `6000`)          |
| `JWT_SECRET`           | Secret for signing JWT tokens                      |
| `JWT_EXPIRATION_TIME`  | Token lifetime in seconds (default `86400`)        |
| `PORT`                 | Port to listen on in production (default `3000`)   |
| `ORIGIN`               | Allowed CORS origin port (default `4000`)          |

## Authentication

All routes except `POST /auth` and `GET /health` require a JWT Bearer token:

```
Authorization: Bearer <token>
```

Obtain a token via `POST /auth`. The token payload contains `{ "sub": username }`.

---

## Endpoints

### Auth

#### `POST /auth`

Login. Accepts username **or** email address in the `username` field.

**Request body:**
```json
{ "username": "alice", "password": "secret" }
```

**Response `200`:**
```json
{ "username": "alice", "token": "<jwt>", "token_type": "bearer" }
```

---

### Users

All user endpoints require authentication.

#### `GET /users/`

Get all users.

| Query param | Default | Description                      |
|-------------|---------|----------------------------------|
| `offset`    | `0`     | Number of records to skip        |
| `limit`     | `100`   | Max results (hard cap: 100)      |

**Response `200`:** array of [user objects](#user-object)

#### `GET /users/{limit}/{page}`

Get users with page-based pagination.

| Path param | Description              |
|------------|--------------------------|
| `limit`    | Results per page         |
| `page`     | Page number (1-indexed)  |

**Response `200`:** array of user objects

#### `GET /users/{user_id}`

Get a single user by numeric ID, username, or email address.

**Response `200`:** user object  
**Response `404`:** user not found

#### `POST /users/register`

Create a new user.

**Request body (camelCase):**
```json
{
  "username": "alice",
  "email": "alice@example.com",
  "password": "secret",
  "firstName": "Alice",
  "lastName": "Smith",
  "deviceAddress": "192.168.1.10"
}
```

`deviceAddress` is optional.

**Response `201`:** user object

#### `POST /users/update`

Update one or more fields on an existing user.

**Request body:**
```json
{
  "id": 1,
  "userUpdate": {
    "email": "newemail@example.com",
    "firstName": "Alicia"
  }
}
```

`userUpdate` may contain any subset of: `username`, `email`, `password`, `firstName`, `lastName`, `deviceAddress`.

**Response `200`:** user object

#### `DELETE /users/delete/{id}`

Delete a user by numeric ID.

**Response `200`:** deleted user object

---

### Messages

All message endpoints require authentication.

#### `GET /messages/inbox`

Get messages received by a user. Excludes soft-deleted messages.

| Query param   | Required | Default | Description             |
|---------------|----------|---------|-------------------------|
| `recipientId` | yes      | —       | Numeric user ID         |
| `limit`       | no       | `10`    | Results per page        |
| `page`        | no       | `1`     | Page number (1-indexed) |

**Response `200`:** [message list](#message-list-response)

#### `GET /messages/sent`

Get messages sent by a user. Excludes soft-deleted messages.

| Query param | Required | Default | Description             |
|-------------|----------|---------|-------------------------|
| `senderId`  | yes      | —       | Numeric user ID         |
| `limit`     | no       | `10`    | Results per page        |
| `page`      | no       | `1`     | Page number (1-indexed) |

**Response `200`:** [message list](#message-list-response)

#### `GET /messages/{id}`

Get a single message by ID.

**Response `200`:** message object  
**Response `404`:** message not found

#### `GET /messages/{id}/thread`

Get the conversation thread for a message.

**Response `200`:**
```json
{
  "thread": { "id": 3, "originMsg": 1, "createdAt": "..." },
  "messages": [ { ...message, "replyTo": null }, { ...message, "replyTo": 1 } ]
}
```

If the message has no thread, `thread` is `null` and `messages` contains only the original message.

#### `POST /messages/post`

Create a new message. Supports idempotency via `clientMessageId` in the body or the `Idempotency-Key` request header.

**Request body (camelCase):**
```json
{
  "senderId": 1,
  "recipientId": 2,
  "subject": "Hello",
  "body": "Message content",
  "senderAddress": "192.168.1.10",
  "clientMessageId": "unique-client-key"
}
```

`subject`, `body`, `senderAddress`, and `clientMessageId` are optional.

**Response `201`:** [message post response](#message-post-response)  
**Response `200`:** same message returned when request is an idempotency replay (`idempotencyReplayed: true`)  
**Response `409`:** same `clientMessageId` used with a different payload

#### `POST /messages/reply`

Reply to an existing message. Creates or joins a thread.

**Request body (camelCase):**
```json
{
  "replyToId": 1,
  "senderId": 2,
  "recipientId": 1,
  "subject": "Re: Hello",
  "body": "Reply content",
  "senderAddress": "192.168.1.11",
  "clientMessageId": "unique-client-key"
}
```

**Response `201`:** [message post response](#message-post-response) with `threadId` populated

#### `POST /messages/read`

Mark a message as read.

**Request body:**
```json
{ "id": 5, "readerAddress": "192.168.1.10" }
```

`readerAddress` is optional.

**Response `200`:** `{ "status": "Message read successfully" }`

#### `POST /messages/delete`

Soft-delete a message for one party. The message is hidden from that user's inbox/sent but is not removed from the database.

**Request body:**
```json
{ "id": 5, "deletedBy": 2 }
```

**Response `200`:** `{ "status": "Message deleted successfully by [sender|recipient]" }`

---

### Health

#### `GET /health`

Check API and database status. No authentication required.

**Response `200`:**
```json
{ "status": "ok" }
```

**Response `503`:** database unreachable

---

## Response Schemas

### User Object

```json
{
  "id": 1,
  "username": "alice",
  "email": "alice@example.com",
  "firstName": "Alice",
  "lastName": "Smith",
  "deviceAddress": "192.168.1.10",
  "dateCreated": "2025-01-01T12:00:00",
  "lastLogin": "2025-06-01T09:30:00"
}
```

### Message Object

```json
{
  "id": 5,
  "senderId": 1,
  "recipientId": 2,
  "subject": "Hello",
  "body": "Message content",
  "sentAt": "2025-06-01T10:00:00",
  "senderAddress": "192.168.1.10",
  "clientMessageId": "unique-client-key",
  "readAt": null,
  "readerAddress": null,
  "deletedBySender": null,
  "deletedByRecipient": null
}
```

### Message List Response

```json
{
  "messages": [ ...message objects ],
  "total": 42,
  "page": 1,
  "limit": 10
}
```

### Message Post Response

Extends the message object with thread metadata:

```json
{
  ...message,
  "threadId": 3,
  "replyTo": null,
  "idempotencyReplayed": false
}
```
