import type { SupabaseClient } from "@supabase/supabase-js"
import type { GeneratedQuestion } from "@/lib/ai/schemas"
import type { GenerationStatus, Question } from "@/types"
import {
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
  const { data: inserted, error } = await admin
    .from("questions")
    .insert({
      session_id: sessionId,
      topic: question.topic,
      difficulty: question.difficulty,
      multi_select: question.multiSelect,
      prompt: question.prompt,
      options: question.options,
      correct_option_ids: question.correctOptionIds,
      explanation: question.explanation,
      references: question.references,
      position,
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
      .filter(([, a]) => a.selectedOptionIds.length > 0 || a.skipped)
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
  const correct = [...correctIds].sort()
  const selected = [...selectedIds].sort()
  return (
    correct.length === selected.length &&
    correct.every((id, i) => id === selected[i])
  )
}

export async function updateStreak(
  admin: SupabaseClient,
  userId: string,
  timezone: string,
) {
  const today = getLocalDate(timezone)
  const { data: profile } = await admin
    .from("profiles")
    .select("streak_days, last_active_date")
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

  await admin
    .from("profiles")
    .update({ streak_days: streak, last_active_date: today })
    .eq("id", userId)
}

export async function updateTopicMastery(
  admin: SupabaseClient,
  userId: string,
  topic: string,
  isCorrect: boolean,
) {
  const { data: existing } = await admin
    .from("topic_mastery")
    .select("*")
    .eq("user_id", userId)
    .eq("topic", topic)
    .maybeSingle()

  const answered = (existing?.questions_answered ?? 0) + 1
  const prevMastery = Number(existing?.mastery ?? 50)
  const delta = isCorrect ? 5 : -3
  const mastery = Math.min(100, Math.max(0, prevMastery + delta))

  await admin.from("topic_mastery").upsert(
    {
      user_id: userId,
      topic,
      mastery,
      questions_answered: answered,
    },
    { onConflict: "user_id,topic" },
  )
}
