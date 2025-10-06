# Soberup Backend (FastAPI)

## Quickstart (Windows PowerShell)

```powershell
# From repo root
python -m venv .venv
.\.venv\Scripts\Activate.ps1

# Install dependencies
pip install --upgrade pip
pip install -r ./requirements.txt

# Run dev server (reload)
python -m uvicorn app.main:app --reload --port 8000
```

Interactive API docs at `http://127.0.0.1:8000/docs`.

## GraphQL
- Endpoint: `POST http://127.0.0.1:8000/api/v1/graphql`
- Built‑in GraphiQL IDE: open the same URL in a browser

## Forward port for mobile dev
adb reverse tcp:8000 tcp:8000

Example queries:

Fetch current goal:
```graphql
query GetUsageGoal {
  getUsageGoal {
    usageGoal
  }
}
```

Set a new goal:
```graphql
mutation SetUsageGoal {
  setUsageGoal(usageGoal: 7) {
    success
  }
}
```

## Notes
- CORS is permissive for development; restrict in production.
- Base API path: `/api/v1`.

