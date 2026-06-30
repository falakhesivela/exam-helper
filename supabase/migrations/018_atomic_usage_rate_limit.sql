-- Atomic counters so freemium usage and rate limits are correct across multiple
-- serverless instances (the previous read-modify-write / in-memory approaches
-- lost updates under concurrency and didn't share state between instances).

-- Atomically bump a day's usage counters and return the updated row. Replaces
-- the get-then-upsert pattern that could lose concurrent increments.
CREATE OR REPLACE FUNCTION increment_daily_usage(
  p_user_id UUID,
  p_usage_date DATE,
  p_questions INTEGER,
  p_lessons INTEGER
)
RETURNS daily_usage
LANGUAGE plpgsql
AS $$
DECLARE
  result daily_usage;
BEGIN
  INSERT INTO daily_usage (user_id, usage_date, questions_used, lessons_generated)
  VALUES (p_user_id, p_usage_date, p_questions, p_lessons)
  ON CONFLICT (user_id, usage_date) DO UPDATE
    SET questions_used = daily_usage.questions_used + p_questions,
        lessons_generated = daily_usage.lessons_generated + p_lessons,
        updated_at = now()
  RETURNING * INTO result;
  RETURN result;
END;
$$;

-- Shared, instance-independent fixed-window rate limiter.
CREATE TABLE IF NOT EXISTS rate_limits (
  key TEXT PRIMARY KEY,
  count INTEGER NOT NULL,
  reset_at TIMESTAMPTZ NOT NULL
);

ALTER TABLE rate_limits ENABLE ROW LEVEL SECURITY;
-- No policies: only the service role (which bypasses RLS) touches this table.

-- Atomically count a hit against `p_key` and report whether it's still within
-- `p_limit` for the current window. Windows roll over once `reset_at` passes.
CREATE OR REPLACE FUNCTION check_rate_limit(
  p_key TEXT,
  p_limit INTEGER,
  p_window_ms INTEGER
)
RETURNS BOOLEAN
LANGUAGE plpgsql
AS $$
DECLARE
  now_ts TIMESTAMPTZ := now();
  new_count INTEGER;
BEGIN
  INSERT INTO rate_limits (key, count, reset_at)
  VALUES (p_key, 1, now_ts + make_interval(secs => p_window_ms / 1000.0))
  ON CONFLICT (key) DO UPDATE
    SET count = CASE
          WHEN rate_limits.reset_at <= now_ts THEN 1
          ELSE rate_limits.count + 1
        END,
        reset_at = CASE
          WHEN rate_limits.reset_at <= now_ts
            THEN now_ts + make_interval(secs => p_window_ms / 1000.0)
          ELSE rate_limits.reset_at
        END
  RETURNING count INTO new_count;
  RETURN new_count <= p_limit;
END;
$$;
