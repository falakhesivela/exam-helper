"use client"

import { useState } from "react"
import {
  AlarmClock,
  BookOpen,
  Check,
  RotateCcw,
  Sparkles,
  Target,
} from "lucide-react"
import { toast } from "sonner"
import type { StudyPlan, StudyPlanTask, StudyTaskType } from "@/types"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Spinner } from "@/components/ui/spinner"
import { useSessionStore } from "@/lib/store/use-session-store"
import { useTaskLauncher } from "@/components/plan/use-task-launcher"
import { cn } from "@/lib/utils"

const TASK_ICON: Record<StudyTaskType, typeof Sparkles> = {
  practice: Sparkles,
  exam: AlarmClock,
  lesson: BookOpen,
  review: RotateCcw,
}

function todayIso(): string {
  return new Date().toISOString().slice(0, 10)
}

function daysUntil(iso: string): number {
  const ms = new Date(`${iso}T00:00:00Z`).getTime() - Date.now()
  return Math.max(0, Math.ceil(ms / 86_400_000))
}

export function PlanView({ plan }: { plan: StudyPlan }) {
  const { launch, launchingId } = useTaskLauncher(plan)
  const updatePlanTask = useSessionStore((s) => s.updatePlanTask)
  const createPlan = useSessionStore((s) => s.createPlan)
  const [regenerating, setRegenerating] = useState(false)

  const done = plan.tasks.filter((t) => t.status === "done").length
  const total = plan.tasks.length
  const pct = total > 0 ? Math.round((done / total) * 100) : 0
  const today = todayIso()

  async function regenerate() {
    if (regenerating) return
    setRegenerating(true)
    try {
      await createPlan(plan.targetDate)
      toast.success("Plan regenerated from your latest progress.")
    } catch {
      toast.error("Couldn't regenerate the plan.")
    } finally {
      setRegenerating(false)
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <Card className="overflow-hidden border-primary/30 bg-gradient-to-br from-primary/10 via-card to-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="size-5 text-primary" />
            {plan.exam}
          </CardTitle>
          <CardDescription>
            {plan.examCode} · exam in {daysUntil(plan.targetDate)} days (
            {plan.targetDate})
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="flex flex-wrap items-end gap-6">
            <div>
              <p className="text-3xl font-semibold tracking-tight">{pct}%</p>
              <p className="text-xs text-muted-foreground">
                {done}/{total} tasks done
              </p>
            </div>
            <div>
              <p className="text-3xl font-semibold tracking-tight text-primary">
                {plan.projectedScore}%
              </p>
              <p className="text-xs text-muted-foreground">
                projected · target {plan.targetScore}%
              </p>
            </div>
          </div>
          <Progress value={pct} className="h-2" />
          <Button
            variant="outline"
            size="sm"
            className="w-fit"
            onClick={() => void regenerate()}
            disabled={regenerating}
          >
            {regenerating ? (
              <>
                <Spinner data-icon="inline-start" />
                Regenerating…
              </>
            ) : (
              <>
                <RotateCcw data-icon="inline-start" />
                Regenerate from latest progress
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      <div className="flex flex-col gap-2">
        {plan.tasks.map((task) => (
          <TaskRow
            key={task.id}
            task={task}
            isToday={task.scheduledDate === today}
            launching={launchingId === task.id}
            onStart={() => launch(task)}
            onToggleDone={() =>
              void updatePlanTask(
                task.id,
                task.status === "done" ? "pending" : "done",
              )
            }
          />
        ))}
      </div>
    </div>
  )
}

function TaskRow({
  task,
  isToday,
  launching,
  onStart,
  onToggleDone,
}: {
  task: StudyPlanTask
  isToday: boolean
  launching: boolean
  onStart: () => void
  onToggleDone: () => void
}) {
  const Icon = TASK_ICON[task.type]
  const done = task.status === "done"

  return (
    <div
      className={cn(
        "flex items-center gap-3 rounded-lg border p-3 transition-colors",
        done ? "border-border bg-muted/30 opacity-70" : "border-border",
        isToday && !done && "border-primary/40 bg-primary/5",
      )}
    >
      <button
        type="button"
        onClick={onToggleDone}
        aria-label={done ? "Mark not done" : "Mark done"}
        className={cn(
          "flex size-6 shrink-0 items-center justify-center rounded-full border",
          done
            ? "border-primary bg-primary text-primary-foreground"
            : "border-muted-foreground/40 text-transparent hover:border-primary",
        )}
      >
        <Check className="size-3.5" />
      </button>

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <Icon className="size-3.5 shrink-0 text-muted-foreground" />
          <span
            className={cn(
              "truncate text-sm font-medium",
              done && "line-through",
            )}
          >
            {task.title}
          </span>
          {isToday && !done && (
            <span className="rounded-full bg-primary/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-primary">
              Today
            </span>
          )}
        </div>
        <p className="truncate text-xs text-muted-foreground">
          Day {task.dayIndex + 1} · {task.rationale}
        </p>
      </div>

      {!done && (
        <Button size="sm" onClick={onStart} disabled={launching}>
          {launching ? (
            <Spinner data-icon="inline-start" />
          ) : (
            "Start"
          )}
        </Button>
      )}
    </div>
  )
}
