import { test } from "node:test"
import assert from "node:assert/strict"
import {
  confidenceBreakdown,
  domainBreakdown,
  paceReport,
  weakestDomains,
} from "./exam-insights.ts"
import type { AnswerRecord, PracticeSession, Question } from "@/types"

function q(id: string, domainId?: string): Question {
  return {
    id,
    topic: `topic-${id}`,
    difficulty: "medium",
    prompt: "p",
    multiSelect: false,
    options: [],
    correctOptionIds: [],
    explanation: "",
    references: [],
    domainId,
  }
}

function a(
  questionId: string,
  overrides: Partial<AnswerRecord> = {},
): AnswerRecord {
  return {
    questionId,
    selectedOptionIds: ["x"],
    isCorrect: false,
    markedForReview: false,
    skipped: false,
    timeSpentSec: 0,
    ...overrides,
  }
}

function session(
  questions: Question[],
  answers: AnswerRecord[],
  durationSec?: number,
): PracticeSession {
  return {
    id: "s1",
    exam: "Test Exam",
    examCode: "TEST-01",
    focusTopics: [],
    createdAt: "2026-01-01T00:00:00Z",
    status: "completed",
    questions,
    answers: Object.fromEntries(answers.map((r) => [r.questionId, r])),
    currentIndex: 0,
    mode: "exam",
    durationSec,
  }
}

test("weakestDomains returns below-pass domains, weakest first, capped", () => {
  const breakdown = [
    { topic: "A", domainId: "a", correct: 9, total: 10, pct: 90 },
    { topic: "B", domainId: "b", correct: 3, total: 10, pct: 30 },
    { topic: "C", domainId: "c", correct: 5, total: 10, pct: 50 },
    { topic: "D", domainId: "d", correct: 6, total: 10, pct: 60 },
  ]
  const weak = weakestDomains(breakdown, 72)
  assert.equal(weak.length, 2)
  assert.equal(weak[0].topic, "B")
  assert.equal(weak[1].topic, "C")
})

test("weakestDomains is empty when every domain clears the pass mark", () => {
  const breakdown = [{ topic: "A", domainId: "a", correct: 8, total: 10, pct: 80 }]
  assert.deepEqual(weakestDomains(breakdown, 72), [])
})

test("paceReport flags rushed-wrong and overtime against the target", () => {
  // 4 questions in 400s → target 100s each.
  const s = session(
    [q("q1"), q("q2"), q("q3"), q("q4")],
    [
      a("q1", { timeSpentSec: 20, isCorrect: false }), // rushed (<40%) and wrong
      a("q2", { timeSpentSec: 20, isCorrect: true }), // fast but right — no flag
      a("q3", { timeSpentSec: 170, isCorrect: true }), // overtime (>160%)
      a("q4", { timeSpentSec: 100, isCorrect: true }),
    ],
    400,
  )
  const report = paceReport(s)
  assert.ok(report)
  assert.equal(report.targetPerQuestion, 100)
  assert.equal(report.rushedWrong, 1)
  assert.equal(report.overtime, 1)
  assert.equal(report.entries.length, 4)
  assert.equal(report.entries[0].flag, "rushed")
  assert.equal(report.entries[1].flag, null)
  assert.equal(report.entries[2].flag, "overtime")
})

test("paceReport returns null without timing data", () => {
  const s = session([q("q1")], [a("q1", { timeSpentSec: 0 })], 600)
  assert.equal(paceReport(s), null)
  const untimed = session([q("q1")], [a("q1", { timeSpentSec: 30 })])
  assert.equal(paceReport(untimed), null)
})

test("paceReport does not flag skipped questions as rushed", () => {
  const s = session(
    [q("q1"), q("q2")],
    [
      a("q1", { timeSpentSec: 10, skipped: true }),
      a("q2", { timeSpentSec: 100, isCorrect: true }),
    ],
    200,
  )
  const report = paceReport(s)
  assert.ok(report)
  assert.equal(report.rushedWrong, 0)
})

test("confidenceBreakdown buckets the four quadrants", () => {
  const s = session(
    [q("q1"), q("q2"), q("q3"), q("q4"), q("q5")],
    [
      a("q1", { confidence: "sure", isCorrect: true }),
      a("q2", { confidence: "sure", isCorrect: false }),
      a("q3", { confidence: "unsure", isCorrect: true }),
      a("q4", { confidence: "unsure", isCorrect: false }),
      a("q5", { isCorrect: true }), // unrated
    ],
    300,
  )
  const c = confidenceBreakdown(s)
  assert.equal(c.rated, 4)
  assert.equal(c.solid, 1)
  assert.equal(c.overconfident, 1)
  assert.equal(c.lucky, 1)
  assert.equal(c.shaky, 1)
})

test("domainBreakdown carries domainId for focused drills", () => {
  const s = session(
    [q("q1", "dom-a"), q("q2", "dom-a"), q("q3")],
    [
      a("q1", { isCorrect: true }),
      a("q2", { isCorrect: false }),
      a("q3", { isCorrect: true }),
    ],
    300,
  )
  const breakdown = domainBreakdown(s)
  const domA = breakdown.find((d) => d.domainId === "dom-a")
  assert.ok(domA)
  assert.equal(domA.correct, 1)
  assert.equal(domA.total, 2)
  const fallback = breakdown.find((d) => d.topic === "topic-q3")
  assert.ok(fallback)
  assert.equal(fallback.domainId, undefined)
})
