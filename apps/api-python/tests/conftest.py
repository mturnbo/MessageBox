import sys
import os

sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

# Provide dummy values so validate_env() passes during test collection.
# load_dotenv() does not override values already in os.environ, so these
# are only used when a real .env is absent (CI / fresh checkout).
os.environ.setdefault('MYSQL_USER', 'test')
os.environ.setdefault('MYSQL_PASSWORD', 'test')
os.environ.setdefault('MYSQL_DATABASE', 'test')
os.environ.setdefault('JWT_SECRET', 'test-secret-for-tests')
