import type {
  AnswerRecord,
  GenerationStatus,
  PracticeSession,
  Question,
  QuestionOption,
  TopicMastery,
  UserProfile,
} from "@/types"

export interface DbProfile {
  id: string
  name: string
  email: string
  plan: "free" | "pro"
  daily_limit: number
  streak_days: number
  last_active_date: string | null
  timezone: string
}

export interface DbSession {
  id: string
  user_id: string
  exam: string
  exam_code: string
  focus_topics: string[]
  status: "in-progress" | "completed"
  mode: "practice" | "exam"
  duration_sec: number | null
  time_used_sec: number | null
  pass_mark: number | null
  current_index: number
  expected_question_count?: number
  generation_status?: GenerationStatus
  created_at: string
  completed_at: string | null
}

export interface DbQuestion {
  id: string
  session_id: string
  topic: string
  difficulty: "easy" | "medium" | "hard"
  multi_select: boolean
  prompt: string
  options: QuestionOption[]
  correct_option_ids: string[]
  explanation: string
  references: { label: string; url: string }[]
  position: number
}

export interface DbQuestionPublic {
  id: string
  session_id: string
  topic: string
  difficulty: "easy" | "medium" | "hard"
  multi_select: boolean
  prompt: string
  options: QuestionOption[]
  references: { label: string; url: string }[]
  position: number
}

export interface DbAnswer {
  session_id: string
  question_id: string
  selected_option_ids: string[]
  is_correct: boolean
  marked_for_review: boolean
  skipped: boolean
  time_spent_sec: number
}

export function toQuestion(
  row: DbQuestion | DbQuestionPublic,
  full?: DbQuestion,
): Question {
  const source = full ?? (row as DbQuestion)
  return {
    id: row.id,
    topic: row.topic,
    difficulty: row.difficulty,
    multiSelect: row.multi_select,
    prompt: row.prompt,
    options: row.options,
    correctOptionIds: "correct_option_ids" in source ? source.correct_option_ids : [],
    explanation: "explanation" in source ? source.explanation : "",
    references: row.references ?? [],
  }
}

export function toAnswerRecord(row: DbAnswer): AnswerRecord {
  return {
    questionId: row.question_id,
    selectedOptionIds: row.selected_option_ids,
    isCorrect: row.is_correct,
    markedForReview: row.marked_for_review,
    skipped: row.skipped,
    timeSpentSec: row.time_spent_sec,
  }
}

export function toPracticeSession(
  session: DbSession,
  questions: Question[],
  answers: Record<string, AnswerRecord>,
): PracticeSession {
  return {
    id: session.id,
    exam: session.exam,
    examCode: session.exam_code,
    focusTopics: session.focus_topics,
    createdAt: session.created_at,
    completedAt: session.completed_at ?? undefined,
    status: session.status,
    questions,
    answers,
    currentIndex: session.current_index,
    mode: session.mode,
    durationSec: session.duration_sec ?? undefined,
    timeUsedSec: session.time_used_sec ?? undefined,
    passMark: session.pass_mark ?? undefined,
    expectedQuestionCount: session.expected_question_count || undefined,
    generationStatus: session.generation_status ?? "complete",
  }
}

export function toUserProfile(
  profile: DbProfile,
  questionsUsedToday: number,
  options?: { dailyLimit?: number },
): UserProfile {
  return {
    name: profile.name,
    email: profile.email,
    plan: profile.plan,
    dailyLimit: options?.dailyLimit ?? profile.daily_limit,
    questionsUsedToday,
    streakDays: profile.streak_days,
  }
}

export function toTopicMastery(row: {
  topic: string
  mastery: number
  questions_answered: number
}): TopicMastery {
  return {
    topic: row.topic,
    mastery: Number(row.mastery),
    questionsAnswered: row.questions_answered,
  }
}

export function stripAnswersForExam(
  questions: Question[],
  mode: "practice" | "exam",
  status: "in-progress" | "completed",
  answeredIds: Set<string>,
): Question[] {
  if (status === "completed") return questions
  if (mode === "exam") {
    return questions.map((q) => ({
      ...q,
      correctOptionIds: [],
      explanation: "",
    }))
  }
  return questions.map((q) => {
    if (answeredIds.has(q.id)) return q
    return { ...q, correctOptionIds: [], explanation: "" }
  })
}
