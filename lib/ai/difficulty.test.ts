import { test } from "node:test"
import assert from "node:assert/strict"
import { difficultyBand, difficultyGuidance } from "./difficulty.ts"

test("bands map mastery to the right difficulty", () => {
  assert.equal(difficultyBand(0), "easier")
  assert.equal(difficultyBand(39), "easier")
  assert.equal(difficultyBand(40), "balanced")
  assert.equal(difficultyBand(69), "balanced")
  assert.equal(difficultyBand(70), "harder")
  assert.equal(difficultyBand(100), "harder")
})

test("guidance text matches the band", () => {
  assert.match(difficultyGuidance(20), /EASIER/)
  assert.match(difficultyGuidance(55), /BALANCED/)
  assert.match(difficultyGuidance(90), /HARDER/)
})
