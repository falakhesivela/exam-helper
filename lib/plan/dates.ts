/**
 * Shared UTC date helpers for the study-plan engine and UI. All dates are ISO
 * `YYYY-MM-DD` strings interpreted in UTC so schedules are timezone-stable.
 */

export function parseDate(iso: string): Date {
  const [y, m, d] = iso.split("-").map(Number)
  return new Date(Date.UTC(y, m - 1, d))
}

export function toIso(date: Date): string {
  return date.toISOString().slice(0, 10)
}

export function addDays(iso: string, days: number): string {
  const d = parseDate(iso)
  d.setUTCDate(d.getUTCDate() + days)
  return toIso(d)
}

export function daysBetween(startIso: string, endIso: string): number {
  const ms = parseDate(endIso).getTime() - parseDate(startIso).getTime()
  return Math.round(ms / 86_400_000)
}

/** UTC weekday of an ISO date: 0=Sun .. 6=Sat. */
export function weekdayOf(iso: string): number {
  return parseDate(iso).getUTCDay()
}

/** Today as an ISO `YYYY-MM-DD` string (UTC). */
export function todayIso(): string {
  return new Date().toISOString().slice(0, 10)
}
