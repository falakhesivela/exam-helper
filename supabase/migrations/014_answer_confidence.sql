-- Confidence-based answering: record whether the learner felt sure or unsure
-- when they answered, to surface over-confident misses in the results.
ALTER TABLE answers
  ADD COLUMN IF NOT EXISTS confidence TEXT
    CHECK (confidence IN ('sure', 'unsure'));
