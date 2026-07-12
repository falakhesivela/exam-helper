import { test } from "node:test"
import assert from "node:assert/strict"
import {
  buildMentorFollowUpActions,
  buildMentorSuggestions,
} from "./suggestions.ts"
import type { DomainReadiness, Readiness } from "@/lib/progress/readiness"

function domain(
  name: string,
  mastery: number,
  weightPercent = 20,
): DomainReadiness {
  return {
    id: name.toLowerCase().replace(/\s+/g, "-"),
    name,
    weightPercent,
    mastery,
    questionsAnswered: 10,
  }
}

function readiness(weakestDomains: DomainReadiness[], score = 55): Readiness {
  return {
    examCode: "SAA-C03",
    exam: "AWS Solutions Architect Associate",
    passMark: 72,
    score,
    verdict: "not-ready",
    confidence: "low",
    totalAnswered: 40,
    domainsCovered: 2,
    totalDomains: 4,
    domains: weakestDomains,
    weakestDomains,
    mockExamQuestions: 0,
  } as Readiness
}

test("falls back to generic chips with no readiness data", () => {
  const out = buildMentorSuggestions(null)
  assert.equal(out.length, 3)
  assert.ok(out.every((s) => s.focusDomain === undefined))
  assert.equal(out[0].label, "Where do I start?")
})

test("names the learner's weakest domain and offers to quiz it", () => {
  const out = buildMentorSuggestions(readiness([domain("Networking", 41, 26)]))

  const explain = out.find((s) => s.label === "Explain Networking")
  assert.ok(explain, "expected an explain chip for the weak domain")
  assert.match(explain.prompt, /41% mastery/)
  assert.match(explain.prompt, /26% of the exam/)

  const quiz = out.find((s) => s.label === "Quiz me on Networking")
  assert.ok(quiz, "expected a quiz chip")
  // Carries the domain so the caller launches real, graded practice rather
  // than asking the model to invent questions in chat.
  assert.equal(quiz.focusDomain, "Networking")
})

test("ignores domains the learner is already strong in", () => {
  const out = buildMentorSuggestions(readiness([domain("Security", 92)]))
  assert.ok(!out.some((s) => s.label.includes("Security")))
  assert.ok(out.some((s) => s.label === "Am I ready?"))
})

test("respects the limit", () => {
  const out = buildMentorSuggestions(
    readiness([domain("Networking", 41), domain("Storage", 50), domain("IAM", 33)]),
    4,
  )
  assert.equal(out.length, 4)
})

test("adds a deadline-aware prompt when the exam is close", () => {
  const out = buildMentorSuggestions(readiness([], 68), 5, { daysToExam: 9 })
  assert.ok(out.some((suggestion) => suggestion.label === "Plan my final 9 days"))
})

test("builds product actions from the relevant weak domain", () => {
  const state = readiness([
    domain("Networking", 41, 26),
    domain("Security", 48, 30),
  ])
  const out = buildMentorFollowUpActions(
    state,
    "Security questions often hinge on least privilege.",
    { daysToExam: 20 },
  )

  assert.deepEqual(out[0], {
    type: "practice",
    label: "Practice Security",
    domainName: "Security",
  })
  assert.ok(out.some((action) => action.type === "plan"))
  assert.ok(out.some((action) => action.type === "prompt"))
})
