# Soberup Backend (FastAPI)

## Quickstart (Windows PowerShell)

```powershell
# From repo root
python -m venv .venv
.\.venv\Scripts\Activate.ps1

# Install dependencies
pip install --upgrade pip
pip install -r backend\requirements.txt

# Run dev server (reload)
python -m uvicorn backend.app.main:app --reload --port 8000
```

Open `http://127.0.0.1:8000/api/v1/hello` to see:

```json
{"message": "Hello World"}
```

Interactive API docs at `http://127.0.0.1:8000/docs`.

## Notes
- CORS is permissive for development; restrict in production.
- Base API path: `/api/v1`.

