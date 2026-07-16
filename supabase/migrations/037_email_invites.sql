-- Email invites: record who an invite was addressed to. NULL = shareable
-- link invite. Delivery-only — joining still just needs the token, so the
-- trust model matches link invites.
ALTER TABLE organization_invites
  ADD COLUMN IF NOT EXISTS email TEXT;
