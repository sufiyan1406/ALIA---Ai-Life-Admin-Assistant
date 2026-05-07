-- ============================================================
-- PHASE 4: Smart Reminder & Automation Engine
-- Run this migration against your Supabase SQL editor
-- ============================================================

-- 1. Add status tracking columns to reminders
ALTER TABLE reminders ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'pending'
  CHECK (status IN ('pending', 'sent', 'failed', 'dismissed'));
ALTER TABLE reminders ADD COLUMN IF NOT EXISTS sent_at TIMESTAMPTZ;
ALTER TABLE reminders ADD COLUMN IF NOT EXISTS dismissed_at TIMESTAMPTZ;
ALTER TABLE reminders ADD COLUMN IF NOT EXISTS retry_count INT DEFAULT 0;

-- 2. Migrate existing data: sent=true → status='sent'
UPDATE reminders SET status = 'sent', sent_at = created_at WHERE sent = true AND status = 'pending';

-- 3. Index for scheduler performance (only pending reminders by due time)
CREATE INDEX IF NOT EXISTS idx_reminders_pending_due
  ON reminders (status, remind_at) WHERE status = 'pending';

-- 4. Add user preference columns
ALTER TABLE users ADD COLUMN IF NOT EXISTS reminder_intensity TEXT DEFAULT 'normal'
  CHECK (reminder_intensity IN ('minimal', 'normal', 'aggressive'));
ALTER TABLE users ADD COLUMN IF NOT EXISTS quiet_hours_start TIME DEFAULT '22:00';
ALTER TABLE users ADD COLUMN IF NOT EXISTS quiet_hours_end TIME DEFAULT '07:00';
