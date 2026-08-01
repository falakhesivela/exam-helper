/**
 * Pure daily-challenge helpers: completion streak over a set of completed
 * dates. Twin of prepa-backend/app/gamification/challenge.py.
 */

/** Questions cloned into each daily challenge (min 3 when history is thin). */
export const CHALLENGE_SIZE = 5
export const CHALLENGE_MIN_SIZE = 3
/** Days before a cloned question may reappear in a challenge. */
export const CHALLENGE_REPEAT_WINDOW_DAYS = 14

function shiftDate(iso: string, days: number): string {
  const d = new Date(`${iso}T00:00:00Z`)
  d.setUTCDate(d.getUTCDate() + days)
  return d.toISOString().slice(0, 10)
}

/**
 * Consecutive completed challenge days ending today (or yesterday, so the
 * streak isn't shown as broken before today's challenge is played).
 */
export function challengeStreak(
  completedDates: Iterable<string>,
  todayIso: string,
): number {
  const done = new Set(completedDates)
  let cursor = done.has(todayIso) ? todayIso : shiftDate(todayIso, -1)
  let streak = 0
  while (done.has(cursor)) {
    streak += 1
    cursor = shiftDate(cursor, -1)
  }
  return streak
}
