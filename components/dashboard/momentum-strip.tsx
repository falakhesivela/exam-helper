"use client"

import { useEffect, useMemo, useRef } from "react"
import Link from "next/link"
import { Brain, ChevronDown, Flame, TrendingUp } from "lucide-react"
import { toast } from "sonner"
import { Card, CardContent } from "@/components/ui/card"
import { ProgressRing } from "@/components/ui/progress-ring"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { scoreOf } from "@/lib/session-utils"
import { STREAK_MILESTONES } from "@/lib/streak/status"
import { useSessionStore } from "@/lib/store/use-session-store"
import { cn } from "@/lib/utils"

const GOAL_PRESETS = [5, 10, 15, 20]

interface MomentumStripProps {
  /** Missed questions due for review today; null while loading. */
  dueCount: number | null
}

/**
 * One-row momentum snapshot: streak (with 7-day dots), daily goal ring,
 * due reviews, and last mock-exam score.
 */
export function MomentumStrip({ dueCount }: MomentumStripProps) {
  const profile = useSessionStore((s) => s.profile)
  const streak = useSessionStore((s) => s.streak)
  const sessions = useSessionStore((s) => s.sessions)
  const setDailyGoal = useSessionStore((s) => s.setDailyGoal)
  const celebrated = useRef(false)

  // One-time celebration when the streak lands on a milestone.
  useEffect(() => {
    if (!streak || celebrated.current) return
    if (!STREAK_MILESTONES.includes(streak.currentStreak)) return
    const key = `streak-celebrated-${streak.currentStreak}`
    if (typeof window !== "undefined" && !localStorage.getItem(key)) {
      localStorage.setItem(key, "1")
      celebrated.current = true
      toast.success(`🔥 ${streak.currentStreak}-day streak! Keep it going.`)
    }
  }, [streak])

  const currentStreak = streak?.currentStreak ?? profile.streakDays
  const longestStreak = streak?.longestStreak ?? profile.longestStreak
  const atRisk = streak?.atRisk ?? false
  const goal = Math.max(1, streak?.dailyGoal ?? profile.dailyGoal)
  const questionsToday = streak?.questionsToday ?? profile.questionsUsedToday
  const goalPct = Math.min(100, Math.round((questionsToday / goal) * 100))

  const lastMock = useMemo(() => {
    const exams = sessions
      .filter((s) => s.status === "completed" && s.mode === "exam")
      .sort(
        (a, b) =>
          new Date(b.completedAt ?? b.createdAt).getTime() -
          new Date(a.completedAt ?? a.createdAt).getTime(),
      )
    if (exams.length === 0) return null
    const scores = exams.map((s) => scoreOf(s).pct)
    const latest = scores[0]
    const best = Math.max(...scores)
    return { latest, best, isBest: latest >= best && exams.length > 1 }
  }, [sessions])

  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      {/* Streak */}
      <Card className={cn(atRisk && "border-warning/40 bg-warning/5")}>
        <CardContent className="flex items-center gap-3 p-4">
          <Flame className={cn("size-5 shrink-0", atRisk ? "text-warning" : "text-primary")} />
          <div className="min-w-0">
            <p className="text-xl font-semibold tracking-tight tabular-nums">
              {currentStreak} day{currentStreak === 1 ? "" : "s"}
            </p>
            <p className={cn("truncate text-xs", atRisk ? "font-medium text-warning" : "text-muted-foreground")}>
              {atRisk
                ? "practice today to keep it"
                : `streak · longest ${longestStreak}`}
            </p>
            {streak && streak.activity.length > 0 && (
              <div className="mt-1.5 flex gap-1" aria-hidden="true">
                {streak.activity.slice(-7).map((day) => (
                  <span
                    key={day.date}
                    title={`${day.date}: ${day.count} questions`}
                    className={cn(
                      "size-1.5 rounded-full",
                      day.goalMet
                        ? "bg-primary"
                        : day.count > 0
                          ? "bg-primary/40"
                          : "bg-muted",
                    )}
                  />
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Daily goal */}
      <Card>
        <CardContent className="flex items-center gap-3 p-4">
          <ProgressRing value={goalPct} size={44} strokeWidth={14} />
          <div className="min-w-0">
            <p className="text-xl font-semibold tracking-tight tabular-nums">
              {questionsToday}
              <span className="text-sm text-muted-foreground">/{goal}</span>
            </p>
            <DropdownMenu>
              <DropdownMenuTrigger className="flex items-center gap-0.5 text-xs text-muted-foreground transition-colors hover:text-foreground">
                daily goal
                <ChevronDown className="size-3" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start">
                <DropdownMenuGroup>
                  <DropdownMenuLabel>Questions per day</DropdownMenuLabel>
                  {GOAL_PRESETS.map((g) => (
                    <DropdownMenuItem
                      key={g}
                      className={cn(g === goal && "font-semibold text-primary")}
                      onClick={() => void setDailyGoal(g)}
                    >
                      {g} questions
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuGroup>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </CardContent>
      </Card>

      {/* Due reviews */}
      <Card className="transition-colors hover:bg-muted/40">
        <CardContent className="p-0">
          <Link href="/study/review?due=true" className="flex items-center gap-3 p-4">
            <Brain className="size-5 shrink-0 text-primary" />
            <div className="min-w-0">
              <p className="text-xl font-semibold tracking-tight tabular-nums">
                {dueCount ?? "—"}
              </p>
              <p className="truncate text-xs text-muted-foreground">
                review{dueCount === 1 ? "" : "s"} due today
              </p>
            </div>
          </Link>
        </CardContent>
      </Card>

      {/* Last mock */}
      <Card>
        <CardContent className="flex items-center gap-3 p-4">
          <TrendingUp className="size-5 shrink-0 text-primary" />
          <div className="min-w-0">
            <p className="text-xl font-semibold tracking-tight tabular-nums">
              {lastMock ? `${lastMock.latest}%` : "—"}
            </p>
            <p className="truncate text-xs text-muted-foreground">
              {lastMock
                ? lastMock.isBest
                  ? (<>last mock · <span className="font-medium text-primary">personal best</span></>)
                  : `last mock · best ${lastMock.best}%`
                : "no mock exams yet"}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
