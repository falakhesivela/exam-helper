-- Row Level Security policies

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE answers ENABLE ROW LEVEL SECURITY;
ALTER TABLE topic_mastery ENABLE ROW LEVEL SECURITY;
ALTER TABLE uploads ENABLE ROW LEVEL SECURITY;

-- Profiles: users read/update own row
CREATE POLICY profiles_select_own ON profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY profiles_update_own ON profiles
  FOR UPDATE USING (auth.uid() = id);

-- Daily usage
CREATE POLICY daily_usage_select_own ON daily_usage
  FOR SELECT USING (auth.uid() = user_id);

-- Sessions
CREATE POLICY sessions_select_own ON sessions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY sessions_insert_own ON sessions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY sessions_update_own ON sessions
  FOR UPDATE USING (auth.uid() = user_id);

-- Questions: readable via session ownership (sensitive columns stripped by view)
CREATE POLICY questions_select_own ON questions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM sessions s
      WHERE s.id = questions.session_id AND s.user_id = auth.uid()
    )
  );

-- Answers
CREATE POLICY answers_select_own ON answers
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM sessions s
      WHERE s.id = answers.session_id AND s.user_id = auth.uid()
    )
  );

CREATE POLICY answers_insert_own ON answers
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM sessions s
      WHERE s.id = answers.session_id AND s.user_id = auth.uid()
    )
  );

CREATE POLICY answers_update_own ON answers
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM sessions s
      WHERE s.id = answers.session_id AND s.user_id = auth.uid()
    )
  );

-- Topic mastery
CREATE POLICY topic_mastery_select_own ON topic_mastery
  FOR SELECT USING (auth.uid() = user_id);

-- Uploads
CREATE POLICY uploads_select_own ON uploads
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY uploads_insert_own ON uploads
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY uploads_delete_own ON uploads
  FOR DELETE USING (auth.uid() = user_id);
