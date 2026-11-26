## 1. Project Domain & Tech Stack
* **Language & Framework**: Python 3.13+, FastAPI 0.115+ with `Annotated` dependency injection.
* **Validation & DB**: Pydantic v2 and SQLModel (fully async via `AsyncSession`).
* **Tooling**: Alembic for async migrations, HTTPX for HTTP requests, PyJWT for security, and Ruff for linting/formatting.

## 2. Project Structure
Organize code by file type (e.g., routers, schemas, and models).

## 3. Core Development Rules
* **Async Integrity**: Never block the event loop in `async def` functions; use async libraries like `httpx.AsyncClient` or `aiofiles` instead of blocking synchronous alternatives.
* **Pydantic**: Use `model_config = ConfigDict(...)` and `@field_serializer`, avoiding deprecated v1 syntax.

## 4. Testing Guidelines
Use `pytest` with `pytest-asyncio` and `httpx.AsyncClient` via `ASGITransport`. Run integration tests against isolated live databases rather than mocking database adapters, reserving `app.dependency_overrides` for external stubs or auth tokens.

## 5. Security Checklist
Handle exceptions globally to avoid leaking traces, use PyJWT, and never commit secrets while providing an `.env.example` file.
