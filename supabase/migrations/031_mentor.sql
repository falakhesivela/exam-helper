-- Mentor: persisted AI chat threads, grounded in the learner's exam blueprint,
-- uploaded syllabus and mastery data.
--
-- Note: the `mentor_messages` TABLE below and the `mentor_messages` string used
-- as a usage_counters.counter value are unrelated namespaces. The quota needs no
-- schema change (usage_counters.counter is unconstrained TEXT, migration 023);
-- this migration only stores the conversations.
CREATE TABLE IF NOT EXISTS mentor_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles (id) ON DELETE CASCADE,
  -- Pinned at creation so grounding never shifts under the user when they
  -- switch active exam mid-thread. NULL = custom exam with no blueprint.
  exam_code TEXT,
  title TEXT NOT NULL DEFAULT 'New conversation',
  message_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS mentor_conversations_user_idx
  ON mentor_conversations (user_id, updated_at DESC);

CREATE TABLE IF NOT EXISTS mentor_messages (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  conversation_id UUID NOT NULL REFERENCES mentor_conversations (id) ON DELETE CASCADE,
  -- Denormalized so RLS stays a single-table predicate (no join per row).
  user_id UUID NOT NULL REFERENCES profiles (id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS mentor_messages_conversation_idx
  ON mentor_messages (conversation_id, created_at);

ALTER TABLE mentor_conversations ENABLE ROW LEVEL SECURITY;

CREATE POLICY mentor_conversations_select_own ON mentor_conversations
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY mentor_conversations_insert_own ON mentor_conversations
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY mentor_conversations_update_own ON mentor_conversations
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY mentor_conversations_delete_own ON mentor_conversations
  FOR DELETE USING (auth.uid() = user_id);

ALTER TABLE mentor_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY mentor_messages_select_own ON mentor_messages
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY mentor_messages_insert_own ON mentor_messages
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY mentor_messages_update_own ON mentor_messages
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY mentor_messages_delete_own ON mentor_messages
  FOR DELETE USING (auth.uid() = user_id);
