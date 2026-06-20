-- Scenario stem split and blueprint domain id for accurate scorecards

ALTER TABLE questions
  ADD COLUMN IF NOT EXISTS scenario TEXT;

ALTER TABLE questions
  ADD COLUMN IF NOT EXISTS domain_id TEXT;

CREATE INDEX IF NOT EXISTS questions_domain_id_idx ON questions (domain_id)
  WHERE domain_id IS NOT NULL;
