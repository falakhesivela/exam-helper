"use client"

import Link from "next/link"
import { Sparkles } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { isPaidTier } from "@/lib/config/tiers"
import { useSessionStore } from "@/lib/store/use-session-store"
import { cn } from "@/lib/utils"

/**
 * Slim free-tier allowance row for the dashboard. The top-bar UsageMeter is
 * hidden below sm:, so this is the only usage signal phones get. No hard
 * sell — the limit-hit flows handle that.
 */
export function UsageNudge() {
  const profile = useSessionStore((s) => s.profile)
  const dataReady = useSessionStore((s) => s.dataReady)
  const sessions = useSessionStore((s) => s.sessions)

  // The pre-hydration empty profile defaults to free — don't flash the nudge
  // at paid users. Only the free trial gets it; null limit = unlimited.
  if (!dataReady) return null
  if (isPaidTier(profile.plan) || profile.dailyLimit === null) return null

  const limit = Math.max(1, profile.dailyLimit)
  const remaining = Math.max(0, limit - profile.questionsUsedToday)
  const pct = Math.min(100, Math.round((remaining / limit) * 100))
  const exhausted = remaining === 0

  // Client-side estimate of the lifetime mock allowance; the server enforces
  // the real quota at start time.
  const mockLimit = profile.limits?.mockExams ?? null
  const mocksLeft =
    mockLimit === null
      ? null
      : Math.max(0, mockLimit - sessions.filter((s) => s.mode === "exam").length)

  return (
    <Card>
      <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:gap-6">
        <div className="flex min-w-0 flex-1 flex-col gap-2">
          <p
            className={cn(
              "text-sm",
              exhausted ? "font-medium text-warning" : "text-muted-foreground",
            )}
          >
            <span className="font-semibold tabular-nums text-foreground">
              {remaining}
            </span>{" "}
            of {limit} trial questions left
            {mocksLeft !== null && (
              <>
                {" · "}
                <span className="font-semibold tabular-nums text-foreground">
                  {mocksLeft}
                </span>{" "}
                mock exam{mocksLeft === 1 ? "" : "s"} left
              </>
            )}
          </p>
          <Progress value={pct} className={cn("h-1", exhausted && "*:bg-warning")} />
        </div>
        <Link
          href="/upgrade"
          className="flex shrink-0 items-center gap-1 text-sm font-medium text-primary hover:underline"
        >
          <Sparkles className="size-3.5" />
          Upgrade
        </Link>
      </CardContent>
    </Card>
  )
}
