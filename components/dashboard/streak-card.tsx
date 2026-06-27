"use client"

import { useEffect, useRef } from "react"
import { Flame, Trophy } from "lucide-react"
import { toast } from "sonner"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useSessionStore } from "@/lib/store/use-session-store"
import { STREAK_MILESTONES } from "@/lib/streak/status"
import { cn } from "@/lib/utils"

const GOAL_PRESETS = [5, 10, 15, 20]
const WEEKDAY = ["S", "M", "T", "W", "T", "F", "S"]

export function StreakCard() {
  const streak = useSessionStore((s) => s.streak)
  const setDailyGoal = useSessionStore((s) => s.setDailyGoal)
  const celebrated = useRef(false)

  // Fire a one-time celebration when the streak lands on a milestone.
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

  if (!streak) return null

  const goal = Math.max(1, streak.dailyGoal)
  const pct = Math.min(100, Math.round((streak.questionsToday / goal) * 100))
  const radius = 30
  const circumference = 2 * Math.PI * radius
  const dash = (pct / 100) * circumference

  return (
    <Card className="overflow-hidden">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Flame className="size-4 text-[#f59e0b]" />
          {streak.currentStreak}-day streak
        </CardTitle>
        <CardDescription className="flex items-center gap-1.5">
          <Trophy className="size-3.5" />
          Longest: {streak.longestStreak} days
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-5">
        {streak.atRisk && (
          <div className="rounded-lg border border-[#f59e0b]/40 bg-[#f59e0b]/10 px-3 py-2 text-xs font-medium text-[#f59e0b]">
            Practice today to keep your {streak.currentStreak}-day streak alive.
          </div>
        )}

        <div className="flex items-center gap-5">
          {/* Daily goal ring */}
          <div className="relative flex size-20 shrink-0 items-center justify-center">
            <svg className="size-20 -rotate-90" viewBox="0 0 72 72" aria-hidden="true">
              <circle cx="36" cy="36" r={radius} fill="none" stroke="var(--muted)" strokeWidth="7" />
              <circle
                cx="36"
                cy="36"
                r={radius}
                fill="none"
                stroke="var(--primary)"
                strokeWidth="7"
                strokeLinecap="round"
                strokeDasharray={`${dash} ${circumference}`}
              />
            </svg>
            <div className="absolute flex flex-col items-center">
              <span className="text-base font-semibold leading-none">
                {streak.questionsToday}
              </span>
              <span className="text-[10px] text-muted-foreground">/ {goal}</span>
            </div>
          </div>

          {/* 7-day activity row */}
          <div className="flex flex-1 items-end justify-between gap-1.5">
            {streak.activity.map((day) => {
              const dow = new Date(`${day.date}T00:00:00Z`).getUTCDay()
              return (
                <div key={day.date} className="flex flex-1 flex-col items-center gap-1">
                  <div
                    className={cn(
                      "flex aspect-square w-full max-w-9 items-center justify-center rounded-md text-[10px] font-medium",
                      day.goalMet
                        ? "bg-primary text-primary-foreground"
                        : day.count > 0
                          ? "bg-primary/25 text-primary"
                          : "bg-muted text-muted-foreground/50",
                    )}
                    title={`${day.date}: ${day.count} questions`}
                  >
                    {day.count > 0 ? day.count : ""}
                  </div>
                  <span className="text-[10px] text-muted-foreground">{WEEKDAY[dow]}</span>
                </div>
              )
            })}
          </div>
        </div>

        {/* Daily goal setter */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">Daily goal</span>
          <div className="flex gap-1">
            {GOAL_PRESETS.map((g) => (
              <Button
                key={g}
                variant={g === streak.dailyGoal ? "secondary" : "ghost"}
                size="sm"
                className="h-7 px-2 text-xs"
                onClick={() => void setDailyGoal(g)}
              >
                {g}
              </Button>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
