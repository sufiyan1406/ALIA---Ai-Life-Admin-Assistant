-- ============================================================
-- ALIA Phase 1 — Schema Migration
-- 001_schema.sql
-- Creates all tables, constraints, indexes
-- ============================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ────────────────────────────────────────────────────────────
-- TABLE: users
-- ────────────────────────────────────────────────────────────
CREATE TABLE users (
  id            UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email         TEXT UNIQUE NOT NULL,
  display_name  TEXT,
  timezone      TEXT NOT NULL DEFAULT 'Asia/Kolkata',
  briefing_time TIME NOT NULL DEFAULT '07:00:00',
  plan          TEXT NOT NULL DEFAULT 'free' CHECK (plan IN ('free', 'pro', 'team')),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ────────────────────────────────────────────────────────────
-- TABLE: files (must be before tasks due to FK dependency)
-- ────────────────────────────────────────────────────────────
CREATE TABLE files (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  file_type    TEXT NOT NULL CHECK (file_type IN ('image', 'pdf', 'audio', 'text')),
  storage_url  TEXT NOT NULL,
  raw_text     TEXT,
  processed_at TIMESTAMPTZ,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ────────────────────────────────────────────────────────────
-- TABLE: tasks
-- ────────────────────────────────────────────────────────────
CREATE TABLE tasks (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  task_name        TEXT NOT NULL,
  category         TEXT CHECK (category IN ('Finance', 'Health', 'Legal', 'Home', 'Work', 'Personal')),
  priority         TEXT NOT NULL DEFAULT 'Medium' CHECK (priority IN ('Urgent', 'High', 'Medium', 'Low')),
  status           TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'done', 'snoozed', 'archived')),
  due_date         DATE,
  suggested_action TEXT,
  source_file_id   UUID,
  xp_value         INTEGER NOT NULL DEFAULT 20,
  confidence_score FLOAT CHECK (confidence_score BETWEEN 0.0 AND 1.0),
  needs_review     BOOLEAN NOT NULL DEFAULT FALSE,
  notes            TEXT,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at     TIMESTAMPTZ,
  CONSTRAINT fk_tasks_source_file FOREIGN KEY (source_file_id) REFERENCES files(id) ON DELETE SET NULL
);

-- ────────────────────────────────────────────────────────────
-- TABLE: reminders
-- ────────────────────────────────────────────────────────────
CREATE TABLE reminders (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id    UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  user_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  remind_at  TIMESTAMPTZ NOT NULL,
  channel    TEXT NOT NULL DEFAULT 'in-app' CHECK (channel IN ('push', 'email', 'in-app')),
  sent       BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ────────────────────────────────────────────────────────────
-- TABLE: gamification
-- ────────────────────────────────────────────────────────────
CREATE TABLE gamification (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          UUID UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  xp_total         INTEGER NOT NULL DEFAULT 0,
  level            INTEGER NOT NULL DEFAULT 1,
  streak_current   INTEGER NOT NULL DEFAULT 0,
  streak_longest   INTEGER NOT NULL DEFAULT 0,
  streak_last_date DATE,
  streak_freezes   INTEGER NOT NULL DEFAULT 1,
  badges           JSONB NOT NULL DEFAULT '[]',
  daily_missions   JSONB NOT NULL DEFAULT '[]'
);

-- ────────────────────────────────────────────────────────────
-- INDEXES
-- ────────────────────────────────────────────────────────────
CREATE INDEX idx_tasks_user_id    ON tasks(user_id);
CREATE INDEX idx_tasks_status     ON tasks(status);
CREATE INDEX idx_tasks_due_date   ON tasks(due_date);
CREATE INDEX idx_tasks_priority   ON tasks(priority);
CREATE INDEX idx_reminders_user_id   ON reminders(user_id);
CREATE INDEX idx_reminders_remind_at ON reminders(remind_at);
CREATE INDEX idx_files_user_id    ON files(user_id);
