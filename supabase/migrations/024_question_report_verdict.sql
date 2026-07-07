-- Close the question-report loop: when a learner flags a question, a second
-- model blind-answers it and the verdict is stored on the report so bad
-- answer keys are identifiable (and removed from the learner's review queue).

ALTER TABLE question_reports
  -- 'agrees'    = checker reproduced the stored key (report likely about wording)
  -- 'disagrees' = checker picked a different answer (key itself is suspect)
  -- 'unverified'= couldn't check (non-MCQ, provider down, gate disabled)
  ADD COLUMN IF NOT EXISTS ai_verdict TEXT
    CHECK (ai_verdict IN ('agrees', 'disagrees', 'unverified')),
  ADD COLUMN IF NOT EXISTS verified_at TIMESTAMPTZ;

-- For querying "reports where the AI thinks the question really is wrong".
CREATE INDEX IF NOT EXISTS question_reports_verdict_idx
  ON question_reports (ai_verdict, created_at DESC);
