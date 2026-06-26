import { gradeAnswer } from "@/lib/db/sessions"
import type { DbQuestion } from "@/lib/db/mappers"
import type { createAdminClient } from "@/lib/supabase/admin"

/** How many recent completed mock exams to grade per exam code. */
const RECENT_EXAMS_PER_CODE = 3

type AdminClient = ReturnType<typeof createAdminClient>

export type ExamAccuracy = Record<
  string,
  { accuracy: number; questions: number }
>

/**
 * Grade a user's recent completed mock exams server-side (correct answers are
 * never exposed to the client) and return accuracy per exam code. Shared by the
 * exam-accuracy endpoint and the readiness-trend snapshot writer.
 */
export async function computeRecentExamAccuracy(
  admin: AdminClient,
  userId: string,
): Promise<ExamAccuracy> {
  const { data: sessions } = await admin
    .from("sessions")
    .select("id, exam_code")
    .eq("user_id", userId)
    .eq("status", "completed")
    .eq("mode", "exam")
    .order("created_at", { ascending: false })

  // Keep only the most recent N completed exams per exam code.
  const perCode = new Map<string, string[]>()
  for (const s of sessions ?? []) {
    const ids = perCode.get(s.exam_code) ?? []
    if (ids.length < RECENT_EXAMS_PER_CODE) {
      ids.push(s.id)
      perCode.set(s.exam_code, ids)
    }
  }

  const result: ExamAccuracy = {}

  for (const [examCode, sessionIds] of perCode) {
    let correct = 0
    let total = 0

    for (const sessionId of sessionIds) {
      const [{ data: questions }, { data: answers }] = await Promise.all([
        admin.from("questions").select("*").eq("session_id", sessionId),
        admin.from("answers").select("*").eq("session_id", sessionId),
      ])

      for (const q of (questions ?? []) as DbQuestion[]) {
        const a = answers?.find((ans) => ans.question_id === q.id)
        if (a && a.selected_option_ids.length > 0) {
          total += 1
          if (gradeAnswer(q.correct_option_ids, a.selected_option_ids)) {
            correct += 1
          }
        }
      }
    }

    if (total > 0) {
      result[examCode] = {
        accuracy: Math.round((correct / total) * 100),
        questions: total,
      }
    }
  }

  return result
}
