"use client"

import { CalendarDays } from "lucide-react"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { useSessionStore } from "@/lib/store/use-session-store"
import { cn } from "@/lib/utils"

/** Cell intensity relative to the daily goal (0 = no practice). */
function levelOf(count: number, goal: number): 0 | 1 | 2 | 3 | 4 {
  if (count <= 0) return 0
  if (count < goal / 2) return 1
  if (count < goal) return 2
  if (count < goal * 2) return 3
  return 4
}

const LEVEL_CLASS = [
  "bg-muted/60",
  "bg-primary/25",
  "bg-primary/45",
  "bg-primary/70",
  "bg-primary",
] as const

/** GitHub-style 12-week practice heatmap, weekday-aligned (rows Sun→Sat). */
export function ConsistencyHeatmap() {
  const streak = useSessionStore((s) => s.streak)

  if (!streak || streak.activity.length === 0) return null

  const goal = Math.max(1, streak.dailyGoal)
  const activity = streak.activity
  const activeDays = activity.filter((d) => d.count > 0).length
  const goalsMet = activity.filter((d) => d.goalMet).length
  const weeks = Math.round(activity.length / 7)

  // Pad the grid start so each column is a real calendar week.
  const firstDow = new Date(`${activity[0].date}T00:00:00Z`).getUTCDay()
  const cells: ({ date: string; count: number; level: number } | null)[] =
    Array(firstDow).fill(null)
  for (const day of activity) {
    cells.push({
      date: day.date,
      count: day.count,
      level: levelOf(day.count, goal),
    })
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <CalendarDays className="size-4 text-primary" />
          Consistency
        </CardTitle>
        <CardDescription>
          Last {weeks} weeks · {activeDays} active days · {goalsMet} goals met
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        <div
          className="grid w-fit grid-flow-col grid-rows-7 gap-1"
          role="img"
          aria-label={`Practice heatmap: ${activeDays} active days in the last ${weeks} weeks`}
        >
          {cells.map((cell, i) =>
            cell ? (
              <span
                key={cell.date}
                title={`${cell.date}: ${cell.count} question${cell.count === 1 ? "" : "s"}`}
                className={cn(
                  "size-3.5 rounded-[3px]",
                  LEVEL_CLASS[cell.level],
                )}
              />
            ) : (
              <span key={`pad-${i}`} className="size-3.5" />
            ),
          )}
        </div>
        <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
          less
          {LEVEL_CLASS.map((c) => (
            <span key={c} className={cn("size-2.5 rounded-[2px]", c)} />
          ))}
          more
        </div>
      </CardContent>
    </Card>
  )
}
