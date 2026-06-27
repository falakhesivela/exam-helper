import { test } from "node:test"
import assert from "node:assert/strict"
import { isOfficialUrl, officialDomainGuidance } from "./citations.ts"

test("accepts official provider domains and subdomains", () => {
  assert.equal(isOfficialUrl("https://docs.aws.amazon.com/s3/", "aws"), true)
  assert.equal(isOfficialUrl("https://aws.amazon.com/ec2/", "aws"), true)
  assert.equal(isOfficialUrl("https://learn.microsoft.com/azure/", "azure"), true)
  assert.equal(isOfficialUrl("https://cloud.google.com/run", "gcp"), true)
})

test("rejects non-official / hallucinated domains", () => {
  assert.equal(isOfficialUrl("https://medium.com/some-post", "aws"), false)
  assert.equal(isOfficialUrl("https://learn.microsoft.com/azure/", "aws"), false)
  assert.equal(isOfficialUrl("not a url", "aws"), false)
})

test("custom provider has no domain restriction", () => {
  assert.equal(isOfficialUrl("https://anything.example.com", "custom"), true)
})

test("guidance lists domains for known providers, generic otherwise", () => {
  assert.match(officialDomainGuidance("aws"), /docs\.aws\.amazon\.com/)
  assert.match(officialDomainGuidance(), /official/i)
  assert.doesNotMatch(officialDomainGuidance("custom"), /docs\.aws/)
})
