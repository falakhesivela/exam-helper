import type { DragAnswer, PracticeSession, Question } from "@/types"
import type { ExamBlueprint } from "@/lib/exams/types"
import { gradeDragAnswer as gradeDrag } from "@/lib/db/sessions"

export function questionTypeOf(question: Question) {
  return question.questionType ?? "mcq"
}

export function isMcqQuestion(question: Question) {
  return questionTypeOf(question) === "mcq"
}

export function isDragQuestion(question: Question) {
  return questionTypeOf(question) !== "mcq"
}

/** Whether the user has provided a substantive answer for this question. */
export function isQuestionAnswered(
  question: Question,
  selectedIds: string[],
  dragAnswer?: DragAnswer,
): boolean {
  if (isDragQuestion(question)) {
    if (!dragAnswer || !question.dragData) return false
    if (dragAnswer.type === "drag_match" && question.dragData.type === "drag_match") {
      return Object.keys(dragAnswer.mapping).length >= question.dragData.targets.length
    }
    if (dragAnswer.type === "drag_order" && question.dragData.type === "drag_order") {
      return dragAnswer.order.length >= question.dragData.items.length
    }
    if (
      dragAnswer.type === "drag_categorize" &&
      question.dragData.type === "drag_categorize"
    ) {
      const assigned = Object.values(dragAnswer.buckets).flat()
      return assigned.length >= question.dragData.items.length
    }
    return false
  }
  return selectedIds.length > 0
}

/** Compares two arrays of option ids regardless of order. */
export function isAnswerCorrect(
  question: Question,
  selectedIds: string[],
  dragAnswer?: DragAnswer,
): boolean {
  if (isDragQuestion(question)) {
    return gradeDrag(question.dragData, dragAnswer)
  }
  const correct = [...(question.correctOptionIds ?? [])].sort()
  const selected = [...selectedIds].sort()
  return (
    correct.length === selected.length &&
    correct.every((id, i) => id === selected[i])
  )
}

/** Computes the score (answered-correct / answered-total) for a session. */
export function scoreOf(session: PracticeSession): {
  correct: number
  total: number
  pct: number
} {
  const records = Object.values(session.answers).filter(
    (a) =>
      a.selectedOptionIds.length > 0 ||
      a.dragAnswer != null ||
      a.isCorrect,
  )
  const total = session.questions.length
  const correct = records.filter((a) => a.isCorrect).length
  const pct = total > 0 ? Math.round((correct / total) * 100) : 0
  return { correct, total, pct }
}

/** Aggregates correct/incorrect counts per topic for a finished session. */
export function topicBreakdown(session: PracticeSession) {
  const map = new Map<string, { correct: number; total: number }>()
  for (const q of session.questions) {
    const entry = map.get(q.topic) ?? { correct: 0, total: 0 }
    entry.total += 1
    if (session.answers[q.id]?.isCorrect) entry.correct += 1
    map.set(q.topic, entry)
  }
  return [...map.entries()].map(([topic, v]) => ({
    topic,
    ...v,
    pct: Math.round((v.correct / v.total) * 100),
  }))
}

/**
 * Domain scorecard for exam sessions.
 * Prefers domainId + blueprint names; falls back to question.topic.
 */
export function domainBreakdown(
  session: PracticeSession,
  blueprint?: ExamBlueprint | null,
) {
  const map = new Map<
    string,
    { topic: string; correct: number; total: number }
  >()

  for (const q of session.questions) {
    const key = q.domainId ?? q.topic
    const topic =
      (q.domainId && blueprint?.domains.find((d) => d.id === q.domainId)?.name) ||
      q.topic
    const entry = map.get(key) ?? { topic, correct: 0, total: 0 }
    entry.total += 1
    if (session.answers[q.id]?.isCorrect) entry.correct += 1
    map.set(key, entry)
  }

  return [...map.values()]
    .map((v) => ({
      topic: v.topic,
      correct: v.correct,
      total: v.total,
      pct: Math.round((v.correct / v.total) * 100),
    }))
    .sort((a, b) => a.topic.localeCompare(b.topic))
}
