import { NextResponse } from "next/server"
import { z } from "zod"
import { requireUser } from "@/lib/api/auth"
import { getTimezone, handleRouteError } from "@/lib/api/route-utils"
import { createAdminClient } from "@/lib/supabase/admin"
import {
  gradeAnswer,
  gradeDragAnswer,
  updateTopicMastery,
} from "@/lib/db/sessions"
import {
  loadMissedQuestions,
  scheduleQuestionReview,
} from "@/lib/db/missed-questions"
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
])

const bodySchema = z.object({
  selectedOptionIds: z.array(z.string()).default([]),
  dragAnswer: dragAnswerSchema.optional(),
  timeSpentSec: z.number().int().min(0).default(0),
})

export async function POST(
  request: Request,
  { params }: { params: Promise<{ questionId: string }> },
) {
  try {
    const user = await requireUser()
    const { questionId } = await params
    const body = bodySchema.parse(await request.json())
    const admin = createAdminClient()

    await enforceFreemium(admin, user.id, 1)

    const { data: question } = await admin
      .from("questions")
      .select("*")
      .eq("id", questionId)
      .single()

    if (!question) {
      return NextResponse.json({ error: "Question not found" }, { status: 404 })
    }

    const q = question as DbQuestion

    const { data: session } = await admin
      .from("sessions")
      .select("user_id, exam_code")
      .eq("id", q.session_id)
      .eq("user_id", user.id)
      .single()

    if (!session) {
      return NextResponse.json({ error: "Question not found" }, { status: 404 })
    }

    const questionType = q.question_type ?? "mcq"
    const mapped = toQuestion(q)

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

    const { data: profile } = await admin
      .from("profiles")
      .select("timezone")
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
      await scheduleQuestionReview(admin, user.id, questionId, isCorrect)
    }

    const remaining = await loadMissedQuestions(admin, user.id, { limit: 30 })

    return NextResponse.json({
      isCorrect,
      question: mapped,
      remainingCount: remaining.length,
    })
  } catch (err) {
    return handleRouteError(err)
  }
}
