export const DEFAULT_FREE_DAILY_QUESTION_LIMIT = 20

/** Daily free-tier question allowance (server env). */
export function getFreeDailyQuestionLimit(): number {
  const raw = process.env.FREE_DAILY_QUESTION_LIMIT
  if (!raw?.trim()) return DEFAULT_FREE_DAILY_QUESTION_LIMIT

  const parsed = Number.parseInt(raw, 10)
  if (!Number.isFinite(parsed) || parsed < 1) {
    return DEFAULT_FREE_DAILY_QUESTION_LIMIT
  }
  return parsed
}
