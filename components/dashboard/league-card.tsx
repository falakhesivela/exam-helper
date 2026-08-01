"use client"

import { useEffect, useState } from "react"
import { motion } from "motion/react"
import { ChevronDown, ChevronUp, Trophy } from "lucide-react"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { CardSkeleton } from "@/components/ui/card-skeleton"
import { Badge } from "@/components/ui/badge"
import { useSessionStore } from "@/lib/store/use-session-store"
import { cn } from "@/lib/utils"
import type { LeagueMember, LeagueTier } from "@/types"

const TIER_LABEL: Record<LeagueTier, string> = {
  bronze: "Bronze",
  silver: "Silver",
  gold: "Gold",
  diamond: "Diamond",
}

/** Rows shown collapsed: the top of the table plus the user's neighbourhood. */
const COLLAPSED_TOP = 3
const NEIGHBOURS = 1

function visibleRows(
  members: LeagueMember[],
  expanded: boolean,
): { rows: LeagueMember[]; hasGap: boolean } {
  if (expanded || members.length <= COLLAPSED_TOP + 3) {
    return { rows: members, hasGap: false }
  }
  const youIndex = members.findIndex((m) => m.isYou)
  const top = members.slice(0, COLLAPSED_TOP)
  if (youIndex < 0 || youIndex < COLLAPSED_TOP) {
    return { rows: top, hasGap: members.length > COLLAPSED_TOP }
  }
  const near = members.slice(
    Math.max(COLLAPSED_TOP, youIndex - NEIGHBOURS),
    youIndex + NEIGHBOURS + 1,
  )
  return { rows: [...top, ...near], hasGap: true }
}

/**
 * Weekly XP league: a cohort of learners ranked by the XP they earned this
 * week, with promotion and demotion zones marked.
 */
export function LeagueCard() {
  const league = useSessionStore((s) => s.league)
  const refreshLeague = useSessionStore((s) => s.refreshLeague)
  const dataReady = useSessionStore((s) => s.dataReady)
  const [expanded, setExpanded] = useState(false)

  // Fetched lazily: nothing else in the app needs standings.
  useEffect(() => {
    if (!league) void refreshLeague()
  }, [league, refreshLeague])

  if (!league) return dataReady ? null : <CardSkeleton rows={5} />
  if (!league.eligible) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Trophy className="size-4 text-primary" />
            Weekly league
          </CardTitle>
          <CardDescription>
            Create an account to compete with other learners for weekly XP.
          </CardDescription>
        </CardHeader>
      </Card>
    )
  }

  const members = league.members ?? []
  const tier = league.tier ?? "bronze"
  const promoteCount = league.promoteCount ?? 0
  const demoteCount = league.demoteCount ?? 0
  const demoteFrom = members.length - demoteCount
  const { rows, hasGap } = visibleRows(members, expanded)

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Trophy className="size-4 text-primary" />
            Weekly league
            <Badge variant="secondary">{TIER_LABEL[tier]}</Badge>
          </CardTitle>
          <CardDescription>
            {league.rank
              ? `You're #${league.rank} of ${members.length} this week.`
              : "Earn XP this week to claim your place."}
            {promoteCount > 0 && ` Top ${promoteCount} move up.`}
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-2">
          {league.lastWeek && league.lastWeek.result !== "stayed" && (
            <p
              className={cn(
                "rounded-md px-2.5 py-1.5 text-sm font-medium",
                league.lastWeek.result === "promoted"
                  ? "bg-success/10 text-success"
                  : "bg-destructive/10 text-destructive",
              )}
            >
              {league.lastWeek.result === "promoted"
                ? `Promoted to ${TIER_LABEL[tier]} — you finished #${league.lastWeek.rank} last week.`
                : `Demoted to ${TIER_LABEL[tier]} after finishing #${league.lastWeek.rank} last week.`}
            </p>
          )}

          {members.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Your cohort is still filling up. Earn XP and check back tomorrow.
            </p>
          ) : (
            <>
              {rows.map((m, i) => {
                const promoting = m.rank <= promoteCount && m.xpThisWeek > 0
                const demoting = demoteCount > 0 && m.rank > demoteFrom
                // A skipped span of ranks between the top rows and yours.
                const gapBefore =
                  hasGap && i > 0 && m.rank !== rows[i - 1].rank + 1
                return (
                  <div key={`${m.rank}-${m.name}`}>
                    {gapBefore && (
                      <p className="py-1 text-center text-xs text-muted-foreground">
                        ⋯
                      </p>
                    )}
                    <div
                      className={cn(
                        "flex items-center gap-3 rounded-md px-2 py-1.5 text-sm",
                        m.isYou && "bg-primary/10 font-medium",
                      )}
                    >
                      <span
                        className={cn(
                          "w-5 tabular-nums",
                          promoting
                            ? "font-semibold text-success"
                            : demoting
                              ? "font-semibold text-destructive"
                              : "text-muted-foreground",
                        )}
                      >
                        {m.rank}
                      </span>
                      <span className="flex-1 truncate">
                        {m.isYou ? "You" : m.name}
                      </span>
                      <span className="tabular-nums">
                        {m.xpThisWeek.toLocaleString()} XP
                      </span>
                    </div>
                  </div>
                )
              })}

              {members.length > rows.length || expanded ? (
                <button
                  type="button"
                  onClick={() => setExpanded((v) => !v)}
                  className="flex items-center justify-center gap-1 text-xs text-muted-foreground transition-colors hover:text-foreground"
                >
                  {expanded ? (
                    <>
                      Show less <ChevronUp className="size-3" />
                    </>
                  ) : (
                    <>
                      Show all {members.length} <ChevronDown className="size-3" />
                    </>
                  )}
                </button>
              ) : null}
            </>
          )}
        </CardContent>
      </Card>
    </motion.div>
  )
}
