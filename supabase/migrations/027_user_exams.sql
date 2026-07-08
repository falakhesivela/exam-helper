-- Exams a user is studying (chosen at onboarding or added later), with
-- optional exam dates. The ACTIVE exam is derived at read time from practice
-- history (last-practiced wins), falling back to these rows for users who
-- onboarded but haven't practiced yet — so there is no is_primary flag here.
CREATE TABLE IF NOT EXISTS user_exams (
  user_id UUID NOT NULL REFERENCES profiles (id) ON DELETE CASCADE,
  exam_code TEXT NOT NULL,
  exam TEXT NOT NULL,
  exam_date DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, exam_code)
);

CREATE INDEX IF NOT EXISTS user_exams_user_idx ON user_exams (user_id);

ALTER TABLE user_exams ENABLE ROW LEVEL SECURITY;

CREATE POLICY user_exams_select_own ON user_exams
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY user_exams_insert_own ON user_exams
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY user_exams_update_own ON user_exams
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY user_exams_delete_own ON user_exams
  FOR DELETE USING (auth.uid() = user_id);

-- Onboarding gate: null = show onboarding once after signup.
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS onboarded_at TIMESTAMPTZ;

-- Existing users never see onboarding.
UPDATE profiles SET onboarded_at = now() WHERE onboarded_at IS NULL;

-- Backfill: every non-custom exam the user has already practiced.
INSERT INTO user_exams (user_id, exam_code, exam)
SELECT DISTINCT ON (user_id, exam_code) user_id, exam_code, exam
FROM sessions
WHERE exam_code IS NOT NULL AND exam_code <> 'CUSTOM'
ORDER BY user_id, exam_code, created_at DESC
ON CONFLICT (user_id, exam_code) DO NOTHING;
