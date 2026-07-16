-- Teams/business plan: seat-based org subscription + team focus exam.
--
-- plan 'team' is org-level (Paddle quantity = seats); members of an entitled
-- org inherit Pro limits at entitlement-resolution time (no profile writes).
ALTER TABLE organizations
  ADD COLUMN IF NOT EXISTS plan TEXT NOT NULL DEFAULT 'none'
    CHECK (plan IN ('none', 'team')),
  ADD COLUMN IF NOT EXISTS seats INTEGER,
  ADD COLUMN IF NOT EXISTS paddle_subscription_id TEXT,
  ADD COLUMN IF NOT EXISTS paddle_customer_id TEXT,
  ADD COLUMN IF NOT EXISTS subscription_status TEXT,
  -- Webhook ordering guard, mirrors profiles.plan_event_at.
  ADD COLUMN IF NOT EXISTS plan_event_at TIMESTAMPTZ,
  -- Team focus exam: when set, member progress on /team is scoped to it.
  ADD COLUMN IF NOT EXISTS target_exam_code TEXT,
  ADD COLUMN IF NOT EXISTS target_exam TEXT;

-- Webhooks look orgs up by subscription id.
CREATE INDEX IF NOT EXISTS organizations_paddle_subscription_idx
  ON organizations (paddle_subscription_id)
  WHERE paddle_subscription_id IS NOT NULL;
