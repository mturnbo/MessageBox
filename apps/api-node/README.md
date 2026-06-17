# MessageBox API — Node (Express)

Express 5 REST API for MessageBox. Uses Sequelize 6 with MySQL and JWT authentication.

## Requirements

- Node.js >= 22
- MySQL (or MariaDB / PostgreSQL / SQLite — see [Database](#database))

## Setup

```bash
npm install
cp .env.sample .env   # then fill in your values
npm run db:migrate
```

## Running

```bash
npm run dev    # development (nodemon, hot reload)
npm start      # production
```

Server starts at `http://localhost:3000`.

## Testing

```bash
npm test                # run all tests
npm run test:watch      # watch mode
npm run test:coverage   # with coverage report
```

## Environment Variables

| Variable              | Default   | Description                          |
|-----------------------|-----------|--------------------------------------|
| `SERVER_PORT`         | `3000`    | Port to listen on                    |
| `DB_TYPE`             | `mysql`   | Sequelize dialect                    |
| `DB_HOST`             | —         | Database host                        |
| `DB_USER`             | —         | Database user                        |
| `DB_PASSWORD`         | —         | Database password                    |
| `DB_DATABASE`         | —         | Database name                        |
| `DB_CONNECT_TIMEOUT`  | `6000`    | Connection timeout (ms)              |
| `JWT_SECRET`          | —         | Secret for signing JWT tokens        |
| `JWT_EXPIRATION_TIME` | —         | Token lifetime (e.g. `1h`, `86400`)  |

## Authentication

All routes except `POST /v1/auth` and `GET /v1/health` require a JWT Bearer token:

```
Authorization: Bearer <token>
```

Obtain a token via `POST /v1/auth`. The token payload contains `{ username }`.

---

## Endpoints

### Auth

#### `POST /v1/auth`

Login. Accepts username **or** email address.

**Request body:**
```json
{ "username": "alice", "password": "secret" }
```

**Response `200`:**
```json
{ "username": "alice", "token": "<jwt>" }
```

---

### Users

#### `GET /v1/users/`

Get all users. Default pagination: offset 0, limit 10.

**Response `200`:** array of user objects (see [User Object](#user-object))

#### `GET /v1/users/:limit/:page`

Get users with explicit pagination.

| Param   | Type | Description              |
|---------|------|--------------------------|
| `limit` | int  | Results per page         |
| `page`  | int  | Page number (1-indexed)  |

**Response `200`:** array of user objects

#### `GET /v1/users/:id`

Get a single user by numeric ID, username, or email address.

**Response `200`:** user object  
**Response `404`:** user not found

#### `POST /v1/users/register`

Create a new user.

**Request body:**
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

**Response `201`:** user object

#### `POST /v1/users/update/`

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

**Response `200`:** `{ "status": "User updated", "user": { ...userObject } }`

#### `DELETE /v1/users/delete/:id`

Delete a user by numeric ID.

**Response `200`:** deleted user object

---

### Messages

#### `GET /v1/messages/inbox`

Get messages received by a user.

| Query param   | Required | Default | Description             |
|---------------|----------|---------|-------------------------|
| `recipientId` | yes      | —       | Numeric user ID         |
| `limit`       | no       | `10`    | Results per page        |
| `page`        | no       | `1`     | Page number (1-indexed) |

**Response `200`:** [Message list](#message-list-response)

#### `GET /v1/messages/sent`

Get messages sent by a user.

| Query param | Required | Default | Description             |
|-------------|----------|---------|-------------------------|
| `senderId`  | yes      | —       | Numeric user ID         |
| `limit`     | no       | `10`    | Results per page        |
| `page`      | no       | `1`     | Page number (1-indexed) |

**Response `200`:** [Message list](#message-list-response)

#### `GET /v1/messages/:id`

Get a single message by ID.

**Response `200`:** message object  
**Response `404`:** message not found

#### `GET /v1/messages/:id/thread`

Get the conversation thread for a message.

**Response `200`:**
```json
{
  "thread": { "id": 3, "originMsg": 1, "createdAt": "..." },
  "messages": [ { ...message, "replyTo": null }, { ...message, "replyTo": 1 } ]
}
```

If the message has no thread, `thread` is `null` and `messages` contains only the original message.

#### `POST /v1/messages/post`

Create a new message. Supports idempotency via `clientMessageId` or the `Idempotency-Key` request header.

**Request body:**
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

**Response `201`:** [Message post response](#message-post-response)  
**Response `200`:** same message returned when request is an idempotency replay  
**Response `409`:** same `clientMessageId` used with different payload

#### `POST /v1/messages/reply`

Reply to an existing message. Creates or joins a thread.

**Request body:**
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

**Response `201`:** [Message post response](#message-post-response) with `threadId` populated

#### `POST /v1/messages/read`

Mark a message as read.

**Request body:**
```json
{ "id": 5, "readerAddress": "192.168.1.10" }
```

`readerAddress` is optional.

**Response `200`:** `{ "status": "Message read successfully" }`

#### `POST /v1/messages/delete`

Soft-delete a message for one party. The message is hidden from that user's inbox/sent but is not removed from the database.

**Request body:**
```json
{ "id": 5, "deletedBy": 2 }
```

**Response `200`:** `{ "status": "Message deleted successfully by [sender|recipient]" }`

---

### Health

#### `GET /v1/health`

Check API and database status. No authentication required.

**Response `200`:**
```json
{
  "status": "UP",
  "database": "Connected",
  "pool": { "size": 5, "available": 4, "waiting": 0 }
}
```

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
  "dateCreated": "2025-01-01T12:00:00.000Z",
  "lastLogin": "2025-06-01T09:30:00.000Z"
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
  "sentAt": "2025-06-01T10:00:00.000Z",
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

---

## Database

The default dialect is `mysql`. To switch databases, set `DB_TYPE` to the appropriate Sequelize dialect and install the required package:

| Database   | `DB_TYPE`  | Package                    |
|------------|------------|----------------------------|
| MySQL      | `mysql`    | `npm install mysql2`       |
| MariaDB    | `mariadb`  | `npm install mariadb`      |
| PostgreSQL | `postgres` | `npm install pg pg-hstore` |
| SQLite     | `sqlite`   | `npm install sqlite3`      |
| SQL Server | `mssql`    | `npm install tedious`      |
