import { test } from "node:test"
import assert from "node:assert/strict"
import {
  buildReviewDeck,
  factToReviewCard,
  questionToReviewCard,
  rateTarget,
} from "./review-deck.ts"
import { getAllCatalogTopics } from "../learning/catalog/index.ts"
import type { FactCard, MissedQuestionItem } from "../../types/index.ts"

function missed(overrides: Partial<MissedQuestionItem> = {}): MissedQuestionItem {
  return {
    questionId: "q1",
    sessionId: "s1",
    exam: "AWS Solutions Architect",
    examCode: "SAA-C03",
    answeredAt: "2026-07-01T00:00:00Z",
    question: {
      id: "q1",
      topic: "Design Resilient Architectures",
      difficulty: "medium",
      prompt: "Which service is durable?",
      scenario: "A team stores backups.",
      multiSelect: false,
      options: [
        { id: "a", text: "S3" },
        { id: "b", text: "Instance store" },
      ],
      correctOptionIds: ["a"],
      explanation: "S3 is durable.",
      references: [],
    },
    ...overrides,
  } as MissedQuestionItem
}

function fact(overrides: Partial<FactCard> = {}): FactCard {
  return {
    lessonId: "l1",
    factIndex: 2,
    topicName: "VPC Networking",
    topicSlug: "vpc-networking",
    question: "Default VPC CIDR?",
    fact: "172.31.0.0/16",
    due: true,
    ...overrides,
  }
}

test("a missed question becomes a card with the answer on the back", () => {
  const card = questionToReviewCard(missed())
  assert.equal(card.kind, "question")
  assert.equal(card.key, "q:q1")
  assert.match(card.front, /Which service is durable\?/)
  assert.match(card.back, /S3/)
  assert.match(card.back, /S3 is durable\./)
})

test("a fact becomes a card asking its recall question", () => {
  const card = factToReviewCard(fact())
  assert.equal(card.kind, "fact")
  assert.equal(card.key, "f:l1:2")
  assert.equal(card.front, "Default VPC CIDR?")
  assert.equal(card.back, "172.31.0.0/16")
})

test("card keys never collide across the two sources", () => {
  // Both sources could plausibly produce the id "1"; the prefix keeps them apart.
  const q = questionToReviewCard(missed({ questionId: "1" }))
  const f = factToReviewCard(fact({ lessonId: "1", factIndex: 0 }))
  assert.notEqual(q.key, f.key)
})

test("a never-scheduled question counts as due, matching the backend", () => {
  const card = questionToReviewCard(missed({ due: undefined }))
  assert.equal(card.due, true)
})

test("the deck puts due cards before the rest", () => {
  const deck = buildReviewDeck({
    questions: [
      missed({ questionId: "not-due", due: false }),
      missed({ questionId: "due", due: true }),
    ],
    facts: [fact({ lessonId: "l-not-due", due: false }), fact({ lessonId: "l-due", due: true })],
    count: 4,
    dueCount: 2,
  })
  assert.equal(deck.length, 4)
  assert.deepEqual(
    deck.map((c) => c.due),
    [true, true, false, false],
  )
})

test("a rating routes back to the scheduler that owns the card", () => {
  assert.deepEqual(rateTarget(questionToReviewCard(missed())), {
    kind: "question",
    questionId: "q1",
  })
  assert.deepEqual(rateTarget(factToReviewCard(fact())), {
    kind: "fact",
    lessonId: "l1",
    factIndex: 2,
  })
})

test("no topic slug collides with a reserved Learn route", () => {
  // Learn topic URLs are backed by the shared /study route tree, where review
  // and saved are static children. Either slug would become unreachable.
  const reserved = new Set(["review", "saved"])
  for (const examCode of ["SAA-C03", "CUSTOM"]) {
    for (const topic of getAllCatalogTopics(examCode)) {
      assert.ok(
        !reserved.has(topic.slug),
        `${examCode} topic "${topic.slug}" collides with a reserved Learn route`,
      )
    }
  }
})
