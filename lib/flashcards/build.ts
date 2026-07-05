import type { Question } from "@/types"
import { dragAnswerFlashcardBack } from "@/lib/ai/drag-answer-text"
import { isMcqQuestion } from "@/lib/session-utils"

export interface Flashcard {
  id: string
  topic: string
  examCode: string
  /** The prompt (and scenario) to recall against. */
  front: string
  /** The correct answer and explanation. */
  back: string
}

export interface MissedItemLike {
  questionId: string
  examCode: string
  question: Question
}

/** Turn a missed question into a recall flashcard (front = ask, back = answer). */
export function toFlashcard(item: MissedItemLike): Flashcard {
  const q = item.question
  const front = [q.scenario?.trim(), q.prompt.trim()].filter(Boolean).join("\n\n")

  const correctTexts = (q.options ?? [])
    .filter((o) => (q.correctOptionIds ?? []).includes(o.id))
    .map((o) => o.text)
  const answerLine =
    correctTexts.length > 0 ? `✓ ${correctTexts.join("\n✓ ")}` : ""
  const back = isMcqQuestion(q)
    ? [answerLine, q.explanation?.trim()].filter(Boolean).join("\n\n")
    : dragAnswerFlashcardBack(q)

  return {
    id: q.id,
    topic: q.topic,
    examCode: item.examCode,
    front,
    back,
  }
}

/** Fisher–Yates shuffle returning a new array (deterministic with a seed fn). */
export function shuffle<T>(items: T[], rand: () => number = Math.random): T[] {
  const out = [...items]
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1))
    ;[out[i], out[j]] = [out[j], out[i]]
  }
  return out
}
