-- Weekly owner digest: idempotency stamp so the cron trigger can re-run safely.
ALTER TABLE organizations
  ADD COLUMN IF NOT EXISTS digest_sent_at TIMESTAMPTZ;
