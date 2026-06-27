-- Allow the select_grid (Azure-style Yes/No statement grid) question type.
ALTER TABLE questions
  DROP CONSTRAINT IF EXISTS questions_question_type_check;

ALTER TABLE questions
  ADD CONSTRAINT questions_question_type_check
  CHECK (question_type IN (
    'mcq', 'drag_match', 'drag_order', 'drag_categorize', 'select_grid'
  ));
