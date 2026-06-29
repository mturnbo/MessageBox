import os
from slowapi import Limiter
from slowapi.util import get_remote_address

_max = os.getenv("AUTH_RATE_LIMIT_MAX", "10")
_window_ms = int(os.getenv("AUTH_RATE_LIMIT_WINDOW_MS", "900000"))
_window_minutes = max(1, _window_ms // 60000)
AUTH_RATE_LIMIT = f"{_max}/{_window_minutes} minutes"

_api_max = os.getenv("API_RATE_LIMIT_MAX", "60")
_api_window_ms = int(os.getenv("API_RATE_LIMIT_WINDOW_MS", "60000"))
_api_window_minutes = max(1, _api_window_ms // 60000)
API_RATE_LIMIT = f"{_api_max}/{_api_window_minutes} minute"

limiter = Limiter(key_func=get_remote_address)
