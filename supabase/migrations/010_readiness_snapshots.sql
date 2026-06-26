-- Daily exam-readiness score snapshots, backing the readiness trend chart.
-- One row per user, exam code, and calendar day (lazily upserted on read).
CREATE TABLE IF NOT EXISTS readiness_snapshots (
  user_id UUID NOT NULL REFERENCES profiles (id) ON DELETE CASCADE,
  exam_code TEXT NOT NULL,
  snapshot_date DATE NOT NULL,
  score INTEGER NOT NULL,
  verdict TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, exam_code, snapshot_date)
);

CREATE INDEX IF NOT EXISTS readiness_snapshots_user_exam_idx
  ON readiness_snapshots (user_id, exam_code, snapshot_date);

ALTER TABLE readiness_snapshots ENABLE ROW LEVEL SECURITY;

CREATE POLICY readiness_snapshots_select_own ON readiness_snapshots
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY readiness_snapshots_insert_own ON readiness_snapshots
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY readiness_snapshots_update_own ON readiness_snapshots
  FOR UPDATE USING (auth.uid() = user_id);
