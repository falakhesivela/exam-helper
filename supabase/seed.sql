-- Seed demo data for Jordan Avery (SAA-C03)
-- Run after migrations. Creates auth user + profile + sessions + mastery.
-- Password for demo user: demo-password-123 (change in production)

-- Note: In local Supabase, run via `supabase db reset` or apply manually.
-- This seed uses a fixed UUID for reproducibility.

DO $$
DECLARE
  demo_user_id UUID := 'a0000000-0000-4000-8000-000000000001';
  session_1 UUID := 'b0000000-0000-4000-8000-000000000001';
  session_2 UUID := 'b0000000-0000-4000-8000-000000000002';
BEGIN
  -- Insert auth user (Supabase local only — adjust for remote)
  INSERT INTO auth.users (
    id,
    instance_id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    confirmation_token,
    recovery_token,
    email_change_token_new,
    email_change,
    raw_user_meta_data,
    created_at,
    updated_at
  ) VALUES (
    demo_user_id,
    '00000000-0000-0000-0000-000000000000',
    'authenticated',
    'authenticated',
    'jordan@certforge.app',
    crypt('demo-password-123', gen_salt('bf')),
    now(),
    '',
    '',
    '',
    '',
    '',
    '{"name": "Jordan Avery"}'::jsonb,
    now() - interval '30 days',
    now()
  ) ON CONFLICT (id) DO NOTHING;

  INSERT INTO auth.identities (
    id,
    user_id,
    identity_data,
    provider,
    provider_id,
    last_sign_in_at,
    created_at,
    updated_at
  ) VALUES (
    demo_user_id,
    demo_user_id,
    format('{"sub":"%s","email":"jordan@certforge.app"}', demo_user_id)::jsonb,
    'email',
    demo_user_id::text,
    now(),
    now() - interval '30 days',
    now()
  ) ON CONFLICT DO NOTHING;

  -- Profile (trigger may have created it; upsert)
  INSERT INTO profiles (id, name, email, plan, daily_limit, streak_days, last_active_date)
  VALUES (demo_user_id, 'Jordan Avery', 'jordan@certforge.app', 'free', 20, 12, CURRENT_DATE)
  ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    streak_days = EXCLUDED.streak_days;

  -- Today's usage
  INSERT INTO daily_usage (user_id, usage_date, questions_used)
  VALUES (demo_user_id, CURRENT_DATE, 8)
  ON CONFLICT (user_id, usage_date) DO UPDATE SET questions_used = 8;

  -- Topic mastery
  INSERT INTO topic_mastery (user_id, topic, mastery, questions_answered) VALUES
    (demo_user_id, 'Networking', 48, 64),
    (demo_user_id, 'Security & Identity', 56, 72),
    (demo_user_id, 'Storage', 81, 90),
    (demo_user_id, 'Compute', 74, 58),
    (demo_user_id, 'Databases', 67, 41),
    (demo_user_id, 'Resilience', 62, 33)
  ON CONFLICT (user_id, topic) DO UPDATE SET
    mastery = EXCLUDED.mastery,
    questions_answered = EXCLUDED.questions_answered;

  -- Completed practice sessions
  INSERT INTO sessions (id, user_id, exam, exam_code, focus_topics, status, mode, current_index, created_at, completed_at)
  VALUES
    (
      session_1,
      demo_user_id,
      'AWS Certified Solutions Architect – Associate',
      'SAA-C03',
      ARRAY['Networking', 'Security & Identity'],
      'completed',
      'practice',
      5,
      now() - interval '1 day',
      now() - interval '1 day' + interval '18 minutes'
    ),
    (
      session_2,
      demo_user_id,
      'AWS Certified Solutions Architect – Associate',
      'SAA-C03',
      ARRAY['Storage', 'Resilience'],
      'completed',
      'practice',
      5,
      now() - interval '3 days',
      now() - interval '3 days' + interval '22 minutes'
    )
  ON CONFLICT (id) DO NOTHING;

  -- Sample questions for session 1
  INSERT INTO questions (id, session_id, topic, difficulty, multi_select, prompt, options, correct_option_ids, explanation, "references", position)
  VALUES
    (
      'c0000000-0000-4000-8000-000000000001',
      session_1,
      'Networking',
      'medium',
      false,
      'A company runs a public-facing web application in a VPC. The security team requires that instances in the private subnet can download OS patches from the internet, but must not be reachable from the internet directly. Which solution meets these requirements?',
      '[{"id":"a","text":"Attach an internet gateway to the private subnet route table."},{"id":"b","text":"Deploy a NAT gateway in a public subnet and route private subnet traffic through it."},{"id":"c","text":"Assign Elastic IP addresses to each private instance."},{"id":"d","text":"Create a VPC peering connection to a shared services VPC."}]'::jsonb,
      ARRAY['b'],
      'A NAT gateway lets instances in a private subnet initiate outbound connections to the internet (for patches, updates) while preventing the internet from initiating inbound connections.',
      '[{"label":"AWS Docs — NAT gateways","url":"https://docs.aws.amazon.com/vpc/latest/userguide/vpc-nat-gateway.html"}]'::jsonb,
      0
    ),
    (
      'c0000000-0000-4000-8000-000000000002',
      session_1,
      'Security & Identity',
      'hard',
      true,
      'You need to grant an application running on an EC2 instance access to an S3 bucket following least-privilege best practices. Which TWO actions should you take?',
      '[{"id":"a","text":"Create an IAM role with a scoped S3 policy and attach it to the instance via an instance profile."},{"id":"b","text":"Store long-lived IAM user access keys in the application''s config file."},{"id":"c","text":"Restrict the policy to the specific bucket and required actions only."},{"id":"d","text":"Grant the role the AdministratorAccess managed policy for simplicity."}]'::jsonb,
      ARRAY['a', 'c'],
      'Best practice is to use an IAM role attached through an instance profile so the application receives temporary, automatically-rotated credentials.',
      '[{"label":"AWS Docs — IAM roles for EC2","url":"https://docs.aws.amazon.com/IAM/latest/UserGuide/id_roles_use_switch-role-ec2.html"}]'::jsonb,
      1
    )
  ON CONFLICT (id) DO NOTHING;

  -- Answers for session 1 (4/5 correct pattern simplified to 2 questions)
  INSERT INTO answers (session_id, question_id, selected_option_ids, is_correct, marked_for_review, skipped, time_spent_sec, answered_at)
  VALUES
    (session_1, 'c0000000-0000-4000-8000-000000000001', ARRAY['b'], true, false, false, 40, now() - interval '1 day'),
    (session_1, 'c0000000-0000-4000-8000-000000000002', ARRAY['a', 'c'], true, false, false, 47, now() - interval '1 day')
  ON CONFLICT DO NOTHING;

END $$;
