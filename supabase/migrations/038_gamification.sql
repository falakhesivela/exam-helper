-- Gamification: XP + levels, badges, daily challenges, and weekly XP leagues.
-- XP lives in an append-only event log (auditable, powers weekly league sums)
-- plus a denormalized total on profiles maintained only by the award_xp RPC.

-- 1. Profile columns.
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS xp_total INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS league_tier TEXT NOT NULL DEFAULT 'bronze';
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_league_tier_check;
ALTER TABLE profiles
  ADD CONSTRAINT profiles_league_tier_check
  CHECK (league_tier IN ('bronze', 'silver', 'gold', 'diamond'));

-- 2. XP event log. `source_key` is a natural idempotency key (e.g.
-- 'lesson:<id>'); the partial unique index makes re-awards no-ops.
-- `local_date` is the user-local day (daily caps), `week_start` the UTC
-- Monday (league sums) — days are user-local, weeks are global.
CREATE TABLE IF NOT EXISTS xp_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles (id) ON DELETE CASCADE,
  kind TEXT NOT NULL,
  amount INTEGER NOT NULL,
  source_key TEXT,
  local_date DATE NOT NULL,
  week_start DATE NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS xp_events_dedupe_idx
  ON xp_events (user_id, kind, source_key)
  WHERE source_key IS NOT NULL;
CREATE INDEX IF NOT EXISTS xp_events_user_week_idx ON xp_events (user_id, week_start);
CREATE INDEX IF NOT EXISTS xp_events_user_kind_day_idx ON xp_events (user_id, kind, local_date);

ALTER TABLE xp_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users read own xp events" ON xp_events
  FOR SELECT USING (auth.uid() = user_id);

-- Atomically award XP: clamp to a per-kind daily cap (0 = uncapped), insert
-- the event (deduped on source_key), and bump the denormalized total only if
-- the event actually landed. Safe under concurrent workers.
CREATE OR REPLACE FUNCTION award_xp(
  p_user_id UUID,
  p_kind TEXT,
  p_amount INTEGER,
  p_source_key TEXT,
  p_local_date DATE,
  p_week_start DATE,
  p_daily_cap INTEGER
)
RETURNS TABLE (awarded INTEGER, xp_total INTEGER)
LANGUAGE plpgsql
AS $$
DECLARE
  clamped INTEGER := p_amount;
  spent INTEGER;
  inserted_id UUID;
  new_total INTEGER;
BEGIN
  IF p_daily_cap > 0 THEN
    SELECT COALESCE(SUM(e.amount), 0) INTO spent
      FROM xp_events e
      WHERE e.user_id = p_user_id
        AND e.kind = p_kind
        AND e.local_date = p_local_date;
    clamped := LEAST(p_amount, GREATEST(0, p_daily_cap - spent));
  END IF;

  IF clamped <= 0 THEN
    SELECT p.xp_total INTO new_total FROM profiles p WHERE p.id = p_user_id;
    RETURN QUERY SELECT 0, COALESCE(new_total, 0);
    RETURN;
  END IF;

  INSERT INTO xp_events (user_id, kind, amount, source_key, local_date, week_start)
  VALUES (p_user_id, p_kind, clamped, p_source_key, p_local_date, p_week_start)
  ON CONFLICT (user_id, kind, source_key) WHERE source_key IS NOT NULL
  DO NOTHING
  RETURNING id INTO inserted_id;

  IF inserted_id IS NULL THEN
    SELECT p.xp_total INTO new_total FROM profiles p WHERE p.id = p_user_id;
    RETURN QUERY SELECT 0, COALESCE(new_total, 0);
    RETURN;
  END IF;

  UPDATE profiles SET xp_total = profiles.xp_total + clamped
    WHERE id = p_user_id
    RETURNING profiles.xp_total INTO new_total;
  RETURN QUERY SELECT clamped, COALESCE(new_total, 0);
END;
$$;

-- 3. Badge unlocks. The badge catalog (names, copy, icons) is code-defined in
-- lib/gamification/badges.ts / app/gamification/badges.py; rows here only
-- record which user unlocked what. `seen_at` is null until the client has
-- shown the unlock celebration.
CREATE TABLE IF NOT EXISTS user_badges (
  user_id UUID NOT NULL REFERENCES profiles (id) ON DELETE CASCADE,
  badge_id TEXT NOT NULL,
  unlocked_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  seen_at TIMESTAMPTZ,
  PRIMARY KEY (user_id, badge_id)
);

ALTER TABLE user_badges ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users read own badges" ON user_badges
  FOR SELECT USING (auth.uid() = user_id);

-- 4. Daily challenges: one row per user per user-local day. The session is
-- created lazily on start; its questions are cloned from the user's history
-- (retake-missed pattern), so challenges cost zero AI spend.
CREATE TABLE IF NOT EXISTS daily_challenges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles (id) ON DELETE CASCADE,
  challenge_date DATE NOT NULL,
  exam_code TEXT NOT NULL,
  session_id UUID REFERENCES sessions (id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'ready' CHECK (status IN ('ready', 'completed')),
  score_pct INTEGER,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, challenge_date)
);

ALTER TABLE daily_challenges ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users read own challenges" ON daily_challenges
  FOR SELECT USING (auth.uid() = user_id);

ALTER TABLE sessions ADD COLUMN IF NOT EXISTS kind TEXT NOT NULL DEFAULT 'standard';
ALTER TABLE sessions DROP CONSTRAINT IF EXISTS sessions_kind_check;
ALTER TABLE sessions
  ADD CONSTRAINT sessions_kind_check CHECK (kind IN ('standard', 'daily_challenge'));

-- Clone lineage so challenge sourcing can avoid repeating recent questions.
ALTER TABLE questions ADD COLUMN IF NOT EXISTS source_question_id UUID;

-- 5. Weekly XP leagues: cohorts of up to 20 users per (week, tier), ranked by
-- that week's xp_events sum. `rolled_at` stamps the weekly rollover so cron
-- re-runs are no-ops (same idempotency pattern as organizations.digest_sent_at).
CREATE TABLE IF NOT EXISTS league_cohorts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  week_start DATE NOT NULL,
  tier TEXT NOT NULL CHECK (tier IN ('bronze', 'silver', 'gold', 'diamond')),
  rolled_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS league_cohorts_week_tier_idx ON league_cohorts (week_start, tier);

CREATE TABLE IF NOT EXISTS league_members (
  cohort_id UUID NOT NULL REFERENCES league_cohorts (id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles (id) ON DELETE CASCADE,
  week_start DATE NOT NULL,
  final_rank INTEGER,
  result TEXT CHECK (result IN ('promoted', 'demoted', 'stayed')),
  joined_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (cohort_id, user_id),
  UNIQUE (user_id, week_start)
);

ALTER TABLE league_cohorts ENABLE ROW LEVEL SECURITY;
ALTER TABLE league_members ENABLE ROW LEVEL SECURITY;
-- No policies on league tables: peers' rows are only exposed through the
-- API's curated standings shape (service role bypasses RLS).

-- Find-or-create a cohort with room for (week, tier) and enroll the user.
-- The advisory lock serializes concurrent enrollments so two workers can't
-- both create a fresh cohort or overfill one.
CREATE OR REPLACE FUNCTION join_league_cohort(
  p_user_id UUID,
  p_week_start DATE,
  p_tier TEXT
)
RETURNS UUID
LANGUAGE plpgsql
AS $$
DECLARE
  existing UUID;
  target UUID;
BEGIN
  SELECT m.cohort_id INTO existing
    FROM league_members m
    WHERE m.user_id = p_user_id AND m.week_start = p_week_start;
  IF existing IS NOT NULL THEN
    RETURN existing;
  END IF;

  PERFORM pg_advisory_xact_lock(hashtext('league:' || p_week_start::text || ':' || p_tier));

  SELECT c.id INTO target
    FROM league_cohorts c
    WHERE c.week_start = p_week_start AND c.tier = p_tier
      AND (SELECT COUNT(*) FROM league_members m WHERE m.cohort_id = c.id) < 20
    ORDER BY c.created_at
    LIMIT 1;

  IF target IS NULL THEN
    INSERT INTO league_cohorts (week_start, tier)
      VALUES (p_week_start, p_tier)
      RETURNING id INTO target;
  END IF;

  INSERT INTO league_members (cohort_id, user_id, week_start)
    VALUES (target, p_user_id, p_week_start)
    ON CONFLICT (user_id, week_start) DO NOTHING;

  SELECT m.cohort_id INTO existing
    FROM league_members m
    WHERE m.user_id = p_user_id AND m.week_start = p_week_start;
  RETURN existing;
END;
$$;
