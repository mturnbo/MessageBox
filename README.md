# MessageBox

A full-stack messaging application with three interchangeable API backends, two frontend implementations, and a shared MySQL database.

## Repository Structure

```
MessageBox/
├── apps/
│   ├── api-go/            # Gin REST API (Go 1.21+)
│   ├── api-node/          # Express.js REST API (Node 22+)
│   ├── api-python/        # FastAPI REST API (Python 3.13+)
│   ├── frontend-angular/  # Angular 21 frontend
│   ├── frontend-react/    # React frontend
│   └── ecosystem.config.js  # PM2 process config
```

All three APIs implement the same endpoints against the same MySQL schema and are interchangeable as backends. All run on **port 3000** when started via PM2.

## Getting Started

### Database

All APIs require a MySQL database. Run the Node API's migrations to set up the schema:

```bash
cd apps/api-node
npm install
npm run db:migrate
```

Then configure each API via its `.env` file (see each API's README for the full variable list).

### Running with PM2

```bash
npm install -g pm2
cd apps
pm2 start ecosystem.config.js
```

### Running individually

See each app's README:

- [Go API](apps/api-go/README.md)
- [Node API](apps/api-node/README.md)
- [Python API](apps/api-python/README.md)

## API Overview

All three APIs expose identical endpoints:

| Group    | Base Path       | Description                               |
|----------|-----------------|-------------------------------------------|
| Auth     | `/v1/auth`      | Login, token refresh                      |
| Users    | `/v1/users`     | Create, read, update, delete users        |
| Messages | `/v1/messages`  | Send, receive, reply, thread, soft-delete |
| Health   | `/v1/health`    | Database connectivity check               |

Authentication uses JWT Bearer tokens. All routes except `POST /v1/auth` and `GET /v1/health` require an `Authorization: Bearer <token>` header.

## Database Schema

```
users            — user accounts
messages         — direct messages between users
threads          — conversation thread roots
thread_messages  — message-to-thread membership
```
