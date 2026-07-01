-- Tracks whether the "Welcome to Pro" email has been sent, so the Paddle
-- webhook only sends it once even when subscription.* events fire repeatedly
-- (activation, updates, webhook retries).

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS pro_welcome_sent_at TIMESTAMPTZ;
