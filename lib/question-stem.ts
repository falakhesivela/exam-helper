import type { Question } from "@/types"

/** Combined text for hint detection (multi-select phrasing, etc.). */
export function questionStemText(question: Question): string {
  const scenario = question.scenario?.trim()
  const prompt = question.prompt.trim()
  return scenario ? `${scenario} ${prompt}` : prompt
}

export function hasScenario(question: Question): boolean {
  return Boolean(question.scenario?.trim())
}
