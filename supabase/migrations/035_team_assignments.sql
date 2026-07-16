-- Team assignments: an owner/admin assigns one of their generated mock exams
-- to the whole team. The question set is snapshotted onto the assignment so
-- every member takes the identical exam; each attempt is a normal session
-- (runner/autosave/grading/history all unchanged) linked via assignment_id.
CREATE TABLE IF NOT EXISTS team_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations (id) ON DELETE CASCADE,
  created_by UUID NOT NULL REFERENCES profiles (id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  exam TEXT NOT NULL,
  exam_code TEXT NOT NULL,
  duration_sec INTEGER,
  pass_mark INTEGER,
  question_count INTEGER NOT NULL,
  -- Ordered question rows copied from the source session (answers included —
  -- served only through the service-role API, which strips them mid-exam).
  questions JSONB NOT NULL,
  due_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS team_assignments_org_idx
  ON team_assignments (org_id, created_at DESC);

ALTER TABLE team_assignments ENABLE ROW LEVEL SECURITY;

ALTER TABLE sessions
  ADD COLUMN IF NOT EXISTS assignment_id UUID REFERENCES team_assignments (id) ON DELETE SET NULL;

-- One attempt per member per assignment; also serves the results lookup.
CREATE UNIQUE INDEX IF NOT EXISTS sessions_user_assignment_uniq
  ON sessions (user_id, assignment_id)
  WHERE assignment_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS sessions_assignment_idx
  ON sessions (assignment_id)
  WHERE assignment_id IS NOT NULL;
