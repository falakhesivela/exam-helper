-- CertForge core schema

-- Profiles (1:1 with auth.users)
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users (id) ON DELETE CASCADE,
  name TEXT NOT NULL DEFAULT '',
  email TEXT NOT NULL DEFAULT '',
  plan TEXT NOT NULL DEFAULT 'free' CHECK (plan IN ('free', 'pro')),
  daily_limit INTEGER NOT NULL DEFAULT 20,
  streak_days INTEGER NOT NULL DEFAULT 0,
  last_active_date DATE,
  timezone TEXT NOT NULL DEFAULT 'UTC',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Daily question usage for freemium limits
CREATE TABLE daily_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles (id) ON DELETE CASCADE,
  usage_date DATE NOT NULL,
  questions_used INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, usage_date)
);

CREATE INDEX daily_usage_user_date_idx ON daily_usage (user_id, usage_date);

-- Practice / exam sessions
CREATE TABLE sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles (id) ON DELETE CASCADE,
  exam TEXT NOT NULL,
  exam_code TEXT NOT NULL,
  focus_topics TEXT[] NOT NULL DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'in-progress' CHECK (status IN ('in-progress', 'completed')),
  mode TEXT NOT NULL DEFAULT 'practice' CHECK (mode IN ('practice', 'exam')),
  duration_sec INTEGER,
  time_used_sec INTEGER,
  pass_mark INTEGER,
  current_index INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ
);

CREATE INDEX sessions_user_id_idx ON sessions (user_id);
CREATE INDEX sessions_user_created_idx ON sessions (user_id, created_at DESC);

-- Generated questions (answers hidden from public view)
CREATE TABLE questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES sessions (id) ON DELETE CASCADE,
  topic TEXT NOT NULL,
  difficulty TEXT NOT NULL CHECK (difficulty IN ('easy', 'medium', 'hard')),
  multi_select BOOLEAN NOT NULL DEFAULT false,
  prompt TEXT NOT NULL,
  options JSONB NOT NULL,
  correct_option_ids TEXT[] NOT NULL,
  explanation TEXT NOT NULL DEFAULT '',
  "references" JSONB NOT NULL DEFAULT '[]',
  position INTEGER NOT NULL DEFAULT 0
);

CREATE INDEX questions_session_id_idx ON questions (session_id);

-- Per-question answer records
CREATE TABLE answers (
  session_id UUID NOT NULL REFERENCES sessions (id) ON DELETE CASCADE,
  question_id UUID NOT NULL REFERENCES questions (id) ON DELETE CASCADE,
  selected_option_ids TEXT[] NOT NULL DEFAULT '{}',
  is_correct BOOLEAN NOT NULL DEFAULT false,
  marked_for_review BOOLEAN NOT NULL DEFAULT false,
  skipped BOOLEAN NOT NULL DEFAULT false,
  time_spent_sec INTEGER NOT NULL DEFAULT 0,
  answered_at TIMESTAMPTZ,
  PRIMARY KEY (session_id, question_id)
);

CREATE INDEX answers_session_id_idx ON answers (session_id);

-- Per-topic mastery aggregates
CREATE TABLE topic_mastery (
  user_id UUID NOT NULL REFERENCES profiles (id) ON DELETE CASCADE,
  topic TEXT NOT NULL,
  mastery NUMERIC(5, 2) NOT NULL DEFAULT 0,
  questions_answered INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (user_id, topic)
);

-- Syllabus PDF uploads
CREATE TABLE uploads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles (id) ON DELETE CASCADE,
  storage_path TEXT NOT NULL,
  extracted_text TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX uploads_user_id_idx ON uploads (user_id);
