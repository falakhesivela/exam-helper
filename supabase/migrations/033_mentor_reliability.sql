-- Mentor reliability: idempotent sends + database-owned conversation metadata.
--
-- 1. `client_message_id` lets the client retry a send after a network failure
--    without duplicating the user's message: the server looks the id up and
--    either replays the stored reply or resumes generation.
-- 2. A trigger moves message_count / updated_at maintenance into the database,
--    replacing the read-modify-write in app code that could lose counts under
--    concurrent sends.

ALTER TABLE mentor_messages
  ADD COLUMN IF NOT EXISTS client_message_id UUID;

-- One logical send per client id per thread; also the fast path for replay lookups.
CREATE UNIQUE INDEX IF NOT EXISTS mentor_messages_client_id_idx
  ON mentor_messages (user_id, client_message_id)
  WHERE client_message_id IS NOT NULL;

CREATE OR REPLACE FUNCTION public.bump_mentor_conversation()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  UPDATE mentor_conversations
  SET message_count = message_count + 1,
      updated_at = now()
  WHERE id = NEW.conversation_id;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS mentor_messages_bump ON mentor_messages;
CREATE TRIGGER mentor_messages_bump
  AFTER INSERT ON mentor_messages
  FOR EACH ROW
  EXECUTE FUNCTION public.bump_mentor_conversation();

-- Any direct update (rename, etc.) refreshes updated_at without app code
-- having to send a timestamp.
DROP TRIGGER IF EXISTS mentor_conversations_updated_at ON mentor_conversations;
CREATE TRIGGER mentor_conversations_updated_at
  BEFORE UPDATE ON mentor_conversations
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

-- Repair any drift the old read-modify-write bump accumulated.
UPDATE mentor_conversations c
SET message_count = m.actual
FROM (
  SELECT conversation_id, COUNT(*)::int AS actual
  FROM mentor_messages
  GROUP BY conversation_id
) m
WHERE c.id = m.conversation_id
  AND c.message_count IS DISTINCT FROM m.actual;
