-- Spaced repetition schedule for missed questions
CREATE TABLE IF NOT EXISTS review_schedule (
  user_id UUID NOT NULL REFERENCES profiles (id) ON DELETE CASCADE,
  question_id UUID NOT NULL REFERENCES questions (id) ON DELETE CASCADE,
  next_review_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  interval_days INTEGER NOT NULL DEFAULT 1,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, question_id)
);

CREATE INDEX IF NOT EXISTS review_schedule_user_due_idx
  ON review_schedule (user_id, next_review_at);

ALTER TABLE review_schedule ENABLE ROW LEVEL SECURITY;

CREATE POLICY review_schedule_select_own ON review_schedule
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY review_schedule_insert_own ON review_schedule
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY review_schedule_update_own ON review_schedule
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY review_schedule_delete_own ON review_schedule
  FOR DELETE USING (auth.uid() = user_id);
