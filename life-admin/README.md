# ALIA Frontend - Smart Life Inbox

Next.js app for the ALIA web MVP. It handles Supabase auth, AI intake review, task management, dashboard briefings, source files, settings, and gamification display.

## Setup

```powershell
cd D:\projects\LAA-3\life-admin
copy .env.local.example .env.local
npm.cmd install
```

Fill `.env.local` with your Supabase anon key and API URL.

## Run

```powershell
npm.cmd run dev
```

Open `http://localhost:3000`.

## Verify

```powershell
npm.cmd run lint
npm.cmd run build
```

Use `npm.cmd` on Windows PowerShell when script execution policy blocks `npm.ps1`.
