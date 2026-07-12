import assert from "node:assert/strict"
import { test } from "node:test"
import { mentorSeedHref } from "./seed.ts"

test("mentorSeedHref truncates very long seeds for URL fallback", () => {
  const long = "a".repeat(300)
  const href = mentorSeedHref(long)
  const seed = decodeURIComponent(href.split("seed=")[1] ?? "")
  assert.ok(seed.length <= 240)
  assert.ok(seed.endsWith("…"))
})

test("mentorSeedHref keeps short seeds intact", () => {
  const href = mentorSeedHref("Explain VPC peering")
  assert.equal(href, "/mentor/new?seed=Explain%20VPC%20peering")
})
