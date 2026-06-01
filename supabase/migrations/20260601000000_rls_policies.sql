-- RLS policies for NeutralEye
-- Run this once in the Supabase SQL editor (Dashboard → SQL Editor → New query)

-- ── analyses ──────────────────────────────────────────────────────────────────

ALTER TABLE analyses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "analyses_select_own" ON analyses
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "analyses_insert_own" ON analyses
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "analyses_update_own" ON analyses
  FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "analyses_delete_own" ON analyses
  FOR DELETE USING (auth.uid() = user_id);

-- ── daily_usage ───────────────────────────────────────────────────────────────

ALTER TABLE daily_usage ENABLE ROW LEVEL SECURITY;

CREATE POLICY "daily_usage_select_own" ON daily_usage
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "daily_usage_insert_own" ON daily_usage
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "daily_usage_update_own" ON daily_usage
  FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
