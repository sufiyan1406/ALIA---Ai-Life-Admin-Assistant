-- ============================================================
-- ALIA Phase 1 — Triggers & Functions
-- 003_triggers.sql
-- Auto-creates user profile + gamification row on auth signup
-- ============================================================

-- ────────────────────────────────────────────────────────────
-- FUNCTION: handle_new_user
-- Fires after a new auth.users row is inserted.
-- Creates matching rows in public.users and public.gamification.
-- ────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, display_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1))
  );

  INSERT INTO public.gamification (user_id)
  VALUES (NEW.id);

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ────────────────────────────────────────────────────────────
-- TRIGGER: on_auth_user_created
-- ────────────────────────────────────────────────────────────
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();
