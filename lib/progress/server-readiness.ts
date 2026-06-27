import type { createAdminClient } from "@/lib/supabase/admin"
import { getExamBlueprint } from "@/lib/exams"
import { enrichTopicMastery } from "@/lib/exams/mastery-keys"
import type { ExamBlueprint } from "@/lib/exams/types"
import { inferExamFromSessions } from "@/lib/learning/topic-resolver"
import { computeExamReadiness, type Readiness } from "@/lib/progress/readiness"
import { computeRecentExamAccuracy } from "@/lib/progress/exam-accuracy"

type AdminClient = ReturnType<typeof createAdminClient>

export interface ReadinessForExam {
  blueprint: ExamBlueprint
  readiness: Readiness
}

/**
 * Load and compute readiness for the user's primary (most recently practiced)
 * exam, server-side. Returns null for custom exams with no blueprint.
 */
export async function loadPrimaryExamReadiness(
  admin: AdminClient,
  userId: string,
): Promise<ReadinessForExam | null> {
  const [{ data: masteryRows }, { data: sessionRows }] = await Promise.all([
    admin.from("topic_mastery").select("*").eq("user_id", userId),
    admin
      .from("sessions")
      .select("exam, exam_code, created_at")
      .eq("user_id", userId),
  ])

  const topics = (masteryRows ?? []).map((row) => enrichTopicMastery(row))
  const sessions = (sessionRows ?? []).map((s) => ({
    examCode: s.exam_code,
    exam: s.exam,
    createdAt: s.created_at,
  }))

  const { examCode } = inferExamFromSessions(sessions)
  const blueprint = getExamBlueprint(examCode)
  if (!blueprint) return null

  const accuracy = await computeRecentExamAccuracy(admin, userId)
  const readiness = computeExamReadiness(
    blueprint,
    topics,
    accuracy[blueprint.examCode],
  )
  return { blueprint, readiness }
}
