-- Drag-and-drop question support for exam simulation

ALTER TABLE questions
  ADD COLUMN IF NOT EXISTS question_type TEXT NOT NULL DEFAULT 'mcq'
    CHECK (question_type IN ('mcq', 'drag_match', 'drag_order', 'drag_categorize'));

ALTER TABLE questions
  ADD COLUMN IF NOT EXISTS drag_data JSONB;

ALTER TABLE answers
  ADD COLUMN IF NOT EXISTS drag_answer JSONB;
