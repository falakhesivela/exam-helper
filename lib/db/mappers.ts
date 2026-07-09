import type {
  AnswerRecord,
  DragAnswer,
  DragQuestionData,
  GenerationStatus,
  PlanEffort,
  PracticeSession,
  Question,
  QuestionOption,
  QuestionType,
  StudyPlan,
  StudyPlanTask,
  StudyTaskStatus,
  StudyTaskType,
  TopicMastery,
  UserProfile,
} from "@/types"
import type { GeneratedQuestion } from "@/lib/ai/schemas"
import { isGeneratedDrag, isGeneratedMcq } from "@/lib/ai/schemas"
import { isTier, limitsFor } from "@/lib/config/tiers"

export interface DbProfile {
  id: string
  name: string
  email: string
  plan: "free" | "pro" | "exam_pass"
  subscription_status: string | null
  plan_expires_at?: string | null
  paddle_subscription_id: string | null
  paddle_customer_id: string | null
  daily_limit: number
  streak_days: number
  longest_streak: number
  daily_goal: number
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
  plan_task_id?: string | null
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
  confidence?: "sure" | "unsure" | null
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
  if (question.questionType === "select_grid") {
    return {
      type: "select_grid",
      rows: question.rows,
      columns: question.columns,
      correctByRow: question.correctByRow,
    }
  }
  if (question.questionType === "command_input") {
    return {
      type: "command_input",
      commandContext: question.commandContext ?? null,
      acceptedAnswers: question.acceptedAnswers,
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
    case "select_grid":
      return { ...data, correctByRow: {} }
    case "command_input":
      return { ...data, acceptedAnswers: [] }
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
    confidence: row.confidence ?? undefined,
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
  options?: { dailyLimit?: number | null; isAnonymous?: boolean },
): UserProfile {
  const limits = limitsFor(profile.plan)
  return {
    name: profile.name,
    email: profile.email,
    isAnonymous: options?.isAnonymous ?? false,
    plan: isTier(profile.plan) ? profile.plan : "free",
    subscriptionStatus: profile.subscription_status ?? null,
    planExpiresAt: profile.plan_expires_at ?? null,
    limits,
    // null = unlimited; `undefined` (option not passed) falls back to limits.
    dailyLimit:
      options?.dailyLimit !== undefined ? options.dailyLimit : limits.questions,
    questionsUsedToday,
    streakDays: profile.streak_days,
    longestStreak: profile.longest_streak ?? 0,
    dailyGoal: profile.daily_goal ?? 10,
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

export interface DbStudyPlanTask {
  id: string
  day_index: number
  scheduled_date: string
  type: StudyTaskType
  domain_id: string | null
  domain_name: string | null
  question_count: number
  title: string
  rationale: string
  status: StudyTaskStatus
}

export interface DbStudyPlan {
  id: string
  exam_code: string
  exam: string
  start_date: string
  target_date: string
  target_score: number
  projected_score: number
  rest_days: number[] | null
  effort: PlanEffort | null
}

export function toStudyPlanTask(row: DbStudyPlanTask): StudyPlanTask {
  return {
    id: row.id,
    dayIndex: row.day_index,
    scheduledDate: row.scheduled_date,
    type: row.type,
    domainId: row.domain_id ?? undefined,
    domainName: row.domain_name ?? undefined,
    questionCount: row.question_count,
    title: row.title,
    rationale: row.rationale,
    status: row.status,
  }
}

export function toStudyPlan(
  row: DbStudyPlan,
  tasks: DbStudyPlanTask[],
): StudyPlan {
  return {
    id: row.id,
    examCode: row.exam_code,
    exam: row.exam,
    startDate: row.start_date,
    targetDate: row.target_date,
    targetScore: row.target_score,
    projectedScore: row.projected_score,
    restDays: row.rest_days ?? [],
    effort: row.effort ?? "standard",
    tasks: tasks
      .map(toStudyPlanTask)
      .sort((a, b) => a.dayIndex - b.dayIndex),
  }
}
