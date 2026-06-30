-- Paddle subscription state on profiles. Plan is flipped to 'pro' by the
-- Paddle webhook when a subscription is active, and back to 'free' on cancel.

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS paddle_customer_id TEXT,
  ADD COLUMN IF NOT EXISTS paddle_subscription_id TEXT,
  ADD COLUMN IF NOT EXISTS subscription_status TEXT;

CREATE INDEX IF NOT EXISTS profiles_paddle_subscription_id_idx
  ON public.profiles (paddle_subscription_id);
