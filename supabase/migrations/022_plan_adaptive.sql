-- Adaptive study plans: scheduling preferences + rebalance bookkeeping,
-- and session→plan-task linkage so tasks complete when the session does.

ALTER TABLE study_plans
  ADD COLUMN IF NOT EXISTS start_date DATE,
  -- UTC weekdays with no scheduled tasks (0=Sun .. 6=Sat).
  ADD COLUMN IF NOT EXISTS rest_days SMALLINT[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS effort TEXT NOT NULL DEFAULT 'standard'
    CHECK (effort IN ('light', 'standard', 'intense')),
  -- Last UTC date the overdue-task rebalance ran (max once per day).
  ADD COLUMN IF NOT EXISTS last_rebalanced_on DATE;

-- Backfill: plans have always been created with startDate = server "today".
UPDATE study_plans SET start_date = created_at::date WHERE start_date IS NULL;
ALTER TABLE study_plans ALTER COLUMN start_date SET NOT NULL;

-- A session generated from a plan task; completing the session completes the task.
ALTER TABLE sessions
  ADD COLUMN IF NOT EXISTS plan_task_id UUID REFERENCES study_plan_tasks (id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS sessions_plan_task_idx
  ON sessions (plan_task_id) WHERE plan_task_id IS NOT NULL;
