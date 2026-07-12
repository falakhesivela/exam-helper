"use client"

import Link from "next/link"
import { ArrowRight, CalendarCheck, Moon, PartyPopper, Trophy } from "lucide-react"
import type { StudyPlan, StudyPlanTask } from "@/types"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { PlanTaskRow } from "@/components/plan/plan-task-row"
import { formatShortDate, todayIso, weekdayOf } from "@/components/plan/task-meta"

interface PlanTodayProps {
  plan: StudyPlan
  launchingId: string | null
  onStart: (task: StudyPlanTask) => void
}

/**
 * The lead card of the plan page: today's tasks with one-tap start, or the
 * matching empty state (rest day / caught up / plan complete).
 */
export function PlanToday({ plan, launchingId, onStart }: PlanTodayProps) {
  const today = todayIso()
  const pending = plan.tasks.filter((t) => t.status === "pending")
  const todays = plan.tasks.filter(
    (t) => t.scheduledDate === today && t.status !== "skipped",
  )
  const openToday = todays.filter((t) => t.status === "pending")
  const nextUp = pending
    .filter((t) => t.scheduledDate > today)
    .sort((a, b) => a.scheduledDate.localeCompare(b.scheduledDate))[0]
  const isRestDay = plan.restDays.includes(weekdayOf(today)) && todays.length === 0
  const planComplete = pending.length === 0

  return (
    <Card className="overflow-hidden border-primary/30 bg-gradient-to-br from-primary/10 via-card to-card">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CalendarCheck className="size-5 text-primary" />
          Today
        </CardTitle>
        <CardDescription>
          {planComplete
            ? "Every task is done."
            : isRestDay
              ? "Rest day — recovery is part of the plan."
              : openToday.length > 0
                ? `${openToday.length} task${openToday.length === 1 ? "" : "s"} on today's schedule.`
                : "Nothing left for today."}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-2">
        {planComplete ? (
          <div className="flex flex-col items-start gap-3 py-2">
            <p className="flex items-center gap-2 text-sm">
              <Trophy className="size-4 text-primary" />
              Plan complete — you&apos;re ready. Book that exam!
            </p>
          </div>
        ) : openToday.length > 0 ? (
          openToday.map((task) => (
            <PlanTaskRow
              key={task.id}
              task={task}
              launching={launchingId === task.id}
              onStart={() => onStart(task)}
              hideDate
            />
          ))
        ) : isRestDay ? (
          <div className="flex items-center justify-between gap-3 py-2">
            <p className="flex items-center gap-2 text-sm text-muted-foreground">
              <Moon className="size-4" />
              Nothing scheduled today.
            </p>
            <Button asChild variant="ghost" size="sm">
              <Link href="/study">
                Study anyway
                <ArrowRight data-icon="inline-end" />
              </Link>
            </Button>
          </div>
        ) : (
          <div className="flex flex-col gap-1 py-2">
            <p className="flex items-center gap-2 text-sm">
              <PartyPopper className="size-4 text-primary" />
              All done for today — nice work.
            </p>
            {nextUp && (
              <p className="text-xs text-muted-foreground">
                Next up: {nextUp.title} on {formatShortDate(nextUp.scheduledDate)}.
              </p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
