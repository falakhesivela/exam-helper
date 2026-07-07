/**
 * Adaptive rescheduling for a study plan: pending tasks whose date has passed
 * roll forward onto the remaining study days so falling behind never requires
 * a manual regenerate. Pure and deterministic — the server applies the returned
 * moves and stamps `last_rebalanced_on` so this runs at most once per day.
 *
 * Invariants:
 * - done/skipped tasks and future pending tasks are never touched;
 * - a task's new dayIndex is always daysBetween(plan.startDate, newDate);
 * - rerunning on the same day after applying the moves is a no-op;
 * - exam and review tasks are never auto-skipped, only overdue practice tasks
 *   are dropped (marked "skipped") when the runway can no longer fit them.
 */

import type { StudyTaskStatus, StudyTaskType } from "@/types"
import { addDays, daysBetween, weekdayOf } from "./dates.ts"

/** Normal ceiling of rolled-forward tasks per study day. */
const MAX_TASKS_PER_DAY = 2
/** Expanded ceiling when the backlog wouldn't otherwise fit. */
const MAX_TASKS_PER_DAY_TIGHT = 3

export interface RebalanceTask {
  id: string
  dayIndex: number
  scheduledDate: string
  type: StudyTaskType
  status: StudyTaskStatus
}

export interface RebalanceInput {
  /** Plan start, ISO `YYYY-MM-DD` (dayIndex anchor). */
  startDate: string
  /** Exam day, ISO `YYYY-MM-DD`. */
  targetDate: string
  /** ISO `YYYY-MM-DD` (server UTC date). */
  today: string
  /** UTC weekdays (0=Sun..6=Sat) with no scheduled tasks. */
  restDays: number[]
  /** All plan tasks, any order. */
  tasks: RebalanceTask[]
}

export interface RebalanceMove {
  id: string
  scheduledDate: string
  dayIndex: number
  /** Set when the runway can no longer fit this task. */
  status?: "skipped"
}

export function rebalancePlan(input: RebalanceInput): { moves: RebalanceMove[] } {
  const rest = new Set(input.restDays)

  // Runway: study days from today (or the plan start, if later) up to the last
  // day before the exam. No runway — e.g. the exam date has passed — means we
  // leave everything alone; the UI prompts for a new target date instead.
  const firstDay = input.today > input.startDate ? input.today : input.startDate
  const studyDays: string[] = []
  for (let d = firstDay; d < input.targetDate; d = addDays(d, 1)) {
    if (!rest.has(weekdayOf(d))) studyDays.push(d)
  }
  if (studyDays.length === 0) return { moves: [] }

  const overdue = input.tasks
    .filter((t) => t.status === "pending" && t.scheduledDate < input.today)
    .sort(
      (a, b) =>
        a.dayIndex - b.dayIndex ||
        a.scheduledDate.localeCompare(b.scheduledDate),
    )
  if (overdue.length === 0) return { moves: [] }

  // Current load per runway day from future pending tasks that stay put.
  const load = new Map<string, number>()
  for (const t of input.tasks) {
    if (t.status === "pending" && t.scheduledDate >= input.today) {
      load.set(t.scheduledDate, (load.get(t.scheduledDate) ?? 0) + 1)
    }
  }
  const capacityAt = (cap: number) =>
    studyDays.reduce((sum, d) => sum + Math.max(0, cap - (load.get(d) ?? 0)), 0)

  let cap = MAX_TASKS_PER_DAY
  if (capacityAt(cap) < overdue.length) cap = MAX_TASKS_PER_DAY_TIGHT

  // Overflow: drop the oldest overdue practice tasks that will never fit, so
  // exams and reviews always survive.
  const moves: RebalanceMove[] = []
  let queue = overdue
  const capacity = capacityAt(cap)
  if (queue.length > capacity) {
    let excess = queue.length - capacity
    const skippedIds = new Set<string>()
    for (const t of queue) {
      if (excess === 0) break
      if (t.type !== "practice") continue
      moves.push({
        id: t.id,
        scheduledDate: t.scheduledDate,
        dayIndex: t.dayIndex,
        status: "skipped",
      })
      skippedIds.add(t.id)
      excess -= 1
    }
    queue = queue.filter((t) => !skippedIds.has(t.id))
  }

  // Lay the queue across the runway, earliest day first; anything that still
  // doesn't fit (non-practice overflow) crams onto the final study day.
  const lastDay = studyDays[studyDays.length - 1]
  let dayCursor = 0
  for (const t of queue) {
    while (
      dayCursor < studyDays.length &&
      (load.get(studyDays[dayCursor]) ?? 0) >= cap
    ) {
      dayCursor += 1
    }
    const day = dayCursor < studyDays.length ? studyDays[dayCursor] : lastDay
    load.set(day, (load.get(day) ?? 0) + 1)
    moves.push({
      id: t.id,
      scheduledDate: day,
      dayIndex: daysBetween(input.startDate, day),
    })
  }

  return { moves }
}
