import { test } from "node:test"
import assert from "node:assert/strict"
import { levelFromXp, levelProgress, xpForLevel } from "./xp.ts"

test("level thresholds follow 50·n·(n−1)", () => {
  assert.equal(xpForLevel(1), 0)
  assert.equal(xpForLevel(2), 100)
  assert.equal(xpForLevel(3), 300)
  assert.equal(xpForLevel(5), 1000)
  assert.equal(xpForLevel(10), 4500)
  assert.equal(xpForLevel(20), 19000)
})

test("levelFromXp inverts xpForLevel at boundaries", () => {
  assert.equal(levelFromXp(0), 1)
  assert.equal(levelFromXp(99), 1)
  assert.equal(levelFromXp(100), 2)
  assert.equal(levelFromXp(299), 2)
  assert.equal(levelFromXp(300), 3)
  assert.equal(levelFromXp(4500), 10)
  assert.equal(levelFromXp(4499), 9)
  // Round-trip every level up to 60 (curve stays consistent).
  for (let n = 1; n <= 60; n++) {
    assert.equal(levelFromXp(xpForLevel(n)), n)
    assert.equal(levelFromXp(xpForLevel(n + 1) - 1), n)
  }
})

test("levelProgress reports position within the level", () => {
  const p = levelProgress(150)
  assert.equal(p.level, 2)
  assert.equal(p.intoLevel, 50)
  assert.equal(p.forNext, 200) // L3 needs 300 total, L2 starts at 100
  assert.equal(p.pct, 25)
  assert.equal(levelProgress(0).level, 1)
  assert.equal(levelProgress(-5).level, 1)
})
