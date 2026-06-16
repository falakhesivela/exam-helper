import type { GeneratedQuestion } from "./schemas"

const OPTION_IDS = ["a", "b", "c", "d", "e", "f"] as const

export function validateQuestion(q: GeneratedQuestion): string | null {
  if (q.options.length < 3) return "Fewer than 3 options"
  if (q.options.length > 6) return "More than 6 options"

  const optionIds = new Set<string>()
  for (const opt of q.options) {
    if (optionIds.has(opt.id)) return "Duplicate option id"
    optionIds.add(opt.id)
    if (!opt.text.trim()) return "Empty option text"
  }

  if (q.correctOptionIds.length === 0) return "No correct option"
  for (const id of q.correctOptionIds) {
    if (!optionIds.has(id)) return "Correct id not in options"
  }

  if (q.multiSelect && q.correctOptionIds.length < 2) {
    return "Multi-select needs 2+ correct answers"
  }
  if (!q.multiSelect && q.correctOptionIds.length !== 1) {
    return "Single-select must have exactly one correct answer"
  }

  const stem = q.prompt.toLowerCase()
  for (const opt of q.options) {
    if (q.correctOptionIds.includes(opt.id)) {
      const words = opt.text.toLowerCase().split(/\s+/).filter((w) => w.length > 8)
      const leaked = words.some((w) => stem.includes(w))
      if (leaked) return "Answer may be leaked in stem"
    }
  }

  if (!q.explanation.trim()) return "Missing explanation"
  if (!q.topic.trim()) return "Missing topic"
  if (!q.prompt.trim() || q.prompt.length < 20) return "Prompt too short"

  return null
}

export function assignOptionIds(
  questions: GeneratedQuestion[],
): GeneratedQuestion[] {
  return questions.map((q) => ({
    ...q,
    options: q.options.map((opt, i) => ({
      ...opt,
      id: OPTION_IDS[i] ?? `opt-${i}`,
    })),
    correctOptionIds: q.correctOptionIds.map((id, i) => {
      const idx = q.options.findIndex((o) => o.id === id)
      return OPTION_IDS[idx >= 0 ? idx : i] ?? id
    }),
  }))
}

export function filterValidQuestions(
  questions: GeneratedQuestion[],
): GeneratedQuestion[] {
  const withIds = assignOptionIds(questions)
  return withIds.filter((q) => validateQuestion(q) === null)
}
