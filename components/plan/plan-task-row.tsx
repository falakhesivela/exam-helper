"use client"

import { Check, MoreHorizontal } from "lucide-react"
import type { StudyPlanTask } from "@/types"
import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useSessionStore } from "@/lib/store/use-session-store"
import { addDays, formatShortDate, TASK_ICON, todayIso } from "@/components/plan/task-meta"
import { cn } from "@/lib/utils"

interface PlanTaskRowProps {
  task: StudyPlanTask
  launching: boolean
  onStart: () => void
  /** Hide the date label (e.g. inside the Today card). */
  hideDate?: boolean
}

/**
 * One schedule row: done-toggle, task label, and an overflow menu with
 * skip/unskip and move-to-today/tomorrow. Skipped rows render dimmed with no
 * Start button.
 */
export function PlanTaskRow({ task, launching, onStart, hideDate }: PlanTaskRowProps) {
  const updatePlanTask = useSessionStore((s) => s.updatePlanTask)
  const Icon = TASK_ICON[task.type]
  const done = task.status === "done"
  const skipped = task.status === "skipped"
  const today = todayIso()
  const isToday = task.scheduledDate === today && !done && !skipped

  return (
    <div
      className={cn(
        "flex items-center gap-3 rounded-lg border p-3 transition-colors",
        done && "bg-muted/30 opacity-70",
        skipped && "opacity-50",
        isToday && "border-primary/40 bg-primary/5",
      )}
    >
      <button
        type="button"
        onClick={() =>
          void updatePlanTask(task.id, { status: done ? "pending" : "done" })
        }
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
          <span className={cn("truncate text-sm font-medium", done && "line-through")}>
            {task.title}
          </span>
          {isToday && (
            <span className="rounded-full bg-primary/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-primary">
              Today
            </span>
          )}
          {skipped && (
            <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
              Skipped
            </span>
          )}
        </div>
        <p className="truncate text-xs text-muted-foreground">
          {hideDate ? task.rationale : `${formatShortDate(task.scheduledDate)} · ${task.rationale}`}
        </p>
      </div>

      {!done && !skipped && (
        <Button size="sm" onClick={onStart} disabled={launching}>
          {launching ? <Spinner data-icon="inline-start" /> : "Start"}
        </Button>
      )}

      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <Button variant="ghost" size="icon" aria-label="Task options" className="size-8 shrink-0" />
          }
        >
          <MoreHorizontal className="size-4" />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-44">
          {skipped ? (
            <DropdownMenuItem
              onClick={() => void updatePlanTask(task.id, { status: "pending" })}
            >
              Restore task
            </DropdownMenuItem>
          ) : (
            <>
              {!done && task.scheduledDate !== today && (
                <DropdownMenuItem
                  onClick={() => void updatePlanTask(task.id, { scheduledDate: today })}
                >
                  Move to today
                </DropdownMenuItem>
              )}
              {!done && (
                <DropdownMenuItem
                  onClick={() =>
                    void updatePlanTask(task.id, { scheduledDate: addDays(today, 1) })
                  }
                >
                  Move to tomorrow
                </DropdownMenuItem>
              )}
              {!done && (
                <DropdownMenuItem
                  onClick={() => void updatePlanTask(task.id, { status: "skipped" })}
                >
                  Skip this task
                </DropdownMenuItem>
              )}
              <DropdownMenuItem
                onClick={() =>
                  void updatePlanTask(task.id, { status: done ? "pending" : "done" })
                }
              >
                {done ? "Mark not done" : "Mark done"}
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}
