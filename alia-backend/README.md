# ALIA Backend - FastAPI

FastAPI backend for ALIA. It verifies Supabase auth tokens, manages profiles, tasks, source files, reminders, deterministic briefings, gamification, and synchronous MVP AI extraction.

## Prerequisites

- Python 3.11+
- Supabase project with every migration in `D:\projects\LAA-3\supabase\migrations` applied
- Supabase Storage bucket named `alia-files`
- Supabase service role key for backend-only database/storage writes

## Setup

```powershell
cd D:\projects\LAA-3\alia-backend
copy .env.example .env
py -3.11 -m venv venv
.\venv\Scripts\python.exe -m pip install -r requirements.txt
```

If `py` is not installed, use the full path to your Python 3.11 executable.

## Run

```powershell
.\venv\Scripts\python.exe -m uvicorn app.main:app --reload --port 8000
```

Health checks:

- `GET /`
- `GET /api/v1/health`

## Key Routes

All `/api/v1/*` data routes require `Authorization: Bearer <supabase_access_token>`.

| Method | Endpoint | Description |
| --- | --- | --- |
| GET | `/api/v1/auth/me` | Current auth profile |
| GET/PATCH | `/api/v1/users/me` | Profile settings |
| GET/POST/PATCH/DELETE | `/api/v1/tasks` | Task management |
| PATCH | `/api/v1/tasks/{id}/complete` | Complete task and award XP once |
| POST | `/api/v1/ai/extract` | Extract tasks from one file or text input |
| POST | `/api/v1/ai/confirm` | Save reviewed extracted tasks |
| GET | `/api/v1/files` | Recent source files |
| GET | `/api/v1/gamification/me` | XP, level, and streak state |
| GET | `/api/v1/briefings/today` | Deterministic daily briefing |

## Security Notes

The checked-in `.env.example` files contain placeholders only. If any real Supabase or AI keys were ever committed or shared, rotate them in the provider dashboards before using this app with sensitive data.
