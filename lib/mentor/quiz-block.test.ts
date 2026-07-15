import assert from "node:assert/strict"
import { describe, it } from "node:test"

import { parseMentorContent, parseQuizJson } from "./quiz-block.ts"

const VALID_QUIZ = JSON.stringify({
  question: "Which subnet type routes to an internet gateway?",
  options: [
    { id: "a", text: "Public subnet" },
    { id: "b", text: "Private subnet" },
    { id: "c", text: "Isolated subnet" },
  ],
  correctOptionIds: ["a"],
  explanation: "Public subnets have a route to the internet gateway.",
})

function quizFence(json: string): string {
  return "```quiz\n" + json + "\n```"
}

describe("parseQuizJson", () => {
  it("accepts a valid single-answer quiz", () => {
    const quiz = parseQuizJson(VALID_QUIZ)
    assert.ok(quiz)
    assert.equal(quiz.multiSelect, false)
    assert.equal(quiz.options.length, 3)
    assert.deepEqual(quiz.correctOptionIds, ["a"])
  })

  it("derives multiSelect from multiple correct ids", () => {
    const quiz = parseQuizJson(
      JSON.stringify({
        question: "Pick two AZ-resilient services.",
        options: [
          { id: "a", text: "One" },
          { id: "b", text: "Two" },
          { id: "c", text: "Three" },
        ],
        correctOptionIds: ["a", "b"],
        explanation: "",
      }),
    )
    assert.ok(quiz)
    assert.equal(quiz.multiSelect, true)
  })

  it("rejects malformed payloads", () => {
    assert.equal(parseQuizJson("not json"), null)
    assert.equal(parseQuizJson("[]"), null)
    // missing question
    assert.equal(
      parseQuizJson(
        JSON.stringify({ options: [{ id: "a", text: "x" }, { id: "b", text: "y" }], correctOptionIds: ["a"] }),
      ),
      null,
    )
    // correct id not among options
    assert.equal(
      parseQuizJson(
        JSON.stringify({
          question: "q",
          options: [
            { id: "a", text: "x" },
            { id: "b", text: "y" },
          ],
          correctOptionIds: ["z"],
        }),
      ),
      null,
    )
    // duplicate option ids
    assert.equal(
      parseQuizJson(
        JSON.stringify({
          question: "q",
          options: [
            { id: "a", text: "x" },
            { id: "a", text: "y" },
          ],
          correctOptionIds: ["a"],
        }),
      ),
      null,
    )
    // all options correct
    assert.equal(
      parseQuizJson(
        JSON.stringify({
          question: "q",
          options: [
            { id: "a", text: "x" },
            { id: "b", text: "y" },
          ],
          correctOptionIds: ["a", "b"],
        }),
      ),
      null,
    )
    // too few options
    assert.equal(
      parseQuizJson(
        JSON.stringify({
          question: "q",
          options: [{ id: "a", text: "x" }],
          correctOptionIds: ["a"],
        }),
      ),
      null,
    )
  })
})

describe("parseMentorContent", () => {
  it("passes plain prose through as one markdown segment", () => {
    const segments = parseMentorContent("Just an explanation, no quiz.")
    assert.deepEqual(segments, [
      { type: "markdown", text: "Just an explanation, no quiz." },
    ])
  })

  it("splits prose around a quiz block", () => {
    const content = `Here is the concept.\n\n${quizFence(VALID_QUIZ)}\n\nNice work.`
    const segments = parseMentorContent(content)
    assert.equal(segments.length, 3)
    assert.equal(segments[0].type, "markdown")
    assert.equal(segments[1].type, "quiz")
    assert.equal(segments[2].type, "markdown")
  })

  it("does not treat other fenced code blocks as quizzes", () => {
    const content = "Look:\n```bash\naws s3 ls\n```\ndone"
    const segments = parseMentorContent(content)
    assert.equal(segments.length, 1)
    assert.equal(segments[0].type, "markdown")
  })

  it("marks a closed fence with bad JSON as invalid", () => {
    const segments = parseMentorContent(quizFence("{oops"))
    assert.deepEqual(segments, [{ type: "invalid-quiz" }])
  })

  it("treats a trailing open fence as pending while streaming", () => {
    const content = 'Almost there.\n\n```quiz\n{"question": "Wh'
    const streaming = parseMentorContent(content, { streaming: true })
    assert.equal(streaming[0].type, "markdown")
    assert.equal(streaming[1].type, "pending-quiz")

    const finished = parseMentorContent(content)
    assert.equal(finished[1].type, "invalid-quiz")
  })

  it("handles a bare ```quiz fence with no body yet", () => {
    const segments = parseMentorContent("Intro\n\n```quiz", { streaming: true })
    assert.equal(segments[0].type, "markdown")
    assert.equal(segments[1].type, "pending-quiz")
  })
})
