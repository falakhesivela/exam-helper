"use client"

import Link from "next/link"
import { ArrowRight, CalendarCheck } from "lucide-react"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { CardSkeleton } from "@/components/ui/card-skeleton"
import { Spinner } from "@/components/ui/spinner"
import { useTaskLauncher } from "@/components/plan/use-task-launcher"
import { formatShortDate, TASK_ICON, todayIso } from "@/components/plan/task-meta"
import { computePlanPace, type PlanPaceStatus } from "@/lib/plan/pace"
import { useSessionStore } from "@/lib/store/use-session-store"

const PACE_LABEL: Record<PlanPaceStatus, { text: string; className: string }> = {
  behind: { text: "Behind", className: "text-warning" },
  "on-track": { text: "On track", className: "text-primary" },
  ahead: { text: "Ahead", className: "text-primary" },
  complete: { text: "Complete", className: "text-primary" },
}

/** Dashboard card: today's plan tasks with one-tap start, or a build-plan CTA. */
export function PlanTodayCard() {
  const plan = useSessionStore((s) => s.plan)
  const dataReady = useSessionStore((s) => s.dataReady)

  // Plan still streaming in — don't flash the build-plan CTA.
  if (!plan && !dataReady) {
    return <CardSkeleton rows={3} />
  }

  if (!plan) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CalendarCheck className="size-4 text-primary" />
            Study plan
          </CardTitle>
          <CardDescription>
            Get a day-by-day path to your pass mark.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button asChild>
            <Link href="/plan">
              Build your plan
              <ArrowRight data-icon="inline-end" />
            </Link>
          </Button>
        </CardContent>
      </Card>
    )
  }

  return <PlanTodayInner plan={plan} />
}

function PlanTodayInner({ plan }: { plan: NonNullable<ReturnType<typeof useSessionStore.getState>["plan"]> }) {
  const { launch, launchingId } = useTaskLauncher(plan)
  const today = todayIso()
  const pace = PACE_LABEL[computePlanPace(plan, today).status]

  const pending = plan.tasks.filter((t) => t.status === "pending")
  const todays = pending.filter((t) => t.scheduledDate <= today)
  // Show today's outstanding work, or the next upcoming task if caught up —
  // labelled as upcoming so this card never contradicts the plan page's
  // "nothing left for today".
  const caughtUp = todays.length === 0
  const show = (caughtUp ? pending.slice(0, 1) : todays).slice(0, 3)
  const done = plan.tasks.filter((t) => t.status === "done").length

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CalendarCheck className="size-4 text-primary" />
          Today&apos;s plan
        </CardTitle>
        <CardDescription>
          {plan.examCode} · {done}/{plan.tasks.length} tasks ·{" "}
          <span className={pace.className}>{pace.text}</span>
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        {show.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            All caught up — nice work. 🎉
          </p>
        ) : (
          <>
          {caughtUp && (
            <p className="text-sm text-muted-foreground">
              All done for today — next up:
            </p>
          )}
          {show.map((task) => {
            const Icon = TASK_ICON[task.type]
            return (
              <div key={task.id} className="flex items-center gap-3">
                <Icon className="size-4 shrink-0 text-muted-foreground" />
                <span className="min-w-0 flex-1 truncate text-sm font-medium">
                  {task.title}
                  {caughtUp && (
                    <span className="ml-2 text-xs font-normal text-muted-foreground">
                      {formatShortDate(task.scheduledDate)}
                    </span>
                  )}
                </span>
                <Button
                  size="sm"
                  onClick={() => launch(task)}
                  disabled={launchingId === task.id}
                >
                  {launchingId === task.id ? (
                    <Spinner data-icon="inline-start" />
                  ) : (
                    "Start"
                  )}
                </Button>
              </div>
            )
          })}
          </>
        )}
        <Button asChild variant="ghost" size="sm" className="w-fit">
          <Link href="/plan">
            View full plan
            <ArrowRight data-icon="inline-end" />
          </Link>
        </Button>
      </CardContent>
    </Card>
  )
}
