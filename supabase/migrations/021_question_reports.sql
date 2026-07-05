-- User reports of bad AI-generated questions (wrong answer, unclear, typo…).
CREATE TABLE IF NOT EXISTS question_reports (
  user_id UUID NOT NULL REFERENCES profiles (id) ON DELETE CASCADE,
  question_id UUID NOT NULL REFERENCES questions (id) ON DELETE CASCADE,
  reason TEXT NOT NULL,
  detail TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, question_id)
);

CREATE INDEX IF NOT EXISTS question_reports_question_idx
  ON question_reports (question_id, created_at DESC);

ALTER TABLE question_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY question_reports_select_own ON question_reports
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY question_reports_insert_own ON question_reports
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY question_reports_update_own ON question_reports
  FOR UPDATE USING (auth.uid() = user_id);
