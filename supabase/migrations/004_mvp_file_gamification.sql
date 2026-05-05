-- ============================================================
-- ALIA MVP -- File metadata, source linking, and reward events
-- 004_mvp_file_gamification.sql
-- ============================================================

ALTER TABLE files
  ADD COLUMN IF NOT EXISTS original_filename TEXT,
  ADD COLUMN IF NOT EXISTS mime_type TEXT,
  ADD COLUMN IF NOT EXISTS size_bytes INTEGER,
  ADD COLUMN IF NOT EXISTS storage_path TEXT,
  ADD COLUMN IF NOT EXISTS processing_status TEXT NOT NULL DEFAULT 'processed'
    CHECK (processing_status IN ('uploaded', 'processing', 'processed', 'failed')),
  ADD COLUMN IF NOT EXISTS source_task_count INTEGER NOT NULL DEFAULT 0;

CREATE INDEX IF NOT EXISTS idx_files_created_at ON files(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_files_processing_status ON files(processing_status);

CREATE TABLE IF NOT EXISTS task_reward_events (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id      UUID UNIQUE NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  user_id      UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  xp_awarded   INTEGER NOT NULL,
  reason       TEXT NOT NULL DEFAULT 'task_completed',
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE task_reward_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own reward events"
  ON task_reward_events FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own reward events"
  ON task_reward_events FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_task_reward_events_user_id ON task_reward_events(user_id);
CREATE INDEX IF NOT EXISTS idx_task_reward_events_created_at ON task_reward_events(created_at DESC);
