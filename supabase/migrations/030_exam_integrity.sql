-- Exam integrity foundation:
-- 1. Allow command_input question type (allocator/grader already support it,
--    but the CHECK constraint from 013 rejects inserts).
-- 2. Server-anchored exam clock so a mock exam can be resumed with the real
--    remaining time after a reload or crash.
-- 3. Cached AI examiner debrief, generated once per completed exam session.

alter table questions drop constraint if exists questions_question_type_check;
alter table questions add constraint questions_question_type_check
  check (question_type in ('mcq','drag_match','drag_order','drag_categorize','select_grid','command_input'));

alter table sessions add column if not exists exam_started_at timestamptz;
alter table sessions add column if not exists debrief jsonb;
