# ALIA – AI Life Admin Assistant

ALIA (AI Life Admin Assistant) is a full-stack application designed to help users manage their life like a smart inbox. It combines task management, AI-powered extraction, daily briefings, and gamification into a single system.

---

## 🚀 Features

* 🔐 Supabase Authentication (secure user management)
* 🧠 AI-powered task extraction from text/files
* ✅ Task management (create, update, complete)
* 📊 Gamification (XP, levels, streaks)
* 📁 File tracking and processing
* 📅 Daily AI-generated briefings
* ⚙️ User profile and settings

---

## 🛠️ Tech Stack

**Frontend**

* Next.js
* TypeScript
* Supabase (Auth)

**Backend**

* FastAPI
* Python 3.11+

**Database & Services**

* Supabase (Postgres + Storage)
* Resend (Email service)

---

## 📁 Project Structure

```
LAA-3/
├── alia-backend/      # FastAPI backend
├── life-admin/        # Next.js frontend
├── supabase/          # Database migrations
└── README.md          # Root README
```

---

## ⚙️ Prerequisites

* Python 3.11+
* Node.js (v18+ recommended)
* Supabase project
* Supabase Storage bucket: `alia-files`
* Supabase service role key (backend)
* Supabase anon key (frontend)

---

## 🔧 Setup Instructions

### 1. Clone the Repository

```
git clone https://github.com/your-username/ALIA---Ai-Life-Admin-Assistant.git
cd ALIA---Ai-Life-Admin-Assistant
```

---

## 🔙 Backend Setup (FastAPI)

```
cd alia-backend
copy .env.example .env
py -3.11 -m venv venv
.\venv\Scripts\python.exe -m pip install -r requirements.txt
```

### ▶ Run Backend

```
.\venv\Scripts\python.exe -m uvicorn app.main:app --reload --port 8000
```

### ✅ Health Check

* http://localhost:8000/
* http://localhost:8000/api/v1/health

---

## 🌐 Frontend Setup (Next.js)

```
cd life-admin
copy .env.local.example .env.local
npm install
```

Fill `.env.local` with:

* Supabase URL
* Supabase anon key

### ▶ Run Frontend

```
npm run dev
```

Open:

```
http://localhost:3000
```

---

## 🔑 Environment Variables

### Backend (`.env`)

* Supabase URL
* Supabase Service Role Key
* Any AI / Email keys

### Frontend (`.env.local`)

* Supabase URL
* Supabase Anon Key

⚠️ Never commit real keys. Use `.env.example` files.

---

## 📡 API Overview

All backend routes are prefixed with:

```
/api/v1/
```

Authentication required:

```
Authorization: Bearer <supabase_access_token>
```

### Key Endpoints

| Method    | Endpoint               | Description          |
| --------- | ---------------------- | -------------------- |
| GET       | `/auth/me`             | Current user         |
| GET/PATCH | `/users/me`            | Profile              |
| CRUD      | `/tasks`               | Task management      |
| PATCH     | `/tasks/{id}/complete` | Complete task        |
| POST      | `/ai/extract`          | Extract tasks        |
| POST      | `/ai/confirm`          | Save extracted tasks |
| GET       | `/files`               | Files                |
| GET       | `/gamification/me`     | XP & stats           |
| GET       | `/briefings/today`     | Daily briefing       |

---

## 🧪 Verify Setup

### Frontend

```
npm run lint
npm run build
```

---

## 🔐 Security Notes

* `.env` files must never be committed
* Rotate keys if accidentally exposed
* Backend uses Supabase service role (keep it private)

---

## 🧠 How It Works (High-Level)

1. User logs in via Supabase
2. Frontend sends requests with access token
3. Backend verifies token
4. Backend interacts with Supabase DB & storage
5. AI extraction processes input into tasks
6. Gamification updates XP and streaks

---

## 📌 Future Improvements

* Background job processing for AI tasks
* Notifications & reminders
* Mobile app version
* Advanced analytics dashboard

---

## 💬 Final Note

This is a full-stack MVP designed for real-world use.
If something breaks, it’s probably your environment—not the code. Fix your setup first.

---
