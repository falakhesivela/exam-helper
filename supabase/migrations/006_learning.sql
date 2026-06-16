-- Learning area: cached AI lessons, progress tracking, daily lesson usage

-- Extend daily_usage with lesson generation counter
ALTER TABLE daily_usage
  ADD COLUMN IF NOT EXISTS lessons_generated INTEGER NOT NULL DEFAULT 0;

-- Cached AI-generated lesson content per user/topic
CREATE TABLE topic_lessons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles (id) ON DELETE CASCADE,
  exam_code TEXT NOT NULL,
  topic_slug TEXT NOT NULL,
  topic_name TEXT NOT NULL,
  content JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, exam_code, topic_slug)
);

CREATE INDEX topic_lessons_user_id_idx ON topic_lessons (user_id);

-- User progress on lessons
CREATE TABLE lesson_progress (
  user_id UUID NOT NULL REFERENCES profiles (id) ON DELETE CASCADE,
  topic_lesson_id UUID NOT NULL REFERENCES topic_lessons (id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'started'
    CHECK (status IN ('started', 'completed')),
  bookmarked BOOLEAN NOT NULL DEFAULT false,
  completed_at TIMESTAMPTZ,
  PRIMARY KEY (user_id, topic_lesson_id)
);

CREATE INDEX lesson_progress_user_id_idx ON lesson_progress (user_id);

-- RLS
ALTER TABLE topic_lessons ENABLE ROW LEVEL SECURITY;
ALTER TABLE lesson_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY topic_lessons_select_own ON topic_lessons
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY lesson_progress_select_own ON lesson_progress
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY lesson_progress_insert_own ON lesson_progress
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY lesson_progress_update_own ON lesson_progress
  FOR UPDATE USING (auth.uid() = user_id);
