-- Track incremental question generation for early session start
ALTER TABLE sessions
  ADD COLUMN IF NOT EXISTS expected_question_count INTEGER NOT NULL DEFAULT 0;

ALTER TABLE sessions
  ADD COLUMN IF NOT EXISTS generation_status TEXT NOT NULL DEFAULT 'complete';

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conrelid = 'sessions'::regclass
      AND conname = 'sessions_generation_status_check'
  ) THEN
    ALTER TABLE sessions
      ADD CONSTRAINT sessions_generation_status_check
      CHECK (generation_status IN ('generating', 'complete', 'failed'));
  END IF;
END $$;
