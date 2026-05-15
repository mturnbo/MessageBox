# messagebox-api

FastAPI backend for MessageBox.

## Setup

```
uv sync
```

## Running

**Development** (hot reload):
```
uv run uvicorn app.main:app --reload
```

**Production**:
```
uv run messagebox-api
```

Server starts at http://127.0.0.1:8000. API docs at http://127.0.0.1:8000/docs.

## Testing

```
uv run pytest
```
