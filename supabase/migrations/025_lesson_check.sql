-- Knowledge-check results on lesson progress. Passing the check (>=70%)
-- marks the lesson completed; the score is kept for the "4/4 passed" UI.
ALTER TABLE lesson_progress
  ADD COLUMN check_score INT,
  ADD COLUMN check_total INT;
