-- Mentor quick-check attempts.
--
-- Quick checks are ```quiz fences inside an assistant reply (migration 031's
-- mentor_messages.content). Before this table the answer lived only in React
-- state, so reopening a thread showed every card as unanswered and the learner
-- had no record of what they got wrong.
--
-- The row is keyed by (message_id, quiz_index) rather than a synthetic id:
-- quiz_index is the 0-based position of a closed ```quiz fence in that message,
-- which both parsers derive with the same rule (app/ai/quiz_block.py and
-- lib/mentor/quiz-block.ts). Message content is immutable once persisted, so
-- that pair is stable forever and an upsert is the natural retry semantics.

CREATE TABLE IF NOT EXISTS mentor_quiz_attempts (
  message_id BIGINT NOT NULL REFERENCES mentor_messages (id) ON DELETE CASCADE,
  quiz_index SMALLINT NOT NULL CHECK (quiz_index >= 0),
  -- Denormalized so RLS stays a single-table predicate, matching the reasoning
  -- on mentor_messages in migration 031 (no join per row).
  user_id UUID NOT NULL REFERENCES profiles (id) ON DELETE CASCADE,
  selected_option_ids TEXT[] NOT NULL,
  is_correct BOOLEAN NOT NULL,
  -- 1 or 2: the card allows one retry before revealing. XP is only ever
  -- awarded on a first-attempt correct answer, so a learner cannot walk the
  -- options to farm it.
  attempts SMALLINT NOT NULL DEFAULT 1 CHECK (attempts BETWEEN 1 AND 2),
  confidence TEXT CHECK (confidence IN ('sure', 'unsure')),
  answered_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (message_id, quiz_index)
);

-- Loading a thread fetches every attempt across its messages at once.
CREATE INDEX IF NOT EXISTS mentor_quiz_attempts_user_idx
  ON mentor_quiz_attempts (user_id, answered_at DESC);

ALTER TABLE mentor_quiz_attempts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS mentor_quiz_attempts_select_own ON mentor_quiz_attempts;
CREATE POLICY mentor_quiz_attempts_select_own ON mentor_quiz_attempts
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS mentor_quiz_attempts_insert_own ON mentor_quiz_attempts;
CREATE POLICY mentor_quiz_attempts_insert_own ON mentor_quiz_attempts
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS mentor_quiz_attempts_update_own ON mentor_quiz_attempts;
CREATE POLICY mentor_quiz_attempts_update_own ON mentor_quiz_attempts
  FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS mentor_quiz_attempts_delete_own ON mentor_quiz_attempts;
CREATE POLICY mentor_quiz_attempts_delete_own ON mentor_quiz_attempts
  FOR DELETE USING (auth.uid() = user_id);
