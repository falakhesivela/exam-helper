import type { FactCard, MissedQuestionItem, ReviewQueue } from "@/types"
import { shuffle, toFlashcard } from "@/lib/flashcards/build"

/**
 * The two review sources — questions you missed and key facts from your lessons
 * — are stored separately but reviewed as one deck. This is the shape they both
 * collapse into. `kind` is kept so a rating can be routed back to the right
 * scheduler.
 */
export type ReviewCard = {
  /** Unique across both sources. */
  key: string
  topic: string
  front: string
  back: string
  due: boolean
} & (
  | { kind: "question"; questionId: string; retired: boolean }
  | { kind: "fact"; lessonId: string; factIndex: number }
)

export function questionToReviewCard(item: MissedQuestionItem): ReviewCard {
  const card = toFlashcard(item)
  return {
    kind: "question",
    key: `q:${item.questionId}`,
    questionId: item.questionId,
    topic: card.topic,
    front: card.front,
    back: card.back,
    // A never-scheduled card is new, and new cards are due (the backend agrees).
    due: item.due ?? true,
    retired: item.retired ?? false,
  }
}

export function factToReviewCard(fact: FactCard): ReviewCard {
  return {
    kind: "fact",
    key: `f:${fact.lessonId}:${fact.factIndex}`,
    lessonId: fact.lessonId,
    factIndex: fact.factIndex,
    topic: fact.topicName,
    front: fact.question,
    back: fact.fact,
    due: fact.due,
  }
}

/**
 * Build the deck for a round: due cards first so a short session hits what
 * matters, shuffled within each group.
 */
export function buildReviewDeck(queue: ReviewQueue): ReviewCard[] {
  const cards = [
    ...queue.questions.map(questionToReviewCard),
    ...queue.facts.map(factToReviewCard),
  ]
  return [
    ...shuffle(cards.filter((c) => c.due)),
    ...shuffle(cards.filter((c) => !c.due)),
  ]
}

/** The argument `api.rateReviewCard` expects for this card. */
export function rateTarget(card: ReviewCard) {
  return card.kind === "question"
    ? ({ kind: "question", questionId: card.questionId } as const)
    : ({ kind: "fact", lessonId: card.lessonId, factIndex: card.factIndex } as const)
}
