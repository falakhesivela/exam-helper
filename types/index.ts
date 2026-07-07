// Core domain types for Prepa

import type { Tier, TierLimits } from "@/lib/config/tiers"

export type { Tier, TierLimits }

/** A single answer option on a question. */
export interface QuestionOption {
  id: string // "a" | "b" | "c" | "d"
  text: string
}

export type QuestionType =
  | "mcq"
  | "drag_match"
  | "drag_order"
  | "drag_categorize"
  | "select_grid"

export interface DragItem {
  id: string
  text: string
}

export interface DropTarget {
  id: string
  label: string
}

/** One statement row in a select-grid (e.g. Azure-style Yes/No) question. */
export interface GridRow {
  id: string
  statement: string
}

/** A column choice shared across all grid rows (e.g. Yes / No). */
export interface GridColumn {
  id: string
  label: string
}

/**
 * Structured (non-MCQ) question payloads. Stored together in the `drag_data`
 * JSONB column; `select_grid` reuses the same storage/answer pipeline as drag.
 */
export type DragQuestionData =
  | {
      type: "drag_match"
      items: DragItem[]
      targets: DropTarget[]
      correctMatch: Record<string, string>
    }
  | {
      type: "drag_order"
      items: DragItem[]
      correctOrder: string[]
    }
  | {
      type: "drag_categorize"
      categories: { id: string; label: string }[]
      items: DragItem[]
      correctBuckets: Record<string, string[]>
    }
  | {
      type: "select_grid"
      rows: GridRow[]
      columns: GridColumn[]
      /** rowId → correct columnId. */
      correctByRow: Record<string, string>
    }

export type DragAnswer =
  | { type: "drag_match"; mapping: Record<string, string> }
  | { type: "drag_order"; order: string[] }
  | { type: "drag_categorize"; buckets: Record<string, string[]> }
  | { type: "select_grid"; selections: Record<string, string> }

/** A certification exam question (MCQ or drag-and-drop). */
export interface Question {
  id: string
  topic: string
  difficulty: "easy" | "medium" | "hard"
  questionType?: QuestionType
  /** Optional scenario paragraph shown above the question line. */
  scenario?: string
  prompt: string
  /** Blueprint domain id for scorecard grouping. */
  domainId?: string
  /** MCQ fields — present when questionType is mcq or omitted. */
  multiSelect?: boolean
  options?: QuestionOption[]
  correctOptionIds?: string[]
  /** Drag payload and answer key — stripped during in-progress exams. */
  dragData?: DragQuestionData
  explanation: string
  references: { label: string; url: string }[]
}

/** The per-question record of how a user responded during a session. */
export type OrgRole = "owner" | "admin" | "member"

export interface TeamMember {
  userId: string
  name: string
  email: string
  role: OrgRole
  overallMastery: number
  questionsAnswered: number
  streakDays: number
  lastActiveDate: string | null
}

export interface Team {
  id: string
  name: string
  /** The current user's role in this team. */
  role: OrgRole
  members: TeamMember[]
}

/** A saved question the learner can revisit across sessions. */
export interface Bookmark {
  questionId: string
  exam: string
  examCode: string
  note?: string
  createdAt: string
  question: Question
}

/** How sure the learner felt when answering. */
export type Confidence = "sure" | "unsure"

export interface AnswerRecord {
  questionId: string
  selectedOptionIds: string[]
  dragAnswer?: DragAnswer
  isCorrect: boolean
  markedForReview: boolean
  skipped: boolean
  timeSpentSec: number
  confidence?: Confidence
}

export type SessionStatus = "in-progress" | "completed"

/** Whether AI question generation is still running for a session. */
export type GenerationStatus = "generating" | "complete" | "failed"

/** Whether a session is open practice (instant feedback) or a timed exam. */
export type SessionMode = "practice" | "exam"

/** A practice session generated from an intake request. */
export interface PracticeSession {
  id: string
  exam: string
  examCode: string
  focusTopics: string[]
  createdAt: string // ISO
  completedAt?: string // ISO
  status: SessionStatus
  questions: Question[]
  answers: Record<string, AnswerRecord>
  currentIndex: number
  /** Defaults to "practice" when omitted (back-compat with older sessions). */
  mode?: SessionMode
  /** Total time limit for an exam, in seconds. */
  durationSec?: number
  /** Seconds actually used, recorded when an exam is submitted. */
  timeUsedSec?: number
  /** Passing score threshold (percentage) for an exam. */
  passMark?: number
  /** Total questions expected once generation finishes. */
  expectedQuestionCount?: number
  /** Whether questions are still being generated in the background. */
  generationStatus?: GenerationStatus
}

/** Per-topic mastery used across the dashboard and history. */
export interface TopicMastery {
  /** Canonical storage key (may be `EXAMCODE::domainId` for blueprint exams). */
  topic: string
  /** Human-readable label for UI. */
  displayTopic?: string
  domainId?: string
  examCode?: string
  mastery: number // 0-100
  questionsAnswered: number
}

export interface UserProfile {
  name: string
  email: string
  /** True for anonymous sessions (no real account yet) — gates account-only UI. */
  isAnonymous: boolean
  plan: Tier
  /**
   * Raw Paddle subscription status (e.g. "active", "trialing", "past_due",
   * "canceled") when the user has a subscription; null for free users.
   */
  subscriptionStatus: string | null
  /** When Exam Pass access ends (ISO timestamp); null on other tiers. */
  planExpiresAt: string | null
  /** Full limits for the user's tier — the client's source of truth. */
  limits: TierLimits
  /**
   * Question allowance in the user's window (daily on paid tiers, lifetime on
   * free). null = unlimited — never Infinity, this crosses the JSON boundary.
   */
  dailyLimit: number | null
  /** Questions consumed in the same window as dailyLimit. */
  questionsUsedToday: number
  streakDays: number
  longestStreak: number
  /** Self-set target questions/day for the streak. */
  dailyGoal: number
}

/** Live subscription detail fetched from Paddle for the billing screen. */
export interface SubscriptionDetails {
  /** Whether a manageable Paddle subscription exists for this user. */
  hasSubscription: boolean
  status: string | null
  /** ISO timestamp of the next renewal, or null. */
  nextBilledAt: string | null
  /** ISO timestamp when a scheduled cancellation takes effect, or null. */
  cancelEffectiveAt: string | null
  /** Paddle-hosted page to update the payment method, if available. */
  updatePaymentUrl: string | null
}

/** Streak + daily-goal snapshot with recent activity, for the streak card. */
export interface StreakSummary {
  currentStreak: number
  longestStreak: number
  dailyGoal: number
  questionsToday: number
  /** Whether the streak will break if the user doesn't practice today. */
  atRisk: boolean
  /** Trailing daily activity oldest→newest (84 days = 12 weeks). */
  activity: { date: string; count: number; goalMet: boolean }[]
}

/** A clarifying question the AI asks during intake. */
export interface ClarifyingQuestion {
  id: string
  question: string
  suggestions: string[]
}

/** AI-generated deep-dive content for a topic lesson. */
export interface TopicLessonContent {
  deepDive: { title: string; body: string }[]
  commonTraps: string[]
  recap: string
  references: { label: string; url: string }[]
}

export type LessonStatus = "not-started" | "started" | "completed"

/** A topic available for learning with mastery and lesson status. */
export interface LearnTopic {
  topic: string
  slug: string
  mastery: number
  questionsAnswered: number
  lessonId?: string
  lessonStatus: LessonStatus
  bookmarked: boolean
  hasAiContent: boolean
}

export type StudyTaskType = "practice" | "exam" | "lesson" | "review"
export type StudyTaskStatus = "pending" | "done" | "skipped"
export type PlanEffort = "light" | "standard" | "intense"

export interface StudyPlanTask {
  id: string
  dayIndex: number
  scheduledDate: string // ISO YYYY-MM-DD
  type: StudyTaskType
  domainId?: string
  domainName?: string
  questionCount: number
  title: string
  rationale: string
  status: StudyTaskStatus
}

export interface StudyPlan {
  id: string
  examCode: string
  exam: string
  startDate: string // ISO YYYY-MM-DD
  targetDate: string // ISO YYYY-MM-DD
  targetScore: number
  projectedScore: number
  /** UTC weekdays with no scheduled tasks (0=Sun..6=Sat). */
  restDays: number[]
  effort: PlanEffort
  tasks: StudyPlanTask[]
}

export interface PlanCoaching {
  headline: string
  message: string
  domainTips: { domain: string; tip: string }[]
}

/** Full lesson view combining curated outline and AI content. */
export interface TopicLesson {
  id?: string
  topicSlug: string
  topicName: string
  exam: string
  examCode: string
  mastery: number
  questionsAnswered: number
  domainName: string
  domainWeight: string
  outline: string[]
  curatedReferences: { label: string; url: string }[]
  content?: TopicLessonContent
  status: LessonStatus
  bookmarked: boolean
  lessonsUsedToday?: number
  /** null = unlimited. */
  dailyLessonLimit?: number | null
}
