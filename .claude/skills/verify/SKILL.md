---
name: verify
description: Build, launch, and drive this Next.js app to verify UI changes end-to-end in mock mode.
---

# Verifying certforge-ai-exam-app changes

## Launch (mock mode — no backend, no login)

`NEXT_PUBLIC_USE_MOCKS=true` bypasses auth (`requireAuthUser` returns "mock-user")
and pre-populates the zustand store from `lib/mock-data.ts` (profile Jordan/free,
SAA-C03 active, sessions incl. 2 completed mocks with confidence ratings, streak,
plan, readiness trend).

The user usually has `npm run dev` running on :3000 — Next 16 refuses a second
dev server in the same dir. Don't kill it; use a prod build on another port:

```bash
NEXT_PUBLIC_USE_MOCKS=true npx next build     # ignoreBuildErrors:true — passes despite pre-existing TS errors in lib/ai/validator.ts
NEXT_PUBLIC_USE_MOCKS=true npx next start -p 4123 &   # run in background
```

Env vars are inlined at build time — rebuild after changing mock data.

## Drive

Playwright 1.61 lives in the npx cache, not node_modules. Import it by absolute path
in a .mjs script:

```js
import { chromium } from "/home/fsivela/.npm/_npx/705bc6b22212b352/node_modules/playwright/index.mjs"
```

Browsers are installed (`~/.cache/ms-playwright/chromium-1228`). Go to
`http://localhost:4123/dashboard`, `waitUntil: "networkidle"` + ~2s settle
(client store hydration). Useful checks: `page.getByText(...)` per widget,
`document.documentElement.scrollWidth - clientWidth` for horizontal overflow
(also at 375×812), collect `pageerror`/console errors, full-page screenshot.

## Gotchas

- The shell aliases `cat` → `bat` (not installed): heredocs with `cat` fail; use the Write tool.
- `npm run lint` fails: eslint not installed. `npx tsc --noEmit` works but has pre-existing errors confined to `lib/ai/validator.ts`.
- In mock mode `hydrate()` no-ops, so `hydrated` stays false forever — gate mock-visible UI on `dataReady` (true in mocks), never on `hydrated`.
- Mock store state in `lib/store/use-session-store.ts` lines ~264-278; fixtures in `lib/mock-data.ts` (note: `DEFAULT_EXAM` is declared *below* `mockHistory` — TDZ if referenced there).
- The exam/practice *launch* flows (`/exam` config cards, intake) stream generation over SSE to the backend, which mock mode doesn't run — clicking "Start" hangs. Drive runners against seeded sessions directly: `/exam/e-1001` (90-min mock, no `examStartedAt`, so rules → start works offline); practice sessions `s-1000`/`s-1001`.
- Mock-data exclusion: non-mock builds alias `@/lib/mock-data` → `lib/mock-data.stub.ts` (turbopack.resolveAlias in next.config.mjs). New exports in mock-data that get imported elsewhere must be added to the stub or non-mock builds fail.
