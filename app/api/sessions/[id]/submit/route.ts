import { NextResponse } from "next/server"
import { z } from "zod"
import { requireUser } from "@/lib/api/auth"
import { handleRouteError } from "@/lib/api/route-utils"
import { createAdminClient } from "@/lib/supabase/admin"
import {
  gradeAnswer,
  loadSession,
  updateStreak,
  updateTopicMastery,
} from "@/lib/db/sessions"
import type { DbQuestion } from "@/lib/db/mappers"

export const runtime = "nodejs"

const bodySchema = z.object({
  answers: z.record(z.string(), z.array(z.string())),
  timeUsedSec: z.number().int().min(0),
})

export async function POST(
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
      .select("*")
      .eq("id", sessionId)
      .eq("user_id", user.id)
      .single()

    if (!session) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 })
    }

    const { data: questions } = await admin
      .from("questions")
      .select("*")
      .eq("session_id", sessionId)
      .order("position")

    for (const q of (questions ?? []) as DbQuestion[]) {
      const selected = body.answers[q.id] ?? []
      const answered = selected.length > 0
      const isCorrect = answered
        ? gradeAnswer(q.correct_option_ids, selected)
        : false

      const { data: existing } = await admin
        .from("answers")
        .select("marked_for_review")
        .eq("session_id", sessionId)
        .eq("question_id", q.id)
        .maybeSingle()

      await admin.from("answers").upsert(
        {
          session_id: sessionId,
          question_id: q.id,
          selected_option_ids: selected,
          is_correct: isCorrect,
          marked_for_review: existing?.marked_for_review ?? false,
          skipped: !answered,
          time_spent_sec: 0,
          answered_at: new Date().toISOString(),
        },
        { onConflict: "session_id,question_id" },
      )

      if (answered) {
        await updateTopicMastery(admin, user.id, q.topic, isCorrect)
      }
    }

    await admin
      .from("sessions")
      .update({
        status: "completed",
        completed_at: new Date().toISOString(),
        time_used_sec: body.timeUsedSec,
      })
      .eq("id", sessionId)

    const { data: profile } = await admin
      .from("profiles")
      .select("timezone")
      .eq("id", user.id)
      .single()

    await updateStreak(admin, user.id, profile?.timezone ?? "UTC")

    const updated = await loadSession(admin, sessionId, user.id)
    return NextResponse.json(updated)
  } catch (err) {
    return handleRouteError(err)
  }
}
