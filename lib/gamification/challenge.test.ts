import { test } from "node:test"
import assert from "node:assert/strict"
import { challengeStreak } from "./challenge.ts"

test("streak counts consecutive days ending today", () => {
  const done = ["2026-07-30", "2026-07-31", "2026-08-01"]
  assert.equal(challengeStreak(done, "2026-08-01"), 3)
})

test("streak survives when today is not yet played", () => {
  const done = ["2026-07-30", "2026-07-31"]
  assert.equal(challengeStreak(done, "2026-08-01"), 2)
})

test("a gap breaks the streak", () => {
  const done = ["2026-07-28", "2026-07-29", "2026-07-31"]
  assert.equal(challengeStreak(done, "2026-08-01"), 1)
  assert.equal(challengeStreak([], "2026-08-01"), 0)
  assert.equal(challengeStreak(["2026-07-20"], "2026-08-01"), 0)
})
