-- Performance indexes for the missed-questions / review-queue path.
--
-- load_missed_questions filters answers by session_id + is_correct = false
-- + skipped = false and orders by answered_at DESC. The existing
-- answers_session_id_idx serves the filter but not the sort; this partial
-- index covers the whole access pattern and stays small (wrong answers only).
CREATE INDEX IF NOT EXISTS answers_wrong_by_session_idx
  ON answers (session_id, answered_at DESC)
  WHERE is_correct = FALSE AND skipped = FALSE;

-- Session loading orders questions by position within a session.
CREATE INDEX IF NOT EXISTS questions_session_position_idx
  ON questions (session_id, position);
