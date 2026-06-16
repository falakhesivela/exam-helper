import type { PracticeSession, Question } from "@/types"

/** Compares two arrays of option ids regardless of order. */
export function isAnswerCorrect(question: Question, selectedIds: string[]): boolean {
  const correct = [...question.correctOptionIds].sort()
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
    (a) => a.selectedOptionIds.length > 0 || a.isCorrect,
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
