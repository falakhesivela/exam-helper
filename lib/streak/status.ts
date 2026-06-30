/**
 * Pure streak helpers: at-risk detection, milestone crossing, and building the
 * 7-day activity row. No I/O so they're trivially testable on client or server.
 */

/** Streak lengths worth celebrating. */
export const STREAK_MILESTONES = [3, 7, 14, 30, 60, 100, 365]

function daysBetween(fromIso: string, toIso: string): number {
  const ms =
    new Date(`${toIso}T00:00:00Z`).getTime() -
    new Date(`${fromIso}T00:00:00Z`).getTime()
  return Math.round(ms / 86_400_000)
}

/**
 * A streak is "at risk" when the user hasn't practiced today but did yesterday —
 * one more idle day breaks it. Returns false once they've practiced today.
 */
export function isStreakAtRisk(
  lastActiveDate: string | null,
  todayIso: string,
): boolean {
  if (!lastActiveDate) return false
  return daysBetween(lastActiveDate, todayIso) === 1
}

/** True if the user has already practiced today. */
export function practicedToday(
  lastActiveDate: string | null,
  todayIso: string,
): boolean {
  return lastActiveDate === todayIso
}

/**
 * The milestone newly reached when a streak goes from `previous` to `current`,
 * or null if none was crossed. Used to fire a one-time celebration.
 */
export function milestoneReached(
  previous: number,
  current: number,
): number | null {
  if (current <= previous) return null
  let reached: number | null = null
  for (const m of STREAK_MILESTONES) {
    // Keep the highest milestone crossed when the streak jumps several at once.
    if (current >= m && previous < m) reached = m
  }
  return reached
}

export interface ActivityDay {
  date: string
  count: number
  goalMet: boolean
}

/**
 * Build a last-7-days activity row (oldest→newest) from per-day question
 * counts, marking days that met the goal.
 */
export function buildActivityRow(
  usageByDate: Record<string, number>,
  dailyGoal: number,
  todayIso: string,
): ActivityDay[] {
  const goal = Math.max(1, dailyGoal)
  const days: ActivityDay[] = []
  for (let i = 6; i >= 0; i--) {
    const d = new Date(`${todayIso}T00:00:00Z`)
    d.setUTCDate(d.getUTCDate() - i)
    const date = d.toISOString().slice(0, 10)
    const count = usageByDate[date] ?? 0
    days.push({ date, count, goalMet: count >= goal })
  }
  return days
}
