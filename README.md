# Prepa

AI-powered certification exam prep. Describe your exam, get tailored multiple-choice questions, practice with instant feedback or sit timed mock exams, and track mastery over time.

## Stack

- **Frontend:** Next.js 16 (App Router), React 19, TypeScript, Zustand, Tailwind
- **Backend:** Next.js Route Handlers (Node runtime) + Supabase (Postgres, Auth, Storage, RLS)

## Prerequisites

- Node.js 20+
- A [Supabase](https://supabase.com) project
- API keys for [xAI](https://x.ai/api) (Grok) and/or [OpenAI](https://platform.openai.com) (fallback)

## Setup

### 1. Clone and install

```bash
cd certforge-ai-exam-app
npm install
```

### 2. Configure environment

```bash
cp .env.example .env.local
```

Fill in your Supabase URL, publishable key, secret key (or legacy service role key), and AI API keys.

### 3. Supabase database

Apply migrations in order from `supabase/migrations/`:

1. `001_schema.sql` — core tables
2. `002_rls.sql` — row-level security policies
3. `002_session_generation.sql` — session generation status columns
4. `003_triggers.sql` — profile auto-create on signup
5. `004_questions_public_view.sql` — safe question view (no answers)
6. `005_storage.sql` — PDF uploads bucket
7. `006_learning.sql` — learn lessons and progress tables
8. `006_question_drag.sql` — drag-and-drop question types (`question_type`, `drag_data`, `drag_answer`)
9. `007_fix_seed_auth_users.sql` — seed user auth fix (optional, with `seed.sql`)
10. `008_question_stem_domain.sql` — scenario stems and `domain_id` for scorecards
11. `009_review_schedule.sql` — spaced repetition schedule for missed questions
12. `010_readiness_snapshots.sql` — daily exam-readiness score snapshots for the readiness trend
13. `011_study_plans.sql` — study plans and per-day tasks for the study-plan generator
14. `012_streaks.sql` — `longest_streak` and `daily_goal` columns for streak mechanics
15. `013_select_grid.sql` — allows the `select_grid` (Yes/No statement grid) question type
16. `014_answer_confidence.sql` — per-answer `confidence` (sure/unsure) for confidence-based answering
17. `015_question_bookmarks.sql` — saved/bookmarked questions per user
18. `016_organizations.sql` — teams/orgs, members, and invite links

**Supabase CLI (recommended):**

```bash
npx supabase link --project-ref <your-project-ref>
npx supabase db push
```

**SQL Editor:** paste each migration file into the Supabase SQL editor and run.

Optional demo seed (`supabase/seed.sql`) creates user **jordan@certforge.app** with sample SAA-C03 history. Password: `demo-password-123`. If login fails with “Database error querying schema”, run `007_fix_seed_auth_users.sql`.

### 3b. Auth for local development

Free-tier Supabase projects limit how many auth emails can be sent per hour. For dev, disable confirmation emails:

1. Supabase Dashboard → **Authentication** → **Providers** → **Email**
2. Turn **off** “Confirm email”
3. Save

Sign-ups will work immediately without sending mail. Re-enable confirmation before production.

If you see `email rate limit exceeded`, wait ~1 hour or use the setting above.

### 4. Run locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Mock mode (no backend)

For UI-only development without Supabase:

```bash
NEXT_PUBLIC_USE_MOCKS=true npm run dev
```

## Architecture

| Layer | Responsibility |
|-------|----------------|
| Browser (`@supabase/ssr` anon client) | Auth session, RLS-protected reads |
| Route handlers (`app/api/**`) | AI generation, grading, freemium limits, trusted writes |
| Service role (server-only) | Persist questions with correct answers; grade server-side |

Correct answers and explanations are **never** sent to the client until practice reveal or exam submit.

## API overview

| Endpoint | Purpose |
|----------|---------|
| `GET /api/me` | User profile + today's usage |
| `POST /api/intake/clarify` | AI clarifying questions |
| `POST /api/intake/generate` | Generate practice session |
| `POST /api/uploads` | Syllabus PDF upload + text extraction |
| `POST /api/exams` | Start timed mock exam (presets, custom grounding, weak-area focus) |
| `GET /api/sessions` | Session history |
| `PATCH /api/sessions/:id/answer` | Grade practice answer (server-side) |
| `POST /api/sessions/:id/submit` | Submit & grade exam |
| `GET /api/progress/*` | Mastery, trend, summary |

## Deploy (Vercel)

1. Import the repo as a Vercel project.
2. Add all env vars from `.env.example`.
3. Deploy — API routes and frontend ship as one app.

## Exam simulation

Timed mock exams support **11 certification presets** (AWS, Azure, GCP, CompTIA, Cisco, ISC2) with domain-weighted AI generation, drag-and-drop items on selected certs, scenario stems, and domain scorecards.

- **Custom exams:** exam name, optional code (recognizes presets like `SAA-C03`), domains/topics, syllabus PDF, and free-text context
- **Weak-area exams:** dashboard shortcut focuses generation on low-mastery blueprint domains
- **Keyboard shortcuts in exam mode:** Alt+N / Alt+P / Alt+F

## Freemium

- Free plan: 20 questions/day (configurable per profile `daily_limit`)
- Pro plan: unlimited
- Usage resets at user-local midnight (`X-Timezone` header)

## Subscriptions & billing

Pro is billed through **Paddle Billing** (Paddle is the Merchant of Record, so
Paddle issues the tax-compliant invoice/receipt). Checkout runs client-side
(`lib/paddle.ts`); the webhook keeps `profiles.plan` in sync; the billing screen
(`/profile/billing`) reads live subscription state and cancels via the Paddle
API (`lib/paddle-api.ts`); the public `/checkout` page initialises Paddle.js so
Paddle-generated payment links (`?_ptxn=…`) auto-open the overlay.

**Paddle dashboard setup:**

1. **Catalog → Products/Prices** — create the Pro price; put its id in
   `NEXT_PUBLIC_PADDLE_PRO_PRICE_ID`.
2. **Developer tools → Authentication** — copy the client-side token into
   `NEXT_PUBLIC_PADDLE_CLIENT_TOKEN`, and an API key into `PADDLE_API_KEY`
   (used for subscription lookups + cancellation).
3. **Developer tools → Notifications** — add a destination pointing at
   `https://<your-domain>/api/paddle/webhook`, subscribe to the
   `subscription.*` events, and copy its signing secret into
   `PADDLE_WEBHOOK_SECRET`.
4. **Checkout → Checkout settings → Default payment link** — set to
   `https://<your-domain>/checkout` (use `http://localhost:3000/checkout` in
   sandbox). Required: Paddle refuses to open any checkout without it
   (`transaction_default_checkout_url_not_set`). The `/checkout` page loads
   Paddle.js so failed-payment recovery / invoice links resume automatically.
5. **Receipts are automatic** — Paddle emails customers a receipt + PDF invoice
   on every completed transaction (checkout and renewals) by default; there's
   no toggle to enable. Just set your business name, logo, and support email in
   the dashboard so receipts are branded, and verify a sandbox purchase under
   **Transactions → order → Order History**. This is the compliant
   proof-of-payment, separate from the app's welcome email below.
6. Set `NEXT_PUBLIC_PADDLE_ENV` to `sandbox` or `production`.

> The shared Paddle account tags checkouts with `custom_data.app = "prepa"`;
> the webhook ignores events without that tag.

**Welcome email (Resend):** on first Pro activation the webhook sends a branded
onboarding email via `lib/email.ts`. Set `RESEND_API_KEY`, `EMAIL_FROM` (a
**verified sending domain** — the `resend.dev` fallback is test-only), and
`NEXT_PUBLIC_APP_URL` for correct links. Sends are skipped (logged) when
unset, so billing still works without email configured. Dedupe is handled by
`profiles.pro_welcome_sent_at`.

## License

Private — all rights reserved.
