import type {
  AnswerRecord,
  DragAnswer,
  DragQuestionData,
  GenerationStatus,
  PracticeSession,
  Question,
  QuestionOption,
  QuestionType,
  TopicMastery,
  UserProfile,
} from "@/types"
import type { GeneratedQuestion } from "@/lib/ai/schemas"
import { isGeneratedDrag, isGeneratedMcq } from "@/lib/ai/schemas"

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
  question_type?: QuestionType
  scenario?: string | null
  domain_id?: string | null
  multi_select: boolean
  prompt: string
  options: QuestionOption[]
  correct_option_ids: string[]
  drag_data?: DragQuestionData | null
  explanation: string
  references: { label: string; url: string }[]
  position: number
}

export interface DbQuestionPublic {
  id: string
  session_id: string
  topic: string
  difficulty: "easy" | "medium" | "hard"
  question_type?: QuestionType
  scenario?: string | null
  domain_id?: string | null
  multi_select: boolean
  prompt: string
  options: QuestionOption[]
  drag_data?: DragQuestionData | null
  references: { label: string; url: string }[]
  position: number
}

export interface DbAnswer {
  session_id: string
  question_id: string
  selected_option_ids: string[]
  drag_answer?: DragAnswer | null
  is_correct: boolean
  marked_for_review: boolean
  skipped: boolean
  time_spent_sec: number
  answered_at?: string | null
}

function generatedToDragData(question: GeneratedQuestion): DragQuestionData | undefined {
  if (!isGeneratedDrag(question)) return undefined
  if (question.questionType === "drag_match") {
    return {
      type: "drag_match",
      items: question.items,
      targets: question.targets,
      correctMatch: question.correctMatch,
    }
  }
  if (question.questionType === "drag_order") {
    return {
      type: "drag_order",
      items: question.items,
      correctOrder: question.correctOrder,
    }
  }
  return {
    type: "drag_categorize",
    categories: question.categories,
    items: question.items,
    correctBuckets: question.correctBuckets,
  }
}

export function generatedQuestionToDb(question: GeneratedQuestion) {
  const questionType = question.questionType ?? "mcq"
  const scenario = question.scenario?.trim() || null
  const domainId = question.domainId ?? null

  if (isGeneratedMcq(question)) {
    return {
      topic: question.topic,
      difficulty: question.difficulty,
      question_type: "mcq" as const,
      scenario,
      domain_id: domainId,
      multi_select: question.multiSelect,
      prompt: question.prompt,
      options: question.options,
      correct_option_ids: question.correctOptionIds,
      drag_data: null,
      explanation: question.explanation,
      references: question.references,
    }
  }

  return {
    topic: question.topic,
    difficulty: question.difficulty,
    question_type: questionType,
    scenario,
    domain_id: domainId,
    multi_select: false,
    prompt: question.prompt,
    options: [],
    correct_option_ids: [],
    drag_data: generatedToDragData(question),
    explanation: question.explanation,
    references: question.references,
  }
}

function stripDragAnswerKey(data: DragQuestionData): DragQuestionData {
  switch (data.type) {
    case "drag_match":
      return { ...data, correctMatch: {} }
    case "drag_order":
      return { ...data, correctOrder: [] }
    case "drag_categorize":
      return { ...data, correctBuckets: {} }
  }
}

export function toQuestion(
  row: DbQuestion | DbQuestionPublic,
  full?: DbQuestion,
): Question {
  const source = full ?? (row as DbQuestion)
  const questionType = row.question_type ?? "mcq"
  const dragData = row.drag_data ?? undefined

  return {
    id: row.id,
    topic: row.topic,
    difficulty: row.difficulty,
    questionType,
    scenario: row.scenario ?? undefined,
    domainId: row.domain_id ?? undefined,
    prompt: row.prompt,
    multiSelect: row.multi_select,
    options: row.options ?? [],
    correctOptionIds:
      "correct_option_ids" in source ? source.correct_option_ids : [],
    dragData,
    explanation: "explanation" in source ? source.explanation : "",
    references: row.references ?? [],
  }
}

export function toAnswerRecord(row: DbAnswer): AnswerRecord {
  return {
    questionId: row.question_id,
    selectedOptionIds: row.selected_option_ids,
    dragAnswer: row.drag_answer ?? undefined,
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
      dragData: q.dragData ? stripDragAnswerKey(q.dragData) : undefined,
    }))
  }
  return questions.map((q) => {
    if (answeredIds.has(q.id)) return q
    return {
      ...q,
      correctOptionIds: [],
      explanation: "",
      dragData: q.dragData ? stripDragAnswerKey(q.dragData) : undefined,
    }
  })
}
