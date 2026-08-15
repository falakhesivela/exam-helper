/**
 * Contract tests for the Mentor quick-check parser.
 *
 * Every case comes from ./fixtures/quiz-blocks.json, whose twin lives at
 * prepa-backend/tests/fixtures/quiz_blocks.json and drives the identical suite
 * there (tests/test_quiz_block.py). The server re-derives correctness from the
 * stored message rather than trusting the client, so if these two parsers ever
 * disagree about what a valid quiz is — or about which fence is quizIndex 1 —
 * a card would grade differently from the way it was rendered. One of these
 * fails first instead.
 *
 * The hand-written suite in ./quiz-block.test.ts covers frontend-only concerns
 * (streaming placeholders, markdown segmentation); this one covers only what
 * both sides must agree on.
 */

import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import { dirname, join } from "node:path"
import { describe, it } from "node:test"
import { fileURLToPath } from "node:url"

import { parseMentorContent, parseQuizJson, type MentorQuiz } from "./quiz-block.ts"

interface ParseCase {
  name: string
  raw: string
  valid: boolean
  multiSelect?: boolean
  correctOptionIds?: string[]
  optionCount?: number
  explanation?: string
}

interface GradingCase {
  name: string
  correctOptionIds: string[]
  optionIds: string[]
  selected: string[]
  correct: boolean
}

interface ContentCase {
  name: string
  content: string
  quizValidity: boolean[]
}

const fixturesPath = join(
  dirname(fileURLToPath(import.meta.url)),
  "fixtures",
  "quiz-blocks.json",
)
const fixtures = JSON.parse(readFileSync(fixturesPath, "utf8")) as {
  parseCases: ParseCase[]
  gradingCases: GradingCase[]
  contentCases: ContentCase[]
}

/** The card's grading rule, kept here so the fixture can pin it both sides. */
function isCorrect(quiz: MentorQuiz, selected: string[]): boolean {
  const valid = new Set(quiz.options.map((o) => o.id))
  const picked = new Set(selected.filter((id) => valid.has(id)))
  const correct = new Set(quiz.correctOptionIds)
  return (
    picked.size === correct.size && [...picked].every((id) => correct.has(id))
  )
}

function quizFrom(correctOptionIds: string[], optionIds: string[]): MentorQuiz {
  return {
    question: "Q",
    options: optionIds.map((id) => ({ id, text: id.toUpperCase() })),
    correctOptionIds,
    multiSelect: correctOptionIds.length > 1,
    explanation: "",
  }
}

describe("quiz-block contract: parseQuizJson", () => {
  for (const testCase of fixtures.parseCases) {
    it(testCase.name, () => {
      const quiz = parseQuizJson(testCase.raw)
      if (!testCase.valid) {
        assert.equal(quiz, null)
        return
      }
      assert.ok(quiz, "expected the fixture to parse")
      assert.equal(quiz.multiSelect, testCase.multiSelect)
      assert.deepEqual(quiz.correctOptionIds, testCase.correctOptionIds)
      assert.equal(quiz.options.length, testCase.optionCount)
      assert.equal(quiz.explanation, testCase.explanation)
    })
  }
})

describe("quiz-block contract: grading", () => {
  for (const testCase of fixtures.gradingCases) {
    it(testCase.name, () => {
      const quiz = quizFrom(testCase.correctOptionIds, testCase.optionIds)
      assert.equal(isCorrect(quiz, testCase.selected), testCase.correct)
    })
  }
})

describe("quiz-block contract: fence ordinals", () => {
  for (const testCase of fixtures.contentCases) {
    it(testCase.name, () => {
      const segments = parseMentorContent(testCase.content)
      // Every closed fence, valid or not, paired with the ordinal it claimed.
      const fences: { valid: boolean; quizIndex: number }[] = []
      for (const segment of segments) {
        if (segment.type === "quiz") {
          fences.push({ valid: true, quizIndex: segment.quizIndex })
        } else if (
          segment.type === "invalid-quiz" &&
          segment.quizIndex !== null
        ) {
          fences.push({ valid: false, quizIndex: segment.quizIndex })
        }
      }
      assert.deepEqual(
        fences.map((f) => f.valid),
        testCase.quizValidity,
      )
      // Indexes must be dense and in order, or they won't line up with the
      // server's, which counts closed fences with the same rule.
      assert.deepEqual(
        fences.map((f) => f.quizIndex),
        testCase.quizValidity.map((_, i) => i),
      )
    })
  }

  it("a malformed fence still consumes its index", () => {
    const testCase = fixtures.contentCases.find((c) =>
      c.name.includes("malformed"),
    )
    assert.ok(testCase)
    const segments = parseMentorContent(testCase.content)
    const quizzes = segments.filter((s) => s.type === "quiz")
    assert.equal(quizzes.length, 2)
    assert.equal(quizzes[0].quizIndex, 0)
    // The bad block at index 1 must not shift Q3 down to index 1.
    assert.equal(quizzes[1].quizIndex, 2)
    assert.equal(quizzes[1].quiz.question, "Q3")
  })

  it("an unclosed trailing fence claims no index", () => {
    const testCase = fixtures.contentCases.find((c) =>
      c.name.includes("unclosed"),
    )
    assert.ok(testCase)
    const segments = parseMentorContent(testCase.content)
    const tail = segments.at(-1)
    assert.equal(tail?.type, "invalid-quiz")
    assert.equal(tail.type === "invalid-quiz" ? tail.quizIndex : undefined, null)
  })
})
