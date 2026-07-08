-- Spaced repetition schedule for lesson key facts, addressed by
-- (topic_lesson_id, fact_index) into the lesson content's keyFacts array.
CREATE TABLE IF NOT EXISTS fact_reviews (
  user_id UUID NOT NULL REFERENCES profiles (id) ON DELETE CASCADE,
  topic_lesson_id UUID NOT NULL REFERENCES topic_lessons (id) ON DELETE CASCADE,
  fact_index INTEGER NOT NULL,
  next_review_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  interval_days INTEGER NOT NULL DEFAULT 1,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, topic_lesson_id, fact_index)
);

CREATE INDEX IF NOT EXISTS fact_reviews_user_due_idx
  ON fact_reviews (user_id, next_review_at);

ALTER TABLE fact_reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY fact_reviews_select_own ON fact_reviews
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY fact_reviews_insert_own ON fact_reviews
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY fact_reviews_update_own ON fact_reviews
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY fact_reviews_delete_own ON fact_reviews
  FOR DELETE USING (auth.uid() = user_id);
