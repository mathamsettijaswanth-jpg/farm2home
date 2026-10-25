import sys
import os
import subprocess

# ---------------------------------------------------------------------------
# Runtime dependency bootstrap
# Vercel sometimes misses the api/requirements.txt during cold-start.
# We ensure critical packages are installed before importing our app.
# ---------------------------------------------------------------------------
_REQUIRED = [
    "httpx",
    "beautifulsoup4",
    "lxml",
    "passlib",
    "python-jose",
    "python-multipart",
    "bcrypt",
]

for _pkg in _REQUIRED:
    try:
        __import__(_pkg.replace("-", "_").split("[")[0])
    except ImportError:
        subprocess.run(
            [sys.executable, "-m", "pip", "install", _pkg, "-q"],
            check=True
        )

# ---------------------------------------------------------------------------
# Ensure backend directory is in python module search path
# ---------------------------------------------------------------------------
backend_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "backend"))
if backend_path not in sys.path:
    sys.path.insert(0, backend_path)

# Mark as Vercel environment so database is created in /tmp
os.environ["VERCEL"] = "1"

from app.main import app  # noqa: E402
