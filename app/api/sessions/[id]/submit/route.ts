import { NextResponse } from "next/server"
import { z } from "zod"
import { requireUser } from "@/lib/api/auth"
import { handleRouteError } from "@/lib/api/route-utils"
import { createAdminClient } from "@/lib/supabase/admin"
import {
  toAnswerRecord,
  toPracticeSession,
  toQuestion,
  type DbAnswer,
  type DbQuestion,
  type DbSession,
} from "@/lib/db/mappers"
import {
  batchUpdateTopicMastery,
  gradeAnswer,
  gradeDragAnswer,
  updateStreak,
} from "@/lib/db/sessions"
import { scheduleQuestionReview } from "@/lib/db/missed-questions"
import { buildMasteryTopicKey } from "@/lib/exams/mastery-keys"
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
  answers: z.record(z.string(), z.array(z.string())),
  dragAnswers: z.record(z.string(), dragAnswerSchema).optional().default({}),
  flagged: z.array(z.string()).optional().default([]),
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

    const [{ data: session }, { data: questions }, { data: profile }] =
      await Promise.all([
        admin
          .from("sessions")
          .select("*")
          .eq("id", sessionId)
          .eq("user_id", user.id)
          .single(),
        admin
          .from("questions")
          .select("*")
          .eq("session_id", sessionId)
          .order("position"),
        admin.from("profiles").select("timezone").eq("id", user.id).single(),
      ])

    if (!session) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 })
    }

    const flaggedSet = new Set(body.flagged)
    const answeredAt = new Date().toISOString()
    const answerRows: Array<
      DbAnswer & { answered_at: string }
    > = []
    const masteryEvents: { topic: string; isCorrect: boolean }[] = []
    const reviewSchedules: Promise<void>[] = []

    for (const row of (questions ?? []) as DbQuestion[]) {
      const selected = body.answers[row.id] ?? []
      const dragAnswer = body.dragAnswers[row.id]
      const questionType = row.question_type ?? "mcq"
      const answered =
        questionType === "mcq"
          ? selected.length > 0
          : isQuestionAnswered(
              {
                id: row.id,
                topic: row.topic,
                difficulty: row.difficulty,
                questionType,
                prompt: row.prompt,
                dragData: row.drag_data ?? undefined,
                explanation: row.explanation,
                references: row.references ?? [],
              },
              selected,
              dragAnswer,
            )

      const isCorrect = answered
        ? questionType === "mcq"
          ? gradeAnswer(row.correct_option_ids, selected)
          : gradeDragAnswer(row.drag_data ?? undefined, dragAnswer)
        : false

      answerRows.push({
        session_id: sessionId,
        question_id: row.id,
        selected_option_ids: selected,
        drag_answer: dragAnswer ?? null,
        is_correct: isCorrect,
        marked_for_review: flaggedSet.has(row.id),
        skipped: !answered,
        time_spent_sec: 0,
        answered_at: answeredAt,
      })

      if (answered) {
        masteryEvents.push({
          topic: buildMasteryTopicKey(session.exam_code, row.topic, row.domain_id),
          isCorrect,
        })
        if (!isCorrect) {
          reviewSchedules.push(
            scheduleQuestionReview(admin, user.id, row.id, false),
          )
        }
      }
    }

    const completedAt = new Date().toISOString()

    const { error: answersError } = await admin
      .from("answers")
      .upsert(answerRows, { onConflict: "session_id,question_id" })

    if (answersError) throw answersError

    await Promise.all([
      admin
        .from("sessions")
        .update({
          status: "completed",
          completed_at: completedAt,
          time_used_sec: body.timeUsedSec,
        })
        .eq("id", sessionId),
      batchUpdateTopicMastery(admin, user.id, masteryEvents),
      updateStreak(admin, user.id, profile?.timezone ?? "UTC"),
      ...reviewSchedules,
    ])

    const mappedQuestions = (questions ?? []).map((q) =>
      toQuestion(q as DbQuestion),
    )
    const answerMap: Record<string, ReturnType<typeof toAnswerRecord>> = {}
    for (const row of answerRows) {
      answerMap[row.question_id] = toAnswerRecord(row)
    }

    const updatedSession: DbSession = {
      ...(session as DbSession),
      status: "completed",
      completed_at: completedAt,
      time_used_sec: body.timeUsedSec,
    }

    const result = toPracticeSession(updatedSession, mappedQuestions, answerMap)
    return NextResponse.json(result)
  } catch (err) {
    return handleRouteError(err)
  }
}
