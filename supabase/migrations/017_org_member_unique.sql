-- A user may belong to at most one organization. Without this, a double-submit
-- of "create team" / "join team" can race past the in-code membership check and
-- insert two membership rows, after which getMembership()'s .maybeSingle() errors
-- on every read and the user can no longer load their team.
ALTER TABLE organization_members
  ADD CONSTRAINT organization_members_user_unique UNIQUE (user_id);
