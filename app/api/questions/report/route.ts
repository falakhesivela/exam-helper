import { NextResponse } from "next/server"
import { z } from "zod"
import { requireUser } from "@/lib/api/auth"
import { apiError, handleRouteError } from "@/lib/api/route-utils"
import { checkRateLimit } from "@/lib/db/rate-limit"
import { createAdminClient } from "@/lib/supabase/admin"

export const runtime = "nodejs"

const REPORT_REASONS = ["wrong_answer", "unclear", "typo", "other"] as const

const bodySchema = z.object({
  questionId: z.string().uuid(),
  reason: z.enum(REPORT_REASONS),
  detail: z.string().max(500).optional(),
})

/** POST — flag a generated question as bad. One report per user per question. */
export async function POST(request: Request) {
  try {
    const user = await requireUser()
    if (!(await checkRateLimit(`report:${user.id}`, 10, 60_000))) {
      return apiError("Slow down a moment and try again.", 429, {
        code: "RATE_LIMITED",
      })
    }
    const body = bodySchema.parse(await request.json())
    const admin = createAdminClient()

    const { data: question } = await admin
      .from("questions")
      .select("id, session_id")
      .eq("id", body.questionId)
      .single()
    if (!question)
      return apiError("Question not found", 404, { code: "NOT_FOUND" })

    const { data: session } = await admin
      .from("sessions")
      .select("id")
      .eq("id", question.session_id)
      .eq("user_id", user.id)
      .single()
    if (!session)
      return apiError("Question not found", 404, { code: "NOT_FOUND" })

    const { error } = await admin.from("question_reports").upsert(
      {
        user_id: user.id,
        question_id: body.questionId,
        reason: body.reason,
        detail: body.detail ?? null,
      },
      { onConflict: "user_id,question_id" },
    )
    if (error) throw error

    return NextResponse.json({ ok: true })
  } catch (err) {
    return handleRouteError(err)
  }
}
