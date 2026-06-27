-- Study plans: a dated, task-by-task path to the target readiness score.
CREATE TABLE IF NOT EXISTS study_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles (id) ON DELETE CASCADE,
  exam_code TEXT NOT NULL,
  exam TEXT NOT NULL,
  target_date DATE NOT NULL,
  target_score INTEGER NOT NULL,
  projected_score INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'archived')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- At most one active plan per user + exam.
CREATE UNIQUE INDEX IF NOT EXISTS study_plans_one_active_idx
  ON study_plans (user_id, exam_code)
  WHERE status = 'active';

CREATE INDEX IF NOT EXISTS study_plans_user_idx ON study_plans (user_id);

CREATE TABLE IF NOT EXISTS study_plan_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id UUID NOT NULL REFERENCES study_plans (id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles (id) ON DELETE CASCADE,
  day_index INTEGER NOT NULL,
  scheduled_date DATE NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('practice', 'exam', 'lesson', 'review')),
  domain_id TEXT,
  domain_name TEXT,
  question_count INTEGER NOT NULL DEFAULT 0,
  title TEXT NOT NULL,
  rationale TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'done', 'skipped')),
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS study_plan_tasks_plan_idx
  ON study_plan_tasks (plan_id, day_index);

ALTER TABLE study_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE study_plan_tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY study_plans_select_own ON study_plans
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY study_plans_insert_own ON study_plans
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY study_plans_update_own ON study_plans
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY study_plans_delete_own ON study_plans
  FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY study_plan_tasks_select_own ON study_plan_tasks
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY study_plan_tasks_insert_own ON study_plan_tasks
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY study_plan_tasks_update_own ON study_plan_tasks
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY study_plan_tasks_delete_own ON study_plan_tasks
  FOR DELETE USING (auth.uid() = user_id);
