import { NextResponse } from "next/server"
import { z } from "zod"
import { requireUser } from "@/lib/api/auth"
import { getTimezone, handleRouteError } from "@/lib/api/route-utils"
import { getFreeDailyQuestionLimit } from "@/lib/config/freemium"
import { createAdminClient } from "@/lib/supabase/admin"
import {
  gradeAnswer,
  loadSession,
  updateTopicMastery,
} from "@/lib/db/sessions"
import { enforceFreemium, incrementUsage } from "@/lib/db/usage"
import { toQuestion, type DbQuestion } from "@/lib/db/mappers"

export const runtime = "nodejs"

const bodySchema = z.object({
  questionId: z.string().uuid(),
  selectedOptionIds: z.array(z.string()).min(1),
  timeSpentSec: z.number().int().min(0).default(0),
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
      .select("*")
      .eq("id", sessionId)
      .eq("user_id", user.id)
      .single()

    if (!session) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 })
    }

    if (session.mode !== "practice") {
      return NextResponse.json(
        { error: "Answer reveal only available in practice mode" },
        { status: 400 },
      )
    }

    await enforceFreemium(admin, user.id, 1)

    const { data: question } = await admin
      .from("questions")
      .select("*")
      .eq("id", body.questionId)
      .eq("session_id", sessionId)
      .single()

    if (!question) {
      return NextResponse.json({ error: "Question not found" }, { status: 404 })
    }

    const q = question as DbQuestion
    const isCorrect = gradeAnswer(q.correct_option_ids, body.selectedOptionIds)

    await admin.from("answers").upsert(
      {
        session_id: sessionId,
        question_id: body.questionId,
        selected_option_ids: body.selectedOptionIds,
        is_correct: isCorrect,
        marked_for_review: false,
        skipped: false,
        time_spent_sec: body.timeSpentSec,
        answered_at: new Date().toISOString(),
      },
      { onConflict: "session_id,question_id" },
    )

    const { data: profile } = await admin
      .from("profiles")
      .select("timezone, plan")
      .eq("id", user.id)
      .single()

    await incrementUsage(
      admin,
      user.id,
      profile?.timezone ?? getTimezone(request),
      1,
    )

    await updateTopicMastery(admin, user.id, q.topic, isCorrect)

    const used = profile
      ? await import("@/lib/db/usage").then((m) =>
          m.getTodayUsage(admin, user.id, profile.timezone ?? "UTC"),
        )
      : 0

    const remaining =
      profile?.plan === "pro"
        ? Infinity
        : Math.max(0, getFreeDailyQuestionLimit() - used)

    const revealedQuestion = toQuestion(q)
    const updatedSession = await loadSession(admin, sessionId, user.id)

    return NextResponse.json({
      answer: {
        questionId: body.questionId,
        selectedOptionIds: body.selectedOptionIds,
        isCorrect,
        markedForReview: false,
        skipped: false,
        timeSpentSec: body.timeSpentSec,
      },
      question: revealedQuestion,
      session: updatedSession,
      remainingFreeQuestions: remaining,
    })
  } catch (err) {
    return handleRouteError(err)
  }
}
