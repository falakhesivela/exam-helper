import { test } from "node:test"
import assert from "node:assert/strict"
import {
  buildActivityRow,
  isStreakAtRisk,
  milestoneReached,
  practicedToday,
} from "./status.ts"

test("at risk only when last active was yesterday", () => {
  assert.equal(isStreakAtRisk("2026-06-26", "2026-06-27"), true)
  assert.equal(isStreakAtRisk("2026-06-27", "2026-06-27"), false) // today
  assert.equal(isStreakAtRisk("2026-06-24", "2026-06-27"), false) // already broken
  assert.equal(isStreakAtRisk(null, "2026-06-27"), false)
})

test("practicedToday reflects same-day activity", () => {
  assert.equal(practicedToday("2026-06-27", "2026-06-27"), true)
  assert.equal(practicedToday("2026-06-26", "2026-06-27"), false)
  assert.equal(practicedToday(null, "2026-06-27"), false)
})

test("milestoneReached fires once when crossing a threshold", () => {
  assert.equal(milestoneReached(2, 3), 3)
  assert.equal(milestoneReached(6, 7), 7)
  assert.equal(milestoneReached(3, 4), null) // no milestone between 3 and 7
  assert.equal(milestoneReached(7, 7), null) // no increase
  assert.equal(milestoneReached(7, 3), null) // reset, not a crossing
})

test("activity row is 7 days oldest→newest with goal flags", () => {
  const usage = { "2026-06-25": 12, "2026-06-26": 4, "2026-06-27": 10 }
  const row = buildActivityRow(usage, 10, "2026-06-27")
  assert.equal(row.length, 7)
  assert.equal(row[0].date, "2026-06-21")
  assert.equal(row[6].date, "2026-06-27")
  assert.equal(row[6].goalMet, true) // 10 >= 10
  const jun26 = row.find((d) => d.date === "2026-06-26")
  assert.equal(jun26?.count, 4)
  assert.equal(jun26?.goalMet, false)
  const empty = row.find((d) => d.date === "2026-06-22")
  assert.equal(empty?.count, 0)
})
