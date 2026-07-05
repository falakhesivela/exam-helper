/**
 * Pace projection: fit a line to recent readiness snapshots and estimate when
 * the score crosses the pass mark. Pure and deterministic so it runs the same
 * on server and client.
 */

/** Use at most this many recent snapshots so old plateaus don't drag the slope. */
const MAX_POINTS = 14
/** Need at least this many dated points spanning this many days to project. */
const MIN_POINTS = 3
const MIN_SPAN_DAYS = 3
/** Below this daily gain the trend is flat — don't promise a date. */
const MIN_SLOPE = 0.05
/** Projections further out than this are noise, not a forecast. */
const MAX_DAYS_OUT = 90

export interface ReadinessProjection {
  /** ISO date (YYYY-MM-DD) the fitted trend reaches the pass mark. */
  readyDate: string
  /** Whole days from today until readyDate. */
  daysToReady: number
  /** Fitted readiness points gained per day. */
  slopePerDay: number
}

function dayNumber(isoDate: string): number {
  return Math.round(new Date(`${isoDate}T00:00:00Z`).getTime() / 86_400_000)
}

/**
 * Project when readiness reaches the pass mark. The slope comes from a
 * least-squares fit over the recent trend, but the anchor is the *current*
 * live score — a stale trend can't claim readiness the mastery data doesn't
 * support. Returns null when already at the pass mark, the trend is too
 * short/flat, or the crossing is implausibly far out.
 */
export function projectReadiness(
  trend: { date?: string; score: number }[],
  currentScore: number,
  passMark: number,
  todayIso: string,
): ReadinessProjection | null {
  if (currentScore >= passMark) return null

  const pts = trend
    .filter((p): p is { date: string; score: number } => Boolean(p.date))
    .slice(-MAX_POINTS)
    .map((p) => ({ x: dayNumber(p.date), y: p.score }))
  if (pts.length < MIN_POINTS) return null
  const span = pts[pts.length - 1].x - pts[0].x
  if (span < MIN_SPAN_DAYS) return null

  const n = pts.length
  const meanX = pts.reduce((s, p) => s + p.x, 0) / n
  const meanY = pts.reduce((s, p) => s + p.y, 0) / n
  let cov = 0
  let varX = 0
  for (const p of pts) {
    cov += (p.x - meanX) * (p.y - meanY)
    varX += (p.x - meanX) ** 2
  }
  if (varX === 0) return null
  const slope = cov / varX
  if (slope < MIN_SLOPE) return null

  const daysToReady = Math.ceil((passMark - currentScore) / slope)
  if (daysToReady > MAX_DAYS_OUT) return null

  const ready = new Date(`${todayIso}T00:00:00Z`)
  ready.setUTCDate(ready.getUTCDate() + daysToReady)
  return {
    readyDate: ready.toISOString().slice(0, 10),
    daysToReady,
    slopePerDay: Math.round(slope * 100) / 100,
  }
}
