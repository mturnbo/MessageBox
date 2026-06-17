# MessageBox

A full-stack messaging application with two interchangeable API backends, two frontend implementations, and a shared MySQL database.

## Repository Structure

```
MessageBox/
├── apps/
│   ├── api-node/          # Express.js REST API (Node 22+)
│   ├── api-python/        # FastAPI REST API (Python 3.13+)
│   ├── frontend-angular/  # Angular 21 frontend
│   └── frontend-react/    # React frontend
└── ecosystem.config.cjs   # PM2 process config
```

Both APIs implement the same endpoints against the same MySQL schema and are interchangeable as backends. The Node API runs on **port 3000** by default; the Python API runs on **port 3000** in production (8000 in dev).

## Getting Started

### Database

Both APIs require a MySQL database. Configure the connection via environment variables (see each API's README for the full list).

### Running with PM2

```bash
npm install -g pm2
pm2 start ecosystem.config.cjs
```

### Running individually

See each app's README:

- [Node API](apps/api-node/README.md)
- [Python API](apps/api-python/README.md)

## API Overview

Both APIs expose identical endpoints:

| Group    | Base Path    | Description                              |
|----------|-------------|------------------------------------------|
| Auth     | `/v1/auth`     | Login, returns JWT token                 |
| Users    | `/v1/users`    | Create, read, update, delete users       |
| Messages | `/v1/messages` | Send, receive, reply, thread, soft-delete|
| Health   | `/v1/health`   | Database connectivity check              |

Authentication uses JWT Bearer tokens. All routes except `POST /v1/auth` and `GET /v1/health` require an `Authorization: Bearer <token>` header.

## Database Schema

```
users            — user accounts
messages         — direct messages between users
threads          — conversation thread roots
thread_messages  — message-to-thread membership
```
