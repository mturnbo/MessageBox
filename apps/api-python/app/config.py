import os
import sys

_REQUIRED = [
    ('MYSQL_USER',     'MySQL username'),
    ('MYSQL_PASSWORD', 'MySQL password'),
    ('MYSQL_DATABASE', 'MySQL database name'),
    ('JWT_SECRET',     'JWT signing secret'),
]


def validate_env():
    missing = [(var, desc) for var, desc in _REQUIRED if not os.getenv(var)]
    if missing:
        for var, desc in missing:
            print(f"[CONFIG] Missing required env var: {var} ({desc})", file=sys.stderr, flush=True)
        sys.exit(1)
