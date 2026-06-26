import { NextResponse } from "next/server"
import { requireUser } from "@/lib/api/auth"
import { handleRouteError } from "@/lib/api/route-utils"
import { createAdminClient } from "@/lib/supabase/admin"
import { getExamBlueprint } from "@/lib/exams"
import { enrichTopicMastery } from "@/lib/exams/mastery-keys"
import { inferExamFromSessions } from "@/lib/learning/topic-resolver"
import { computeExamReadiness } from "@/lib/progress/readiness"
import { computeRecentExamAccuracy } from "@/lib/progress/exam-accuracy"

export const runtime = "nodejs"

/** Keep the chart readable; trend covers roughly the last month. */
const MAX_POINTS = 30

const MONTHS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
]

/** "2026-06-26" → "Jun 26" without relying on server locale. */
function formatLabel(isoDate: string): string {
  const [, m, d] = isoDate.split("-")
  return `${MONTHS[Number(m) - 1] ?? ""} ${Number(d)}`.trim()
}

/**
 * Readiness trend for the user's primary exam. Lazily records one snapshot per
 * calendar day on read (idempotent upsert), then returns the recent history.
 * Returns [] for custom exams with no blueprint or when there's no data yet.
 */
export async function GET() {
  try {
    const user = await requireUser()
    const admin = createAdminClient()

    const [{ data: masteryRows }, { data: sessionRows }] = await Promise.all([
      admin.from("topic_mastery").select("*").eq("user_id", user.id),
      admin
        .from("sessions")
        .select("exam, exam_code, created_at")
        .eq("user_id", user.id),
    ])

    const topics = (masteryRows ?? []).map((row) => enrichTopicMastery(row))
    const sessions = (sessionRows ?? []).map((s) => ({
      examCode: s.exam_code,
      exam: s.exam,
      createdAt: s.created_at,
    }))

    const { examCode } = inferExamFromSessions(sessions)
    const blueprint = getExamBlueprint(examCode)
    if (!blueprint) return NextResponse.json([])

    const accuracy = await computeRecentExamAccuracy(admin, user.id)
    const readiness = computeExamReadiness(
      blueprint,
      topics,
      accuracy[blueprint.examCode],
    )

    // Record today's score once it's meaningful (idempotent per day).
    if (readiness.totalAnswered > 0) {
      const today = new Date().toISOString().slice(0, 10)
      await admin.from("readiness_snapshots").upsert(
        {
          user_id: user.id,
          exam_code: blueprint.examCode,
          snapshot_date: today,
          score: readiness.score,
          verdict: readiness.verdict,
        },
        { onConflict: "user_id,exam_code,snapshot_date" },
      )
    }

    const { data: snaps } = await admin
      .from("readiness_snapshots")
      .select("snapshot_date, score")
      .eq("user_id", user.id)
      .eq("exam_code", blueprint.examCode)
      .order("snapshot_date", { ascending: true })

    const trend = (snaps ?? []).slice(-MAX_POINTS).map((s) => ({
      label: formatLabel(s.snapshot_date),
      score: s.score,
    }))

    return NextResponse.json(trend)
  } catch (err) {
    return handleRouteError(err)
  }
}
