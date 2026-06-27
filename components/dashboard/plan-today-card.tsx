"use client"

import Link from "next/link"
import {
  AlarmClock,
  ArrowRight,
  BookOpen,
  CalendarCheck,
  RotateCcw,
  Sparkles,
} from "lucide-react"
import type { StudyTaskType } from "@/types"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"
import { useTaskLauncher } from "@/components/plan/use-task-launcher"
import { useSessionStore } from "@/lib/store/use-session-store"

const TASK_ICON: Record<StudyTaskType, typeof Sparkles> = {
  practice: Sparkles,
  exam: AlarmClock,
  lesson: BookOpen,
  review: RotateCcw,
}

function todayIso(): string {
  return new Date().toISOString().slice(0, 10)
}

/** Dashboard card: today's plan tasks with one-tap start, or a build-plan CTA. */
export function PlanTodayCard() {
  const plan = useSessionStore((s) => s.plan)

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

  const pending = plan.tasks.filter((t) => t.status !== "done")
  const todays = pending.filter((t) => t.scheduledDate <= today)
  // Show today's outstanding work, or the next upcoming task if caught up.
  const show = (todays.length > 0 ? todays : pending.slice(0, 1)).slice(0, 3)
  const done = plan.tasks.filter((t) => t.status === "done").length

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CalendarCheck className="size-4 text-primary" />
          Today&apos;s plan
        </CardTitle>
        <CardDescription>
          {plan.examCode} · {done}/{plan.tasks.length} tasks done
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        {show.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            All caught up — nice work. 🎉
          </p>
        ) : (
          show.map((task) => {
            const Icon = TASK_ICON[task.type]
            return (
              <div key={task.id} className="flex items-center gap-3">
                <Icon className="size-4 shrink-0 text-muted-foreground" />
                <span className="min-w-0 flex-1 truncate text-sm font-medium">
                  {task.title}
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
          })
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
