/**
 * Shared presentation metadata for study-plan tasks, used by the plan page,
 * calendar, and dashboard card so icons and labels never drift apart.
 */

import { AlarmClock, BookOpen, RotateCcw, Sparkles } from "lucide-react"
import type { StudyTaskType } from "@/types"

export { todayIso, addDays, daysBetween, weekdayOf } from "@/lib/plan/dates"

export const TASK_ICON: Record<StudyTaskType, typeof Sparkles> = {
  practice: Sparkles,
  exam: AlarmClock,
  lesson: BookOpen,
  review: RotateCcw,
}

export const WEEKDAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]

/** "2026-07-05" → "Jul 5" (UTC-stable). */
export function formatShortDate(iso: string): string {
  return new Date(`${iso}T00:00:00Z`).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  })
}

/** Whole days from today (UTC) until an ISO date; 0 if today or past. */
export function daysUntil(iso: string): number {
  const ms = new Date(`${iso}T00:00:00Z`).getTime() - Date.now()
  return Math.max(0, Math.ceil(ms / 86_400_000))
}
