import { test } from "node:test"
import assert from "node:assert/strict"
import { leagueZones, nextTier, prevTier, weekStartUtc } from "./league.ts"

test("weekStartUtc returns the UTC Monday", () => {
  assert.equal(weekStartUtc("2026-08-01"), "2026-07-27") // Saturday → Monday
  assert.equal(weekStartUtc("2026-07-27"), "2026-07-27") // Monday → itself
  assert.equal(weekStartUtc("2026-08-02"), "2026-07-27") // Sunday → previous Monday
  assert.equal(weekStartUtc("2026-08-03"), "2026-08-03") // next Monday
  assert.equal(weekStartUtc("2026-08-01T23:59:00Z"), "2026-07-27")
})

test("zone sizes scale with cohort size", () => {
  assert.deepEqual(leagueZones(20, "silver"), { promoteCount: 5, demoteCount: 5 })
  assert.deepEqual(leagueZones(12, "silver"), { promoteCount: 5, demoteCount: 5 })
  assert.deepEqual(leagueZones(8, "silver"), { promoteCount: 2, demoteCount: 2 })
  assert.deepEqual(leagueZones(4, "silver"), { promoteCount: 1, demoteCount: 0 })
  assert.deepEqual(leagueZones(1, "silver"), { promoteCount: 0, demoteCount: 0 })
})

test("ladder edges: diamond never promotes, bronze never demotes", () => {
  assert.equal(leagueZones(20, "diamond").promoteCount, 0)
  assert.equal(leagueZones(20, "diamond").demoteCount, 5)
  assert.equal(leagueZones(20, "bronze").demoteCount, 0)
  assert.equal(nextTier("diamond"), "diamond")
  assert.equal(prevTier("bronze"), "bronze")
  assert.equal(nextTier("bronze"), "silver")
  assert.equal(prevTier("gold"), "silver")
})
