import { NextResponse } from "next/server"
import { z } from "zod"
import { requireUser } from "@/lib/api/auth"
import { getTimezone, handleRouteError } from "@/lib/api/route-utils"
import { getFreeDailyQuestionLimit } from "@/lib/config/freemium"
import { createAdminClient } from "@/lib/supabase/admin"
import {
  gradeAnswer,
  gradeDragAnswer,
  loadSession,
  updateTopicMastery,
} from "@/lib/db/sessions"
import { scheduleQuestionReview } from "@/lib/db/missed-questions"
import { buildMasteryTopicKey } from "@/lib/exams/mastery-keys"
import { enforceFreemium, incrementUsage } from "@/lib/db/usage"
import { toQuestion, type DbQuestion } from "@/lib/db/mappers"
import { isQuestionAnswered } from "@/lib/session-utils"

export const runtime = "nodejs"

const dragAnswerSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("drag_match"),
    mapping: z.record(z.string(), z.string()),
  }),
  z.object({
    type: z.literal("drag_order"),
    order: z.array(z.string()),
  }),
  z.object({
    type: z.literal("drag_categorize"),
    buckets: z.record(z.string(), z.array(z.string())),
  }),
  z.object({
    type: z.literal("select_grid"),
    selections: z.record(z.string(), z.string()),
  }),
])

const bodySchema = z.object({
  questionId: z.string().uuid(),
  selectedOptionIds: z.array(z.string()).default([]),
  dragAnswer: dragAnswerSchema.optional(),
  timeSpentSec: z.number().int().min(0).default(0),
  confidence: z.enum(["sure", "unsure"]).optional(),
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
    const mapped = toQuestion(q)
    const questionType = q.question_type ?? "mcq"
    const answered = isQuestionAnswered(
      mapped,
      body.selectedOptionIds,
      body.dragAnswer,
    )

    const isCorrect = answered
      ? questionType === "mcq"
        ? gradeAnswer(q.correct_option_ids, body.selectedOptionIds)
        : gradeDragAnswer(q.drag_data ?? undefined, body.dragAnswer)
      : false

    await admin.from("answers").upsert(
      {
        session_id: sessionId,
        question_id: body.questionId,
        selected_option_ids: body.selectedOptionIds,
        drag_answer: body.dragAnswer ?? null,
        is_correct: isCorrect,
        marked_for_review: false,
        skipped: !answered,
        time_spent_sec: body.timeSpentSec,
        answered_at: new Date().toISOString(),
        confidence: body.confidence ?? null,
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

    if (answered) {
      await updateTopicMastery(
        admin,
        user.id,
        buildMasteryTopicKey(session.exam_code, q.topic, q.domain_id),
        isCorrect,
      )
      if (!isCorrect) {
        await scheduleQuestionReview(admin, user.id, body.questionId, false)
      } else {
        await scheduleQuestionReview(admin, user.id, body.questionId, true)
      }
    }

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
        dragAnswer: body.dragAnswer,
        isCorrect,
        markedForReview: false,
        skipped: !answered,
        timeSpentSec: body.timeSpentSec,
        confidence: body.confidence,
      },
      question: revealedQuestion,
      session: updatedSession,
      remainingFreeQuestions: remaining,
    })
  } catch (err) {
    return handleRouteError(err)
  }
}
