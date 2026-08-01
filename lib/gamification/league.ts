/**
 * Pure weekly-league helpers: tier ladder, promotion/demotion zones, and the
 * global UTC week boundary. Twin of prepa-backend/app/gamification/league.py.
 * Days are user-local everywhere else; league weeks are UTC Mondays so every
 * cohort shares one boundary.
 */

export const LEAGUE_TIERS = ["bronze", "silver", "gold", "diamond"] as const
export type LeagueTier = (typeof LEAGUE_TIERS)[number]

export const LEAGUE_COHORT_SIZE = 20

/** ISO date of the UTC Monday for the week containing `iso` (a date or datetime). */
export function weekStartUtc(iso: string): string {
  const d = new Date(iso.length === 10 ? `${iso}T00:00:00Z` : iso)
  const dow = d.getUTCDay() // 0 = Sunday
  const back = (dow + 6) % 7 // days since Monday
  d.setUTCDate(d.getUTCDate() - back)
  return d.toISOString().slice(0, 10)
}

export interface LeagueZones {
  promoteCount: number
  demoteCount: number
}

/**
 * Promotion/demotion zone sizes for a cohort. Top of diamond can't promote,
 * bottom of bronze can't demote; tiny cohorts only promote their winner.
 * Members with zero weekly XP never promote regardless of zone (enforced by
 * the rollover, not here).
 */
export function leagueZones(memberCount: number, tier: LeagueTier): LeagueZones {
  let promote = 0
  let demote = 0
  if (memberCount >= 12) {
    promote = 5
    demote = 5
  } else if (memberCount >= 6) {
    promote = 2
    demote = 2
  } else if (memberCount >= 2) {
    promote = 1
  }
  if (tier === "diamond") promote = 0
  if (tier === "bronze") demote = 0
  return { promoteCount: promote, demoteCount: demote }
}

export function nextTier(tier: LeagueTier): LeagueTier {
  const i = LEAGUE_TIERS.indexOf(tier)
  return LEAGUE_TIERS[Math.min(i + 1, LEAGUE_TIERS.length - 1)]
}

export function prevTier(tier: LeagueTier): LeagueTier {
  const i = LEAGUE_TIERS.indexOf(tier)
  return LEAGUE_TIERS[Math.max(i - 1, 0)]
}
