"use client"

import {
  AlarmClock,
  BookOpen,
  RotateCcw,
  Sparkles,
} from "lucide-react"
import type { StudyPlan, StudyPlanTask, StudyTaskType } from "@/types"
import { cn } from "@/lib/utils"

const TASK_ICON: Record<StudyTaskType, typeof Sparkles> = {
  practice: Sparkles,
  exam: AlarmClock,
  lesson: BookOpen,
  review: RotateCcw,
}

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]

function isoToUtc(iso: string): Date {
  return new Date(`${iso}T00:00:00Z`)
}

function utcToIso(d: Date): string {
  return d.toISOString().slice(0, 10)
}

/** A continuous weeks grid spanning the plan, with task chips per day. */
export function PlanCalendar({ plan }: { plan: StudyPlan }) {
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

  const today = utcToIso(new Date())
  const days: Date[] = []
  for (let d = new Date(start); d <= end; d.setUTCDate(d.getUTCDate() + 1)) {
    days.push(new Date(d))
  }

  return (
    <div className="overflow-hidden rounded-lg border">
      <div className="grid grid-cols-7 border-b bg-muted/30">
        {WEEKDAYS.map((w) => (
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
          return (
            <div
              key={iso}
              className={cn(
                "min-h-20 border-b border-r p-1.5 last:border-r-0",
                !inRange && "bg-muted/20 text-muted-foreground/50",
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
                {tasks.map((t) => {
                  const Icon = TASK_ICON[t.type]
                  return (
                    <div
                      key={t.id}
                      title={t.title}
                      className={cn(
                        "flex items-center gap-1 rounded px-1 py-0.5 text-[10px]",
                        t.status === "done"
                          ? "bg-muted text-muted-foreground line-through"
                          : t.type === "exam"
                            ? "bg-primary/15 text-primary"
                            : "bg-muted/70",
                      )}
                    >
                      <Icon className="size-2.5 shrink-0" />
                      <span className="truncate">
                        {t.domainName ?? t.title.replace(/:.*/, "")}
                      </span>
                    </div>
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
