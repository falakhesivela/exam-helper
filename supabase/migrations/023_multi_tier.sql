-- Multi-tier subscriptions: free / pro / exam_pass, AI token metering, and a
-- generic usage-counter table for per-tier quotas (daily, monthly, lifetime).

-- 1. Allow the new exam_pass tier. The inline CHECK from 001 is auto-named.
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_plan_check;
ALTER TABLE profiles
  ADD CONSTRAINT profiles_plan_check CHECK (plan IN ('free', 'pro', 'exam_pass'));

-- Exam Pass is a one-time purchase with a 90-day window; NULL for other tiers.
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS plan_expires_at TIMESTAMPTZ;

-- Guards against out-of-order Paddle webhook deliveries: only apply an event
-- if it is newer than the last one we processed.
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS plan_event_at TIMESTAMPTZ;

-- 2. Raw AI token usage per completion, for cost dashboards and margin checks.
-- Dollar cost is computed at read time from per-model prices in code, so price
-- changes never require a backfill.
CREATE TABLE IF NOT EXISTS ai_usage (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id UUID REFERENCES profiles (id) ON DELETE SET NULL,
  feature TEXT NOT NULL,
  provider TEXT NOT NULL,
  model TEXT NOT NULL,
  input_tokens INTEGER NOT NULL DEFAULT 0,
  output_tokens INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS ai_usage_user_idx ON ai_usage (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS ai_usage_created_idx ON ai_usage (created_at);

ALTER TABLE ai_usage ENABLE ROW LEVEL SECURITY;
-- No policies: only the service role (which bypasses RLS) touches this table.

-- 3. Generic per-user counters. `period` is the window key:
--   'YYYY-MM-DD' for daily quotas, 'YYYY-MM' for monthly (both in the user's
--   timezone, computed by the caller), or 'life' for lifetime allowances
--   (the trial-style free tier).
CREATE TABLE IF NOT EXISTS usage_counters (
  user_id UUID NOT NULL REFERENCES profiles (id) ON DELETE CASCADE,
  counter TEXT NOT NULL,
  period TEXT NOT NULL,
  count INTEGER NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, counter, period)
);

ALTER TABLE usage_counters ENABLE ROW LEVEL SECURITY;
-- No policies: service-role access only.

-- Atomically bump a counter and return the new value (same pattern as
-- increment_daily_usage in 018, which stays untouched for questions/lessons).
CREATE OR REPLACE FUNCTION increment_usage_counter(
  p_user_id UUID,
  p_counter TEXT,
  p_period TEXT,
  p_amount INTEGER
)
RETURNS INTEGER
LANGUAGE plpgsql
AS $$
DECLARE
  new_count INTEGER;
BEGIN
  INSERT INTO usage_counters (user_id, counter, period, count)
  VALUES (p_user_id, p_counter, p_period, p_amount)
  ON CONFLICT (user_id, counter, period) DO UPDATE
    SET count = usage_counters.count + p_amount,
        updated_at = now()
  RETURNING count INTO new_count;
  RETURN new_count;
END;
$$;
