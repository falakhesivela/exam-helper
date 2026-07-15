"use client"

import { useMemo, type ReactNode } from "react"
import Link from "next/link"
import { CalendarPlus, Target } from "lucide-react"
import { useActiveExam } from "@/hooks/use-active-exam"
import { computeExamReadiness } from "@/lib/progress/readiness"
import { projectReadiness } from "@/lib/progress/projection"
import { useSessionStore } from "@/lib/store/use-session-store"
import { cn } from "@/lib/utils"

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]

/** "2026-07-24" → "Jul 24", locale-free so server and client agree. */
function formatDay(isoDate: string): string {
  const [, m, d] = isoDate.split("-")
  return `${MONTHS[Number(m) - 1] ?? ""} ${Number(d)}`.trim()
}

function daysBetween(fromIso: string, toIso: string): number {
  return Math.round(
    (new Date(`${toIso}T00:00:00Z`).getTime() -
      new Date(`${fromIso}T00:00:00Z`).getTime()) / 86_400_000,
  )
}

/**
 * Header countdown: the single home for the "will I be ready by exam day?"
 * signal — days left plus the readiness projection measured against the exam
 * date. The plan pill this replaces only showed days left.
 */
export function ExamCountdown() {
  const { activeExam, ready } = useActiveExam()
  const plan = useSessionStore((s) => s.plan)
  const topicMastery = useSessionStore((s) => s.topicMastery)
  const examAccuracy = useSessionStore((s) => s.examAccuracy)
  const readinessTrend = useSessionStore((s) => s.readinessTrend)

  const readiness = useMemo(() => {
    const blueprint = activeExam?.blueprint
    if (!blueprint) return null
    return computeExamReadiness(
      blueprint,
      topicMastery,
      examAccuracy[blueprint.examCode],
    )
  }, [activeExam, topicMastery, examAccuracy])

  // Don't flash "Set your exam date" while the store is still hydrating.
  if (!ready) return null

  const examDate = activeExam
    ? plan && plan.examCode === activeExam.examCode
      ? plan.targetDate
      : activeExam.examDate
    : null

  if (!activeExam || !examDate) {
    return (
      <Link
        href="/plan"
        className="inline-flex items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:border-primary/35 hover:text-foreground"
      >
        <CalendarPlus className="size-4 text-primary" />
        Set your exam date
      </Link>
    )
  }

  const today = new Date().toISOString().slice(0, 10)
  const daysLeft = Math.max(0, daysBetween(today, examDate))
  const hasSignal = readiness !== null && readiness.totalAnswered > 0
  const projection = hasSignal
    ? projectReadiness(readinessTrend, readiness.score, readiness.passMark, today)
    : null

  let status: ReactNode = null
  let warning = false
  if (hasSignal) {
    if (readiness.score >= readiness.passMark) {
      status = "Above the pass mark — hold it until exam day."
    } else if (projection) {
      const delta = daysBetween(projection.readyDate, examDate)
      if (delta >= 0) {
        status = (
          <>
            On pace — ready ~{formatDay(projection.readyDate)}
            {delta > 0 &&
              `, ${delta} day${delta === 1 ? "" : "s"} before your exam`}
            .
          </>
        )
      } else {
        warning = true
        status = (
          <>
            At this pace you&apos;ll be ready {-delta} day
            {delta === -1 ? "" : "s"} after exam day —{" "}
            <Link href="/plan" className="underline underline-offset-2">
              adjust your plan
            </Link>
            .
          </>
        )
      }
    } else {
      status = `${daysLeft} day${daysLeft === 1 ? "" : "s"} to go — practice daily to build your trend.`
    }
  }

  return (
    <div className="flex flex-col items-start gap-1.5 sm:items-end">
      <Link
        href="/plan"
        className={cn(
          "inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm font-medium transition-colors",
          warning
            ? "border-warning/35 bg-warning/10 hover:bg-warning/15"
            : "border-primary/35 bg-primary/10 hover:bg-primary/15",
        )}
      >
        <Target
          className={cn("size-4", warning ? "text-warning" : "text-primary")}
        />
        {activeExam.examCode} ·{" "}
        <span
          className={cn(
            "font-semibold tabular-nums",
            warning ? "text-warning" : "text-primary",
          )}
        >
          {daysLeft === 0
            ? "exam day"
            : `${daysLeft} day${daysLeft === 1 ? "" : "s"} left`}
        </span>
      </Link>
      {status && (
        <p
          className={cn(
            "max-w-64 text-xs sm:text-right",
            warning ? "font-medium text-warning" : "text-muted-foreground",
          )}
        >
          {status}
        </p>
      )}
    </div>
  )
}
