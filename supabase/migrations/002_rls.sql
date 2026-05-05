-- ============================================================
-- ALIA Phase 1 — Row Level Security
-- 002_rls.sql
-- Enable RLS on all tables and create per-user access policies
-- ============================================================

-- ────────────────────────────────────────────────────────────
-- ENABLE RLS
-- ────────────────────────────────────────────────────────────
ALTER TABLE users        ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks        ENABLE ROW LEVEL SECURITY;
ALTER TABLE files        ENABLE ROW LEVEL SECURITY;
ALTER TABLE reminders    ENABLE ROW LEVEL SECURITY;
ALTER TABLE gamification ENABLE ROW LEVEL SECURITY;

-- ────────────────────────────────────────────────────────────
-- USERS policies
-- ────────────────────────────────────────────────────────────
CREATE POLICY "Users can view own profile"
  ON users FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON users FOR UPDATE
  USING (auth.uid() = id);

-- ────────────────────────────────────────────────────────────
-- TASKS policies
-- ────────────────────────────────────────────────────────────
CREATE POLICY "Users can view own tasks"
  ON tasks FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own tasks"
  ON tasks FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own tasks"
  ON tasks FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own tasks"
  ON tasks FOR DELETE
  USING (auth.uid() = user_id);

-- ────────────────────────────────────────────────────────────
-- FILES policies
-- ────────────────────────────────────────────────────────────
CREATE POLICY "Users can view own files"
  ON files FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own files"
  ON files FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own files"
  ON files FOR DELETE
  USING (auth.uid() = user_id);

-- ────────────────────────────────────────────────────────────
-- REMINDERS policies
-- ────────────────────────────────────────────────────────────
CREATE POLICY "Users can view own reminders"
  ON reminders FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own reminders"
  ON reminders FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own reminders"
  ON reminders FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own reminders"
  ON reminders FOR DELETE
  USING (auth.uid() = user_id);

-- ────────────────────────────────────────────────────────────
-- GAMIFICATION policies
-- ────────────────────────────────────────────────────────────
CREATE POLICY "Users can view own gamification"
  ON gamification FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own gamification"
  ON gamification FOR UPDATE
  USING (auth.uid() = user_id);

-- ────────────────────────────────────────────────────────────
-- STORAGE: alia-files bucket RLS policies
-- (Run after creating the bucket in Supabase dashboard)
-- ────────────────────────────────────────────────────────────
-- INSERT: users can upload to their own folder
CREATE POLICY "Users can upload own files"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'alia-files'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- SELECT: users can read their own files
CREATE POLICY "Users can read own files"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'alia-files'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- DELETE: users can delete their own files
CREATE POLICY "Users can delete own files from storage"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'alia-files'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );
