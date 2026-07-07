"use client"

import { useState } from "react"
import { ChevronDown } from "lucide-react"
import type { StudyPlan, StudyPlanTask } from "@/types"
import { PlanTaskRow } from "@/components/plan/plan-task-row"
import {
  addDays,
  daysBetween,
  formatShortDate,
  todayIso,
} from "@/components/plan/task-meta"
import { cn } from "@/lib/utils"

interface PlanWeekListProps {
  plan: StudyPlan
  launchingId: string | null
  onStart: (task: StudyPlanTask) => void
}

interface WeekGroup {
  index: number
  start: string
  end: string
  tasks: StudyPlanTask[]
  done: number
  active: number
  isCurrent: boolean
}

/**
 * The full schedule grouped into week sections. The current week starts
 * expanded; past and future weeks collapse to a one-line summary.
 */
export function PlanWeekList({ plan, launchingId, onStart }: PlanWeekListProps) {
  const today = todayIso()
  const currentWeek = Math.max(0, Math.floor(daysBetween(plan.startDate, today) / 7))
  const [open, setOpen] = useState<Record<number, boolean>>({ [currentWeek]: true })

  const groups = new Map<number, StudyPlanTask[]>()
  for (const task of plan.tasks) {
    const week = Math.max(0, Math.floor(daysBetween(plan.startDate, task.scheduledDate) / 7))
    const arr = groups.get(week) ?? []
    arr.push(task)
    groups.set(week, arr)
  }

  const weeks: WeekGroup[] = [...groups.entries()]
    .sort(([a], [b]) => a - b)
    .map(([index, tasks]) => {
      const sorted = [...tasks].sort(
        (a, b) => a.scheduledDate.localeCompare(b.scheduledDate) || a.dayIndex - b.dayIndex,
      )
      const activeTasks = sorted.filter((t) => t.status !== "skipped")
      return {
        index,
        start: addDays(plan.startDate, index * 7),
        end: addDays(plan.startDate, index * 7 + 6),
        tasks: sorted,
        done: activeTasks.filter((t) => t.status === "done").length,
        active: activeTasks.length,
        isCurrent: index === currentWeek,
      }
    })

  return (
    <div className="flex flex-col gap-3">
      {weeks.map((week) => {
        const expanded = open[week.index] ?? false
        return (
          <section key={week.index} className="overflow-hidden rounded-lg border">
            <button
              type="button"
              aria-expanded={expanded}
              onClick={() => setOpen((prev) => ({ ...prev, [week.index]: !expanded }))}
              className={cn(
                "flex w-full items-center gap-2 px-3 py-2.5 text-left transition-colors hover:bg-muted/40",
                week.isCurrent && "bg-primary/5",
              )}
            >
              <ChevronDown
                className={cn(
                  "size-4 shrink-0 text-muted-foreground transition-transform",
                  !expanded && "-rotate-90",
                )}
              />
              <span className="text-sm font-medium">
                Week {week.index + 1}
                {week.isCurrent && (
                  <span className="ml-2 rounded-full bg-primary/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-primary">
                    This week
                  </span>
                )}
              </span>
              <span className="min-w-0 flex-1 truncate text-xs text-muted-foreground">
                {formatShortDate(week.start)} – {formatShortDate(week.end)}
              </span>
              <span
                className={cn(
                  "shrink-0 text-xs",
                  week.done === week.active && week.active > 0
                    ? "font-medium text-primary"
                    : "text-muted-foreground",
                )}
              >
                {week.done}/{week.active} done
              </span>
            </button>
            {expanded && (
              <div className="flex flex-col gap-2 border-t p-2">
                {week.tasks.map((task) => (
                  <PlanTaskRow
                    key={task.id}
                    task={task}
                    launching={launchingId === task.id}
                    onStart={() => onStart(task)}
                  />
                ))}
              </div>
            )}
          </section>
        )
      })}
    </div>
  )
}
