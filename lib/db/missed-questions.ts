import type { SupabaseClient } from "@supabase/supabase-js"
import type { DragAnswer, Question } from "@/types"
import { toQuestion, type DbAnswer, type DbQuestion, type DbSession } from "./mappers"

export interface MissedQuestionItem {
  questionId: string
  sessionId: string
  exam: string
  examCode: string
  answeredAt: string
  lastSelectedOptionIds: string[]
  lastDragAnswer?: DragAnswer
  question: Question
  /** Present when spaced-repetition schedule exists. */
  nextReviewAt?: string
  intervalDays?: number
}

export async function loadMissedQuestions(
  admin: SupabaseClient,
  userId: string,
  options: { limit?: number; dueOnly?: boolean } = {},
): Promise<MissedQuestionItem[]> {
  const limit = options.limit ?? 30

  const { data: sessions } = await admin
    .from("sessions")
    .select("id, exam, exam_code, status")
    .eq("user_id", userId)
    .eq("status", "completed")

  const sessionIds = (sessions ?? []).map((s) => s.id)
  if (sessionIds.length === 0) return []

  const sessionMap = new Map(
    (sessions ?? []).map((s) => [s.id, s as DbSession]),
  )

  const { data: answers } = await admin
    .from("answers")
    .select("*")
    .in("session_id", sessionIds)
    .eq("is_correct", false)
    .eq("skipped", false)
    .order("answered_at", { ascending: false })

  if (!answers?.length) return []

  const questionIds = [...new Set(answers.map((a) => a.question_id))]

  const { data: questions } = await admin
    .from("questions")
    .select("*")
    .in("id", questionIds)

  const questionMap = new Map(
    (questions ?? []).map((q) => [q.id, q as DbQuestion]),
  )

  let scheduleMap = new Map<
    string,
    { next_review_at: string; interval_days: number }
  >()

  if (options.dueOnly) {
    const { data: schedules } = await admin
      .from("review_schedule")
      .select("question_id, next_review_at, interval_days")
      .eq("user_id", userId)
      .lte("next_review_at", new Date().toISOString())

    scheduleMap = new Map(
      (schedules ?? []).map((s) => [
        s.question_id,
        {
          next_review_at: s.next_review_at,
          interval_days: s.interval_days,
        },
      ]),
    )
  } else {
    const { data: schedules } = await admin
      .from("review_schedule")
      .select("question_id, next_review_at, interval_days")
      .eq("user_id", userId)

    scheduleMap = new Map(
      (schedules ?? []).map((s) => [
        s.question_id,
        {
          next_review_at: s.next_review_at,
          interval_days: s.interval_days,
        },
      ]),
    )
  }

  const seen = new Set<string>()
  const items: MissedQuestionItem[] = []

  for (const row of answers as DbAnswer[]) {
    if (seen.has(row.question_id)) continue
    if (options.dueOnly && !scheduleMap.has(row.question_id)) continue

    const q = questionMap.get(row.question_id)
    const session = sessionMap.get(row.session_id)
    if (!q || !session) continue

    seen.add(row.question_id)
    const schedule = scheduleMap.get(row.question_id)

    items.push({
      questionId: row.question_id,
      sessionId: row.session_id,
      exam: session.exam,
      examCode: session.exam_code,
      answeredAt: row.answered_at ?? new Date().toISOString(),
      lastSelectedOptionIds: row.selected_option_ids,
      lastDragAnswer: row.drag_answer ?? undefined,
      question: toQuestion(q),
      nextReviewAt: schedule?.next_review_at,
      intervalDays: schedule?.interval_days,
    })

    if (items.length >= limit) break
  }

  return items
}

export async function scheduleQuestionReview(
  admin: SupabaseClient,
  userId: string,
  questionId: string,
  correct: boolean,
) {
  const { data: existing } = await admin
    .from("review_schedule")
    .select("*")
    .eq("user_id", userId)
    .eq("question_id", questionId)
    .maybeSingle()

  if (correct) {
    if (!existing) return
    const nextDays = Math.min(30, Math.max(1, existing.interval_days * 2))
    const nextReview = new Date()
    nextReview.setDate(nextReview.getDate() + nextDays)
    await admin.from("review_schedule").upsert(
      {
        user_id: userId,
        question_id: questionId,
        interval_days: nextDays,
        next_review_at: nextReview.toISOString(),
      },
      { onConflict: "user_id,question_id" },
    )
    return
  }

  const nextReview = new Date()
  nextReview.setDate(nextReview.getDate() + 1)
  await admin.from("review_schedule").upsert(
    {
      user_id: userId,
      question_id: questionId,
      interval_days: 1,
      next_review_at: nextReview.toISOString(),
    },
    { onConflict: "user_id,question_id" },
  )
}
