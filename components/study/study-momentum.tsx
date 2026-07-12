"use client"

import { useMemo } from "react"
import { Flame, Target, TrendingUp } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { ProgressRing } from "@/components/ui/progress-ring"
import { scoreOf } from "@/lib/session-utils"
import { useSessionStore } from "@/lib/store/use-session-store"
import { cn } from "@/lib/utils"

/** Compact momentum row for the Study hub: streak, daily usage, 7-day accuracy. */
export function StudyMomentum() {
  const profile = useSessionStore((s) => s.profile)
  const streak = useSessionStore((s) => s.streak)
  const sessions = useSessionStore((s) => s.sessions)

  const currentStreak = streak?.currentStreak ?? profile.streakDays
  const atRisk = streak?.atRisk ?? false
  const goal = Math.max(1, streak?.dailyGoal ?? profile.dailyGoal)
  const questionsToday = streak?.questionsToday ?? profile.questionsUsedToday
  // null = unlimited on the user's tier.
  const dailyLimit = profile.dailyLimit
  const goalPct = Math.min(100, Math.round((questionsToday / goal) * 100))

  const weekAccuracy = useMemo(() => {
    const cutoff = Date.now() - 7 * 24 * 60 * 60 * 1000
    const recent = sessions.filter((s) => {
      if (s.status !== "completed" || s.mode !== "practice") return false
      const ts = new Date(s.completedAt ?? s.createdAt).getTime()
      return ts >= cutoff
    })
    if (recent.length === 0) return null
    const scores = recent.map((s) => scoreOf(s))
    const totalCorrect = scores.reduce((n, s) => n + s.correct, 0)
    const totalAnswered = scores.reduce((n, s) => n + s.answered, 0)
    if (totalAnswered === 0) return null
    return Math.round((totalCorrect / totalAnswered) * 100)
  }, [sessions])

  return (
    <div className="grid grid-cols-3 gap-3">
      <Card className={cn(atRisk && "border-warning/40 bg-warning/5")}>
        <CardContent className="flex items-center gap-3 p-4">
          <Flame
            className={cn(
              "size-5 shrink-0",
              atRisk ? "text-warning" : "text-primary",
            )}
          />
          <div className="min-w-0">
            <p className="text-xl font-semibold tabular-nums tracking-tight">
              {currentStreak}
            </p>
            <p
              className={cn(
                "truncate text-xs",
                atRisk ? "font-medium text-warning" : "text-muted-foreground",
              )}
            >
              {atRisk ? "practice today" : "day streak"}
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="flex items-center gap-3 p-4">
          <ProgressRing value={goalPct} size={44} strokeWidth={14} />
          <div className="min-w-0">
            <p className="text-xl font-semibold tabular-nums tracking-tight">
              {questionsToday}
              <span className="text-sm text-muted-foreground">
                /{dailyLimit ?? goal}
              </span>
            </p>
            <p className="truncate text-xs text-muted-foreground">
              {dailyLimit != null ? "of plan limit" : "today · daily goal"}
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="flex items-center gap-3 p-4">
          {weekAccuracy != null ? (
            <TrendingUp className="size-5 shrink-0 text-primary" />
          ) : (
            <Target className="size-5 shrink-0 text-muted-foreground" />
          )}
          <div className="min-w-0">
            <p className="text-xl font-semibold tabular-nums tracking-tight">
              {weekAccuracy != null ? `${weekAccuracy}%` : "—"}
            </p>
            <p className="truncate text-xs text-muted-foreground">
              7-day accuracy
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
