/**
 * Deterministic pace tracking for a study plan: are you on schedule to finish
 * before the exam? Pure so it's trivially testable and runs on client or server.
 */

import type { StudyPlan } from "@/types"

export type PlanPaceStatus = "behind" | "on-track" | "ahead" | "complete"

export interface PlanPace {
  totalTasks: number
  doneTasks: number
  /** Tasks scheduled on or before today (what "should" be done by now). */
  expectedDoneByToday: number
  status: PlanPaceStatus
  /** Calendar days from today until the exam (0 if today or past). */
  daysRemaining: number
  tasksRemaining: number
  /** How many tasks behind schedule (0 when on-track or ahead). */
  behindBy: number
  /** Tasks/day needed to finish the rest on time. */
  requiredPerDay: number
}

/** Tolerance before we call someone "behind" (avoids nagging over one task). */
const BEHIND_TOLERANCE = 1

function daysBetween(fromIso: string, toIso: string): number {
  const ms =
    new Date(`${toIso}T00:00:00Z`).getTime() -
    new Date(`${fromIso}T00:00:00Z`).getTime()
  return Math.round(ms / 86_400_000)
}

export function computePlanPace(plan: StudyPlan, todayIso: string): PlanPace {
  // Skipped tasks are out of the plan: they count toward neither the
  // remaining work nor what "should" have been done by now.
  const active = plan.tasks.filter((t) => t.status !== "skipped")
  const totalTasks = active.length
  const doneTasks = active.filter((t) => t.status === "done").length
  const tasksRemaining = totalTasks - doneTasks
  const expectedDoneByToday = active.filter(
    (t) => t.scheduledDate <= todayIso,
  ).length
  const daysRemaining = Math.max(0, daysBetween(todayIso, plan.targetDate))
  const behindBy = Math.max(0, expectedDoneByToday - doneTasks)
  const requiredPerDay =
    tasksRemaining === 0
      ? 0
      : Math.round((tasksRemaining / Math.max(1, daysRemaining)) * 10) / 10

  let status: PlanPaceStatus
  if (tasksRemaining === 0) {
    status = "complete"
  } else if (behindBy > BEHIND_TOLERANCE) {
    status = "behind"
  } else if (doneTasks > expectedDoneByToday) {
    status = "ahead"
  } else {
    status = "on-track"
  }

  return {
    totalTasks,
    doneTasks,
    expectedDoneByToday,
    status,
    daysRemaining,
    tasksRemaining,
    behindBy,
    requiredPerDay,
  }
}
