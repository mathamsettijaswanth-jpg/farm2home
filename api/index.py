import sys
import os

# Ensure backend directory is in python module search path
backend_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "backend"))
if backend_path not in sys.path:
    sys.path.insert(0, backend_path)

# Mark as Vercel environment so database is created in /tmp
os.environ["VERCEL"] = "1"

from app.main import app  # noqa: E402
