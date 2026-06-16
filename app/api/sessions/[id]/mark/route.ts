import { NextResponse } from "next/server"
import { z } from "zod"
import { requireUser } from "@/lib/api/auth"
import { handleRouteError } from "@/lib/api/route-utils"
import { createAdminClient } from "@/lib/supabase/admin"
import { loadSession } from "@/lib/db/sessions"

export const runtime = "nodejs"

const bodySchema = z.object({
  questionId: z.string().uuid(),
})

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = await requireUser()
    const { id: sessionId } = await params
    const body = bodySchema.parse(await request.json())
    const admin = createAdminClient()

    const { data: session } = await admin
      .from("sessions")
      .select("id")
      .eq("id", sessionId)
      .eq("user_id", user.id)
      .single()

    if (!session) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 })
    }

    const { data: existing } = await admin
      .from("answers")
      .select("*")
      .eq("session_id", sessionId)
      .eq("question_id", body.questionId)
      .maybeSingle()

    const marked = !(existing?.marked_for_review ?? false)

    await admin.from("answers").upsert(
      {
        session_id: sessionId,
        question_id: body.questionId,
        selected_option_ids: existing?.selected_option_ids ?? [],
        is_correct: existing?.is_correct ?? false,
        marked_for_review: marked,
        skipped: existing?.skipped ?? false,
        time_spent_sec: existing?.time_spent_sec ?? 0,
      },
      { onConflict: "session_id,question_id" },
    )

    const updated = await loadSession(admin, sessionId, user.id)
    return NextResponse.json(updated)
  } catch (err) {
    return handleRouteError(err)
  }
}
