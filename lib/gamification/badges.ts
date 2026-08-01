/**
 * Code-defined badge catalog. The DB (user_badges) only stores unlock rows;
 * names, copy, and icons live here so changing them never needs a migration.
 * Twin of prepa-backend/app/gamification/badges.py — keep ids in sync.
 */

import { STREAK_MILESTONES } from "@/lib/streak/status"

export type BadgeCategory = "streak" | "practice" | "mastery" | "challenge" | "level"

export interface BadgeDef {
  id: string
  name: string
  description: string
  /** Lucide icon name, resolved by the badge gallery. */
  icon: string
  category: BadgeCategory
}

const streakBadges: BadgeDef[] = STREAK_MILESTONES.map((days) => ({
  id: `streak-${days}`,
  name: `${days}-day streak`,
  description: `Practiced ${days} days in a row.`,
  icon: "Flame",
  category: "streak",
}))

export const BADGE_CATALOG: BadgeDef[] = [
  ...streakBadges,
  {
    id: "first-mock",
    name: "First mock",
    description: "Completed your first mock exam.",
    icon: "GraduationCap",
    category: "practice",
  },
  {
    id: "hundred-questions",
    name: "Century",
    description: "Answered 100 questions.",
    icon: "Target",
    category: "practice",
  },
  {
    id: "perfect-session",
    name: "Flawless",
    description: "Scored 100% on a session of 5+ questions.",
    icon: "Sparkles",
    category: "practice",
  },
  {
    id: "night-owl",
    name: "Night owl",
    description: "Finished a session between midnight and 5am.",
    icon: "Moon",
    category: "practice",
  },
  {
    id: "comeback",
    name: "Comeback",
    description: "Returned to practice after a week away.",
    icon: "Undo2",
    category: "practice",
  },
  {
    id: "domain-master",
    name: "Domain master",
    description: "Reached 90% mastery in a domain.",
    icon: "Crown",
    category: "mastery",
  },
  {
    id: "challenge-week",
    name: "Challenger",
    description: "Completed the daily challenge 7 days in a row.",
    icon: "CalendarCheck",
    category: "challenge",
  },
  {
    id: "level-5",
    name: "Level 5",
    description: "Reached level 5.",
    icon: "Zap",
    category: "level",
  },
  {
    id: "level-10",
    name: "Level 10",
    description: "Reached level 10.",
    icon: "Zap",
    category: "level",
  },
  {
    id: "level-20",
    name: "Level 20",
    description: "Reached level 20.",
    icon: "Zap",
    category: "level",
  },
]

const byId = new Map(BADGE_CATALOG.map((b) => [b.id, b]))

export function badgeById(id: string): BadgeDef | undefined {
  return byId.get(id)
}
