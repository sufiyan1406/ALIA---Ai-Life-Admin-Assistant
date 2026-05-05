<!-- HEADER -->

<h1 align="center">🚀 ALIA – AI Life Admin Assistant</h1>

<p align="center">
  <b>Turn your life into a structured, AI-powered system</b>
</p>

<p align="center">
  <img src="https://readme-typing-svg.demolab.com?font=Fira+Code&size=22&pause=1000&color=00F7FF&center=true&vCenter=true&width=600&lines=AI+Task+Extraction;Smart+Daily+Briefings;Gamified+Productivity;Full-Stack+AI+System" />
</p>

<p align="center">
  <img src="https://img.shields.io/github/stars/sufiyan1406/ALIA---Ai-Life-Admin-Assistant?style=for-the-badge&color=yellow"/>
  <img src="https://img.shields.io/github/forks/sufiyan1406/ALIA---Ai-Life-Admin-Assistant?style=for-the-badge&color=blue"/>
  <img src="https://img.shields.io/github/issues/sufiyan1406/ALIA---Ai-Life-Admin-Assistant?style=for-the-badge&color=red"/>
</p>

---

## 🌐 Live Demo

🚧 **Deployment in progress**

This project is currently not publicly deployed.
Run locally using the setup guide below.

---

## 📸 Screenshots

<p align="center">
  <img src="https://cdn.corenexis.com/files/c/8627665720.png" width="45%" />
  <img src="https://cdn.corenexis.com/files/c/3195879720.png" width="45%" />
</p>

<p align="center">
  <img src="https://cdn.corenexis.com/files/c/7441885720.png" width="45%" />
  <img src="https://cdn.corenexis.com/files/c/4178996720.png" width="45%" />
</p>
---

## ✨ Overview

ALIA is a **full-stack AI productivity system** that transforms unstructured input into actionable workflows.

Instead of managing tasks manually, ALIA helps you:

* Extract tasks automatically using AI
* Organize and prioritize intelligently
* Track progress with gamification
* Receive daily structured insights

---

## 🔥 Core Features

| Feature            | Description                                   |
| ------------------ | --------------------------------------------- |
| 🧠 AI Extraction   | Converts raw text/files into structured tasks |
| ✅ Task Manager     | Full CRUD operations for tasks                |
| 📊 Gamification    | XP, streaks, levels                           |
| 📅 Smart Briefings | Daily AI-generated summaries                  |
| 📁 File System     | Source file tracking                          |
| 🔐 Auth            | Secure login via Supabase                     |

---

## 🏗️ System Architecture

```mermaid
flowchart TD
    A[User] --> B[Next.js Frontend]
    B -->|JWT| C[FastAPI Backend]
    C --> D[Supabase DB]
    C --> E[Supabase Storage]
    C --> F[AI Engine]
    F --> C
```

---

## ⚡ Tech Stack

<p align="center">
  <img src="https://skillicons.dev/icons?i=nextjs,react,ts,python,fastapi,postgres,supabase" />
</p>

---

## 📁 Project Structure

```bash
ALIA/
├── alia-backend/
├── life-admin/
├── supabase/
└── README.md
```

---

## ⚙️ Setup Guide

### 🔙 Backend

```bash
cd alia-backend
copy .env.example .env
py -3.11 -m venv venv
.\venv\Scripts\python.exe -m pip install -r requirements.txt
.\venv\Scripts\python.exe -m uvicorn app.main:app --reload --port 8000
```

---

### 🌐 Frontend

```bash
cd life-admin
copy .env.local.example .env.local
npm install
npm run dev
```

👉 http://localhost:3000

---

## 🔑 Environment Variables

### Backend

* SUPABASE_URL
* SUPABASE_SERVICE_ROLE_KEY

### Frontend

* NEXT_PUBLIC_SUPABASE_URL
* NEXT_PUBLIC_SUPABASE_ANON_KEY

⚠️ Never commit secrets

---

## 📡 API Highlights

| Endpoint      | Purpose         |
| ------------- | --------------- |
| /tasks        | Task management |
| /ai/extract   | AI processing   |
| /files        | File handling   |
| /gamification | XP system       |
| /briefings    | Daily insights  |

---

## 🎯 Why This Project Stands Out

* Full-stack AI system (not just UI demo)
* Real-world usable architecture
* Combines productivity + AI + gamification
* Clean separation of frontend & backend
* Scalable design

---

## 🚀 Roadmap

* 🔔 Smart notifications
* 📱 Mobile application
* 🤖 Advanced AI workflows
* 📊 Analytics dashboard

---

## 👨‍💻 Developer Note

This is a **real MVP system**, not a toy project.
If something breaks, fix your environment before blaming the code.

---

## ⭐ Support

<p align="center">
  If you found this project useful, consider giving it a ⭐
</p>
