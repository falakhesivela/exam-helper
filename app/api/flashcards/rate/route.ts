import { NextResponse } from "next/server"
import { z } from "zod"
import { requireUser } from "@/lib/api/auth"
import { handleRouteError } from "@/lib/api/route-utils"
import { scheduleQuestionReview } from "@/lib/db/missed-questions"
import { createAdminClient } from "@/lib/supabase/admin"

export const runtime = "nodejs"

const bodySchema = z.object({
  questionId: z.string().uuid(),
  known: z.boolean(),
})

/** Update spaced-repetition schedule from a flashcard self-rating (no freemium charge). */
export async function POST(request: Request) {
  try {
    const user = await requireUser()
    const body = bodySchema.parse(await request.json())
    const admin = createAdminClient()

    const { data: question } = await admin
      .from("questions")
      .select("id, session_id")
      .eq("id", body.questionId)
      .single()

    if (!question) {
      return NextResponse.json({ error: "Question not found" }, { status: 404 })
    }

    const { data: session } = await admin
      .from("sessions")
      .select("user_id")
      .eq("id", question.session_id)
      .eq("user_id", user.id)
      .single()

    if (!session) {
      return NextResponse.json({ error: "Question not found" }, { status: 404 })
    }

    await scheduleQuestionReview(admin, user.id, body.questionId, body.known)

    return NextResponse.json({ ok: true })
  } catch (err) {
    return handleRouteError(err)
  }
}
