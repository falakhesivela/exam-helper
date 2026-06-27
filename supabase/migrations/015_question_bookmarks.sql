-- Persistent per-user bookmarks: save questions to revisit across sessions.
CREATE TABLE IF NOT EXISTS question_bookmarks (
  user_id UUID NOT NULL REFERENCES profiles (id) ON DELETE CASCADE,
  question_id UUID NOT NULL REFERENCES questions (id) ON DELETE CASCADE,
  note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, question_id)
);

CREATE INDEX IF NOT EXISTS question_bookmarks_user_idx
  ON question_bookmarks (user_id, created_at DESC);

ALTER TABLE question_bookmarks ENABLE ROW LEVEL SECURITY;

CREATE POLICY question_bookmarks_select_own ON question_bookmarks
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY question_bookmarks_insert_own ON question_bookmarks
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY question_bookmarks_update_own ON question_bookmarks
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY question_bookmarks_delete_own ON question_bookmarks
  FOR DELETE USING (auth.uid() = user_id);
