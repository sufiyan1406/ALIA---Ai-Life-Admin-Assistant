"""Minimal backend verification for local development.

Run with:
    .\\venv\\Scripts\\python.exe scratch\\verify_backend.py
"""

import os
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))

os.environ.setdefault("SUPABASE_URL", "https://example.supabase.co")
dummy_service_key = (
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9."
    "eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV4YW1wbGUiLCJyb2xlIjoic2VydmljZV9yb2xlIiwiaWF0IjoxNzAwMDAwMDAwLCJleHAiOjQwMDAwMDAwMDB9."
    "placeholder-signature"
)

os.environ.setdefault("SUPABASE_SERVICE_ROLE_KEY", dummy_service_key)
os.environ.setdefault("SUPABASE_JWT_SECRET", "placeholder-jwt-secret")
os.environ.setdefault("NVIDIA_API_KEY", "placeholder-nvidia-key")
os.environ.setdefault("GROQ_API_KEY", "placeholder-groq-key")
os.environ.setdefault("ALLOWED_ORIGINS", "http://localhost:3000")

from fastapi.testclient import TestClient

from app.main import app


def main() -> None:
    client = TestClient(app)
    root = client.get("/")
    health = client.get("/api/v1/health")

    assert root.status_code == 200, root.text
    assert health.status_code == 200, health.text
    assert root.json()["status"] == "ok"
    assert health.json()["status"] == "healthy"

    print("Backend import and health checks passed.")


if __name__ == "__main__":
    main()
