"use client"

import type { StudyPlan, StudyPlanTask } from "@/types"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useSessionStore } from "@/lib/store/use-session-store"
import { TASK_ICON, todayIso, WEEKDAY_LABELS } from "@/components/plan/task-meta"
import { cn } from "@/lib/utils"

function isoToUtc(iso: string): Date {
  return new Date(`${iso}T00:00:00Z`)
}

function utcToIso(d: Date): string {
  return d.toISOString().slice(0, 10)
}

interface PlanCalendarProps {
  plan: StudyPlan
  launchingId: string | null
  onStart: (task: StudyPlanTask) => void
}

/**
 * A continuous weeks grid spanning the plan. Each task chip opens a small
 * action menu (start, done-toggle, skip) so the calendar is a first-class
 * view, not a read-only picture.
 */
export function PlanCalendar({ plan, launchingId, onStart }: PlanCalendarProps) {
  const updatePlanTask = useSessionStore((s) => s.updatePlanTask)
  if (plan.tasks.length === 0) return null

  const byDate = new Map<string, StudyPlanTask[]>()
  for (const t of plan.tasks) {
    const arr = byDate.get(t.scheduledDate) ?? []
    arr.push(t)
    byDate.set(t.scheduledDate, arr)
  }

  const dates = plan.tasks.map((t) => t.scheduledDate).sort()
  const min = isoToUtc(dates[0])
  const max = isoToUtc(dates[dates.length - 1])
  // Pad to whole weeks (Sun–Sat).
  const start = new Date(min)
  start.setUTCDate(start.getUTCDate() - start.getUTCDay())
  const end = new Date(max)
  end.setUTCDate(end.getUTCDate() + (6 - end.getUTCDay()))

  const today = todayIso()
  const days: Date[] = []
  for (let d = new Date(start); d <= end; d.setUTCDate(d.getUTCDate() + 1)) {
    days.push(new Date(d))
  }

  return (
    <div className="overflow-hidden rounded-lg border">
      <div className="grid grid-cols-7 border-b bg-muted/30">
        {WEEKDAY_LABELS.map((w) => (
          <div
            key={w}
            className="px-2 py-1.5 text-center text-[11px] font-medium text-muted-foreground"
          >
            {w}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7">
        {days.map((d) => {
          const iso = utcToIso(d)
          const tasks = byDate.get(iso) ?? []
          const inRange = iso >= dates[0] && iso <= dates[dates.length - 1]
          const isToday = iso === today
          const isRestDay = inRange && plan.restDays.includes(d.getUTCDay())
          return (
            <div
              key={iso}
              className={cn(
                "min-h-20 border-b border-r p-1.5 last:border-r-0",
                !inRange && "bg-muted/20 text-muted-foreground/50",
                isRestDay && tasks.length === 0 && "bg-muted/30",
                isToday && "bg-primary/5 ring-1 ring-inset ring-primary/40",
              )}
            >
              <div
                className={cn(
                  "mb-1 text-[11px]",
                  isToday && "font-semibold text-primary",
                )}
              >
                {d.getUTCDate()}
              </div>
              <div className="flex flex-col gap-1">
                {tasks.map((task) => {
                  const Icon = TASK_ICON[task.type]
                  const done = task.status === "done"
                  const skipped = task.status === "skipped"
                  return (
                    <DropdownMenu key={task.id}>
                      <DropdownMenuTrigger
                        className={cn(
                          "flex w-full items-center gap-1 rounded px-1 py-0.5 text-left text-[10px] transition-colors hover:ring-1 hover:ring-primary/40",
                          done
                            ? "bg-muted text-muted-foreground line-through"
                            : skipped
                              ? "bg-muted/50 text-muted-foreground/60"
                              : task.type === "exam"
                                ? "bg-primary/15 text-primary"
                                : "bg-muted/70",
                        )}
                      >
                        <Icon className="size-2.5 shrink-0" />
                        <span className="truncate">
                          {task.domainName ?? task.title.replace(/:.*/, "")}
                        </span>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="start" className="w-56">
                        <DropdownMenuLabel className="max-w-56">
                          <span className="block truncate text-xs font-medium">{task.title}</span>
                          <span className="block truncate text-[11px] font-normal text-muted-foreground">
                            {task.rationale}
                          </span>
                        </DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        {skipped ? (
                          <DropdownMenuItem
                            onClick={() => void updatePlanTask(task.id, { status: "pending" })}
                          >
                            Restore task
                          </DropdownMenuItem>
                        ) : (
                          <>
                            {!done && (
                              <DropdownMenuItem
                                onClick={() => onStart(task)}
                                disabled={launchingId === task.id}
                              >
                                {launchingId === task.id ? "Starting…" : "Start now"}
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuItem
                              onClick={() =>
                                void updatePlanTask(task.id, {
                                  status: done ? "pending" : "done",
                                })
                              }
                            >
                              {done ? "Mark not done" : "Mark done"}
                            </DropdownMenuItem>
                            {!done && (
                              <DropdownMenuItem
                                onClick={() => void updatePlanTask(task.id, { status: "skipped" })}
                              >
                                Skip this task
                              </DropdownMenuItem>
                            )}
                          </>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
