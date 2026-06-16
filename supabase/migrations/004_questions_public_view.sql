-- Public question view: omits answer columns for safe client reads

CREATE OR REPLACE VIEW questions_public AS
SELECT
  id,
  session_id,
  topic,
  difficulty,
  multi_select,
  prompt,
  options,
  "references",
  position
FROM questions;

-- Grant access to authenticated users (RLS on underlying table still applies)
GRANT SELECT ON questions_public TO authenticated;
