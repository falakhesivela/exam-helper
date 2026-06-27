import { NextResponse } from "next/server"
import { z } from "zod"
import { requireUser } from "@/lib/api/auth"
import { apiError, handleRouteError } from "@/lib/api/route-utils"
import { createAdminClient } from "@/lib/supabase/admin"
import { loadBookmarks } from "@/lib/db/bookmarks"

export const runtime = "nodejs"

/** GET — the user's saved questions (full, with answers + explanation). */
export async function GET() {
  try {
    const user = await requireUser()
    const admin = createAdminClient()
    const items = await loadBookmarks(admin, user.id)
    return NextResponse.json({ items, count: items.length })
  } catch (err) {
    return handleRouteError(err)
  }
}

const bodySchema = z.object({ questionId: z.string().uuid() })

/** POST — save a question. Only questions from the user's own sessions. */
export async function POST(request: Request) {
  try {
    const user = await requireUser()
    const { questionId } = bodySchema.parse(await request.json())
    const admin = createAdminClient()

    const { data: question } = await admin
      .from("questions")
      .select("id, session_id")
      .eq("id", questionId)
      .single()
    if (!question) return apiError("Question not found", 404, { code: "NOT_FOUND" })

    const { data: session } = await admin
      .from("sessions")
      .select("id")
      .eq("id", question.session_id)
      .eq("user_id", user.id)
      .single()
    if (!session) return apiError("Question not found", 404, { code: "NOT_FOUND" })

    const { error } = await admin
      .from("question_bookmarks")
      .upsert(
        { user_id: user.id, question_id: questionId },
        { onConflict: "user_id,question_id" },
      )
    if (error) throw error

    return NextResponse.json({ ok: true, questionId })
  } catch (err) {
    return handleRouteError(err)
  }
}

/** DELETE — remove a saved question. */
export async function DELETE(request: Request) {
  try {
    const user = await requireUser()
    const { questionId } = bodySchema.parse(await request.json())
    const admin = createAdminClient()

    const { error } = await admin
      .from("question_bookmarks")
      .delete()
      .eq("user_id", user.id)
      .eq("question_id", questionId)
    if (error) throw error

    return NextResponse.json({ ok: true, questionId })
  } catch (err) {
    return handleRouteError(err)
  }
}
