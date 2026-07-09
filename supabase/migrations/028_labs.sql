-- Guided hands-on labs: AI-generated once per (exam, topic) and shared by all
-- users (globally cached — unlike per-user topic_lessons). Users run labs in
-- their own free-tier cloud account; we only store the instructions.
CREATE TABLE labs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  exam_code TEXT NOT NULL,
  topic_slug TEXT NOT NULL,
  topic_name TEXT NOT NULL,
  content JSONB NOT NULL,
  -- Hand-review pin: reviewed labs are never regenerated automatically.
  reviewed BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (exam_code, topic_slug)
);

CREATE TABLE lab_progress (
  user_id UUID NOT NULL REFERENCES profiles (id) ON DELETE CASCADE,
  lab_id UUID NOT NULL REFERENCES labs (id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'started'
    CHECK (status IN ('started', 'completed')),
  -- 0-based indices of steps the user has checked off.
  steps_done JSONB NOT NULL DEFAULT '[]',
  checkpoint_score INTEGER,
  checkpoint_total INTEGER,
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ,
  PRIMARY KEY (user_id, lab_id)
);

CREATE INDEX lab_progress_user_id_idx ON lab_progress (user_id);

ALTER TABLE labs ENABLE ROW LEVEL SECURITY;
ALTER TABLE lab_progress ENABLE ROW LEVEL SECURITY;

-- Lab content is global and non-sensitive.
CREATE POLICY labs_select_authenticated ON labs
  FOR SELECT TO authenticated USING (true);

CREATE POLICY lab_progress_select_own ON lab_progress
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY lab_progress_insert_own ON lab_progress
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY lab_progress_update_own ON lab_progress
  FOR UPDATE USING (auth.uid() = user_id);
