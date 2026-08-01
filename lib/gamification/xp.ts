/**
 * Pure XP economy: per-action award values, daily caps, and the level curve.
 * Twin of prepa-backend/app/gamification/xp.py — keep the numbers in sync.
 */

export type XpKind =
  | "correct_answer"
  | "lesson_completed"
  | "lab_step"
  | "lab_completed"
  | "review_rated"
  | "plan_task_done"
  | "mock_completed"
  | "mock_correct_answer"
  | "challenge_completed"

/** XP granted per action. Mock exams also earn a small per-correct bonus. */
export const XP_VALUES: Record<XpKind, number> = {
  correct_answer: 10,
  lesson_completed: 25,
  lab_step: 5,
  lab_completed: 30,
  review_rated: 5,
  plan_task_done: 15,
  mock_completed: 75,
  mock_correct_answer: 2,
  challenge_completed: 40,
}

/**
 * User-local daily caps for the two repeatable kinds; everything else is
 * naturally one-shot via its source key. 0 means uncapped.
 */
export const XP_DAILY_CAPS: Partial<Record<XpKind, number>> = {
  correct_answer: 300,
  review_rated: 100,
}

/**
 * Cumulative XP required to reach `level`: 50·n·(n−1).
 * L1=0, L2=100, L3=300, L5=1000, L10=4500, L20=19000.
 */
export function xpForLevel(level: number): number {
  return 50 * level * (level - 1)
}

/** Level for a given XP total (levels start at 1). Closed-form inverse. */
export function levelFromXp(xp: number): number {
  if (xp <= 0) return 1
  return Math.floor((1 + Math.sqrt(1 + xp / 12.5)) / 2)
}

export interface LevelProgress {
  level: number
  intoLevel: number
  forNext: number
  pct: number
}

/** Progress within the current level, for rings and progress bars. */
export function levelProgress(xp: number): LevelProgress {
  const total = Math.max(0, xp)
  const level = levelFromXp(total)
  const intoLevel = total - xpForLevel(level)
  const forNext = xpForLevel(level + 1) - xpForLevel(level)
  return {
    level,
    intoLevel,
    forNext,
    pct: Math.min(100, Math.round((intoLevel / forNext) * 100)),
  }
}
