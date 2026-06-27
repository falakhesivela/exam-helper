import { test } from "node:test"
import assert from "node:assert/strict"
import { shuffle, toFlashcard } from "./build.ts"
import type { Question } from "@/types"

function mcq(): Question {
  return {
    id: "q1",
    topic: "Networking",
    difficulty: "medium",
    multiSelect: false,
    scenario: "A VPC has a private subnet.",
    prompt: "How do instances reach the internet for patches without being reachable?",
    options: [
      { id: "a", text: "Internet gateway on the private subnet" },
      { id: "b", text: "NAT gateway in a public subnet" },
    ],
    correctOptionIds: ["b"],
    explanation: "A NAT gateway allows outbound-only internet access.",
    references: [],
  }
}

test("front combines scenario + prompt, back has answer + explanation", () => {
  const card = toFlashcard({ questionId: "q1", examCode: "SAA-C03", question: mcq() })
  assert.match(card.front, /private subnet/)
  assert.match(card.front, /reach the internet/)
  assert.match(card.back, /NAT gateway in a public subnet/)
  assert.match(card.back, /outbound-only/)
  assert.equal(card.topic, "Networking")
})

test("non-MCQ (no options) falls back to explanation only", () => {
  const q = { ...mcq(), options: undefined, correctOptionIds: undefined }
  const card = toFlashcard({ questionId: "q1", examCode: "SAA-C03", question: q })
  assert.equal(card.back.trim(), "A NAT gateway allows outbound-only internet access.")
})

test("shuffle keeps the same elements", () => {
  const items = [1, 2, 3, 4, 5]
  const out = shuffle(items, () => 0.5)
  assert.deepEqual([...out].sort(), items)
  assert.equal(out.length, 5)
})
