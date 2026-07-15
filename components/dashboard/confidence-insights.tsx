"use client"

import { useEffect, useMemo, useState } from "react"
import { ConfidenceMatrix } from "@/components/exam/debrief/confidence-matrix"
import { CardSkeleton } from "@/components/ui/card-skeleton"
import { useActiveExam } from "@/hooks/use-active-exam"
import { confidenceBreakdown } from "@/lib/exam-insights"
import { useSessionStore } from "@/lib/store/use-session-store"

/**
 * Confidence quadrants from the latest completed mock exam — "sure but wrong"
 * answers are misconceptions the learner won't find by feel. Confidence lives
 * only on full sessions, so this lazily upgrades the summary stub once; the
 * store keeps the full copy, so revisits don't refetch.
 */
export function ConfidenceInsights() {
  const sessions = useSessionStore((s) => s.sessions)
  const ensureFullSession = useSessionStore((s) => s.ensureFullSession)
  const { activeExam } = useActiveExam()
  const [failed, setFailed] = useState(false)

  const target = useMemo(() => {
    const mocks = sessions
      .filter((s) => s.mode === "exam" && s.status === "completed")
      .sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      )
    if (mocks.length === 0) return null
    return (
      (activeExam &&
        mocks.find((s) => s.examCode === activeExam.examCode)) ||
      mocks[0]
    )
  }, [sessions, activeExam])

  const targetId = target?.id ?? null
  const isStub = Boolean(target?.summary)

  useEffect(() => {
    if (!targetId || !isStub) return
    let cancelled = false
    setFailed(false)
    void ensureFullSession(targetId).then((full) => {
      if (!cancelled && full === null) setFailed(true)
    })
    return () => {
      cancelled = true
    }
  }, [targetId, isStub, ensureFullSession])

  if (!target) return null
  if (target.summary) return failed ? null : <CardSkeleton rows={4} />

  const breakdown = confidenceBreakdown(target)
  // Learner never used the confidence toggles — don't nag with an empty card.
  if (breakdown.rated === 0) return null

  return (
    <ConfidenceMatrix
      breakdown={breakdown}
      sessionId={target.id}
      context={`last mock · ${target.examCode}`}
    />
  )
}
