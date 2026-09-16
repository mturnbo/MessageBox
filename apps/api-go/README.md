# MessageBox API — Go (Gin)

Gin REST API for MessageBox. Uses GORM with MySQL and JWT authentication. Implements the same endpoints as the Node and Python APIs and is interchangeable as a backend.

## Requirements

- Go 1.21+
- MySQL 8+ (shared schema with the Node and Python APIs)
- CGO enabled (required by the SQLite test driver — the standard Go toolchain includes this by default)

## Setup

```bash
cp .env.sample .env   # then fill in your values
```

Edit `.env` and set at minimum: `MYSQL_USER`, `MYSQL_PASSWORD`, `MYSQL_DATABASE`, `JWT_SECRET`, and `JWT_EXPIRATION_TIME`.

No migration step is needed — the schema is owned by the Node API's Sequelize migrations (`apps/api-node`).

## Running

```bash
# Development
go run ./cmd/server

# Build and run the release binary
go build -o bin/messagebox-api-go ./cmd/server
./bin/messagebox-api-go
```

Server starts at `http://localhost:3001` by default (overridden to `3000` when started via PM2).

## Testing

```bash
go test ./...          # run all tests
go test ./... -v       # verbose output
go test ./... -run Foo # run tests matching pattern
```

Tests use an in-memory SQLite database — no MySQL connection required.

## Environment Variables

| Variable                      | Default    | Description                                      |
|-------------------------------|------------|--------------------------------------------------|
| `SERVER_PORT`                 | `3001`     | Port to listen on                                |
| `MYSQL_HOST`                  | `localhost` | Database host                                   |
| `MYSQL_PORT`                  | `3306`     | Database port                                    |
| `MYSQL_USER`                  | —          | Database user (required)                         |
| `MYSQL_PASSWORD`              | —          | Database password (required)                     |
| `MYSQL_DATABASE`              | —          | Database name (required)                         |
| `JWT_SECRET`                  | —          | Secret for signing JWT tokens (required)         |
| `JWT_EXPIRATION_TIME`         | —          | Access token lifetime, e.g. `1h` (required)      |
| `JWT_REFRESH_EXPIRATION_TIME` | `168h`     | Refresh token lifetime, e.g. `168h`              |
| `ORIGIN`                      | —          | Allowed CORS origin port, e.g. `4000`            |

## Authentication

All routes except `POST /v1/auth` and `GET /v1/health` require a JWT Bearer token:

```
Authorization: Bearer <token>
```

Obtain a token via `POST /v1/auth`. Access tokens carry `{ "sub": "<username>" }`. Refresh tokens add `"type": "refresh"` and must only be used with `POST /v1/auth/refresh`.

## Endpoints

| Method | Path                       | Description                                     |
|--------|----------------------------|-------------------------------------------------|
| POST   | `/v1/auth`                 | Login — returns access + refresh token          |
| POST   | `/v1/auth/refresh`         | Exchange refresh token for new access token     |
| GET    | `/v1/health`               | Database connectivity check                     |
| GET    | `/v1/users`                | List users (paginated)                          |
| GET    | `/v1/users/:id`            | Get user by ID, username, or email              |
| POST   | `/v1/users/register`       | Create user                                     |
| POST   | `/v1/users/update`         | Update user fields                              |
| DELETE | `/v1/users/delete/:id`     | Delete user                                     |
| GET    | `/v1/messages/inbox`       | Get received messages                           |
| GET    | `/v1/messages/sent`        | Get sent messages                               |
| GET    | `/v1/messages/:id`         | Get message by ID                               |
| GET    | `/v1/messages/:id/thread`  | Get conversation thread                         |
| POST   | `/v1/messages/post`        | Send message (idempotent)                       |
| POST   | `/v1/messages/reply`       | Reply to message                                |
| POST   | `/v1/messages/read`        | Mark message as read                            |
| POST   | `/v1/messages/delete`      | Soft-delete message                             |

For full request/response schemas see the [Node API README](../api-node/README.md) — the APIs are identical.
