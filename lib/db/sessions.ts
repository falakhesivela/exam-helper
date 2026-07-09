import type { SupabaseClient } from "@supabase/supabase-js"
import type { GeneratedQuestion } from "@/lib/ai/schemas"
import type { DragAnswer, GenerationStatus, Question } from "@/types"
import {
  generatedQuestionToDb,
  stripAnswersForExam,
  toAnswerRecord,
  toPracticeSession,
  toQuestion,
  type DbAnswer,
  type DbQuestion,
  type DbSession,
} from "./mappers"
import { getLocalDate } from "./usage"

export interface CreateSessionShellParams {
  exam: string
  examCode: string
  focusTopics: string[]
  mode: "practice" | "exam"
  expectedQuestionCount: number
  durationSec?: number
  passMark?: number
  /** Study-plan task this session fulfills; completing it marks the task done. */
  planTaskId?: string
}

export async function createSessionShell(
  admin: SupabaseClient,
  userId: string,
  params: CreateSessionShellParams,
) {
  const { data: session, error } = await admin
    .from("sessions")
    .insert({
      user_id: userId,
      exam: params.exam,
      exam_code: params.examCode,
      focus_topics: params.focusTopics,
      mode: params.mode,
      status: "in-progress",
      duration_sec: params.durationSec ?? null,
      pass_mark: params.passMark ?? null,
      current_index: 0,
      expected_question_count: params.expectedQuestionCount,
      generation_status: "generating",
      plan_task_id: params.planTaskId ?? null,
    })
    .select()
    .single()

  if (error || !session) throw error ?? new Error("Failed to create session")
  return session as DbSession
}

export async function appendQuestion(
  admin: SupabaseClient,
  sessionId: string,
  question: GeneratedQuestion,
  position: number,
): Promise<Question> {
  const row = generatedQuestionToDb(question)
  const { data: inserted, error } = await admin
    .from("questions")
    .insert({
      session_id: sessionId,
      position,
      ...row,
    })
    .select()
    .single()

  if (error || !inserted) throw error ?? new Error("Failed to save question")
  return toQuestion(inserted as DbQuestion)
}

export async function finalizeSessionGeneration(
  admin: SupabaseClient,
  sessionId: string,
  status: Extract<GenerationStatus, "complete" | "failed">,
) {
  const { error } = await admin
    .from("sessions")
    .update({ generation_status: status })
    .eq("id", sessionId)

  if (error) throw error
}

export async function loadSession(
  admin: SupabaseClient,
  sessionId: string,
  userId: string,
) {
  const { data: session, error } = await admin
    .from("sessions")
    .select("*")
    .eq("id", sessionId)
    .eq("user_id", userId)
    .single()

  if (error || !session) return null

  const { data: questions } = await admin
    .from("questions")
    .select("*")
    .eq("session_id", sessionId)
    .order("position")

  const { data: answers } = await admin
    .from("answers")
    .select("*")
    .eq("session_id", sessionId)

  const answerMap: Record<string, ReturnType<typeof toAnswerRecord>> = {}
  for (const a of answers ?? []) {
    answerMap[a.question_id] = toAnswerRecord(a as DbAnswer)
  }

  const answeredIds = new Set(
    Object.entries(answerMap)
      .filter(
        ([, a]) =>
          a.selectedOptionIds.length > 0 ||
          a.dragAnswer != null ||
          a.skipped,
      )
      .map(([id]) => id),
  )

  const mappedQuestions = (questions ?? []).map((q) =>
    toQuestion(q as DbQuestion),
  )

  const visible = stripAnswersForExam(
    mappedQuestions,
    session.mode,
    session.status,
    answeredIds,
  )

  return toPracticeSession(session as DbSession, visible, answerMap)
}

export async function loadSessions(
  admin: SupabaseClient,
  userId: string,
): Promise<ReturnType<typeof toPracticeSession>[]> {
  const { data: sessions } = await admin
    .from("sessions")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })

  const result = []
  for (const s of sessions ?? []) {
    const loaded = await loadSession(admin, s.id, userId)
    if (loaded) result.push(loaded)
  }
  return result
}

export async function persistSession(
  admin: SupabaseClient,
  userId: string,
  params: {
    exam: string
    examCode: string
    focusTopics: string[]
    mode: "practice" | "exam"
    questions: GeneratedQuestion[]
    durationSec?: number
    passMark?: number
  },
) {
  const session = await createSessionShell(admin, userId, {
    exam: params.exam,
    examCode: params.examCode,
    focusTopics: params.focusTopics,
    mode: params.mode,
    expectedQuestionCount: params.questions.length,
    durationSec: params.durationSec,
    passMark: params.passMark,
  })

  const questions: Question[] = []
  for (let i = 0; i < params.questions.length; i++) {
    questions.push(
      await appendQuestion(admin, session.id, params.questions[i], i),
    )
  }

  await finalizeSessionGeneration(admin, session.id, "complete")

  const visible = stripAnswersForExam(
    questions,
    params.mode,
    "in-progress",
    new Set(),
  )

  return toPracticeSession(
    { ...session, generation_status: "complete" },
    visible,
    {},
  )
}

export function gradeAnswer(
  correctIds: string[],
  selectedIds: string[],
): boolean {
  // Option ids are a set — dedupe both sides so a duplicate id in a stored
  // answer key (e.g. a malformed ["b","b"]) can't fail a correct selection.
  const correct = [...new Set(correctIds)].sort()
  const selected = [...new Set(selectedIds)].sort()
  return (
    correct.length === selected.length &&
    correct.every((id, i) => id === selected[i])
  )
}

export function gradeDragAnswer(
  dragData: Question["dragData"],
  answer: DragAnswer | undefined,
): boolean {
  if (!dragData || !answer || dragData.type !== answer.type) return false

  if (dragData.type === "drag_match" && answer.type === "drag_match") {
    const keys = Object.keys(dragData.correctMatch).sort()
    if (keys.length === 0) return false
    return keys.every((k) => dragData.correctMatch[k] === answer.mapping[k])
  }

  if (dragData.type === "drag_order" && answer.type === "drag_order") {
    if (dragData.correctOrder.length === 0) return false
    return (
      dragData.correctOrder.length === answer.order.length &&
      dragData.correctOrder.every((id, i) => id === answer.order[i])
    )
  }

  if (dragData.type === "drag_categorize" && answer.type === "drag_categorize") {
    const keys = Object.keys(dragData.correctBuckets).sort()
    if (keys.length === 0) return false
    return keys.every((catId) => {
      const expected = [...(dragData.correctBuckets[catId] ?? [])].sort()
      const actual = [...(answer.buckets[catId] ?? [])].sort()
      return (
        expected.length === actual.length &&
        expected.every((id, i) => id === actual[i])
      )
    })
  }

  if (dragData.type === "select_grid" && answer.type === "select_grid") {
    const rowIds = Object.keys(dragData.correctByRow)
    if (rowIds.length === 0) return false
    return rowIds.every(
      (rowId) => dragData.correctByRow[rowId] === answer.selections[rowId],
    )
  }

  if (dragData.type === "command_input" && answer.type === "command_input") {
    const accepted = (dragData.acceptedAnswers ?? [])
      .map((a) => normalizeCommand(a))
      .filter(Boolean)
    if (accepted.length === 0) return false
    return accepted.includes(normalizeCommand(answer.value ?? ""))
  }

  return false
}

/** Tolerant command matching: trim, collapse whitespace, casefold. */
export function normalizeCommand(value: string): string {
  return value.trim().replace(/\s+/g, " ").toLowerCase()
}

export async function updateStreak(
  admin: SupabaseClient,
  userId: string,
  timezone: string,
) {
  const today = getLocalDate(timezone)
  const { data: profile } = await admin
    .from("profiles")
    .select("streak_days, last_active_date, longest_streak")
    .eq("id", userId)
    .single()

  if (!profile) return

  const last = profile.last_active_date
  let streak = profile.streak_days ?? 0

  if (!last) {
    streak = 1
  } else {
    const lastDate = new Date(`${last}T00:00:00Z`)
    const todayDate = new Date(`${today}T00:00:00Z`)
    const diffDays = Math.round(
      (todayDate.getTime() - lastDate.getTime()) / (24 * 60 * 60 * 1000),
    )
    if (diffDays === 0) {
      // same day — keep streak
    } else if (diffDays === 1) {
      streak += 1
    } else {
      streak = 1
    }
  }

  const longestStreak = Math.max(profile.longest_streak ?? 0, streak)

  await admin
    .from("profiles")
    .update({
      streak_days: streak,
      last_active_date: today,
      longest_streak: longestStreak,
    })
    .eq("id", userId)
}

export async function updateTopicMastery(
  admin: SupabaseClient,
  userId: string,
  topic: string,
  isCorrect: boolean,
) {
  await batchUpdateTopicMastery(admin, userId, [{ topic, isCorrect }])
}

export async function batchUpdateTopicMastery(
  admin: SupabaseClient,
  userId: string,
  events: { topic: string; isCorrect: boolean }[],
) {
  if (events.length === 0) return

  const topics = [...new Set(events.map((e) => e.topic))]

  const { data: existingRows } = await admin
    .from("topic_mastery")
    .select("*")
    .eq("user_id", userId)
    .in("topic", topics)

  const state = new Map<string, { mastery: number; questions_answered: number }>()
  for (const topic of topics) {
    const existing = existingRows?.find((r) => r.topic === topic)
    state.set(topic, {
      mastery: Number(existing?.mastery ?? 50),
      questions_answered: existing?.questions_answered ?? 0,
    })
  }

  for (const event of events) {
    const current = state.get(event.topic)!
    const delta = event.isCorrect ? 5 : -3
    state.set(event.topic, {
      mastery: Math.min(100, Math.max(0, current.mastery + delta)),
      questions_answered: current.questions_answered + 1,
    })
  }

  const rows = [...state.entries()].map(([topic, { mastery, questions_answered }]) => ({
    user_id: userId,
    topic,
    mastery,
    questions_answered,
  }))

  const { error } = await admin
    .from("topic_mastery")
    .upsert(rows, { onConflict: "user_id,topic" })

  if (error) throw error
}
