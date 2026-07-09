-- Scope syllabus uploads to an exam so grounding text never bleeds across
-- exams (multi-exam users), and keep the original filename for a manageable
-- uploads list in the UI. Existing rows keep NULL exam_code (legacy fallback).
ALTER TABLE uploads
  ADD COLUMN IF NOT EXISTS exam_code TEXT,
  ADD COLUMN IF NOT EXISTS file_name TEXT;

CREATE INDEX IF NOT EXISTS uploads_user_exam_idx
  ON uploads (user_id, exam_code, created_at DESC);
