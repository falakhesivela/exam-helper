-- Streak mechanics: track the best streak and a configurable daily goal.
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS longest_streak INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS daily_goal INTEGER NOT NULL DEFAULT 10;

-- Backfill longest_streak from the current streak for existing users.
UPDATE profiles
  SET longest_streak = GREATEST(longest_streak, streak_days)
  WHERE streak_days > longest_streak;
