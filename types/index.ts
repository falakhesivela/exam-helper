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
  | "command_input"

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
  | {
      type: "command_input"
      /** CLI prompt shown before the input, e.g. "Router(config)#". */
      commandContext?: string | null
      /** Correct commands + accepted abbreviations. Empty when stripped mid-exam. */
      acceptedAnswers: string[]
    }

export type DragAnswer =
  | { type: "drag_match"; mapping: Record<string, string> }
  | { type: "drag_order"; order: string[] }
  | { type: "drag_categorize"; buckets: Record<string, string[]> }
  | { type: "select_grid"; selections: Record<string, string> }
  | { type: "command_input"; value: string }

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
  /** Masked ("") for viewers below admin, except the viewer's own row. */
  email: string
  role: OrgRole
  overallMastery: number
  questionsAnswered: number
  /** Questions answered in the trailing 7 days. */
  weeklyQuestions: number
  streakDays: number
  lastActiveDate: string | null
}

/** A shareable invite link the team's owner/admins can revoke. */
export interface TeamInvite {
  token: string
  createdAt: string
  expiresAt: string | null
  /** Address the invite was emailed to; null for shareable link invites. */
  email?: string | null
}

export interface Team {
  id: string
  name: string
  /** The current user's role in this team. */
  role: OrgRole
  /** "team" once the org has a seat-based subscription. */
  plan: "none" | "team"
  /** Paid seat count; null without a team subscription. */
  seats: number | null
  seatsUsed: number
  subscriptionStatus: string | null
  /** When set, member progress shown on /team is scoped to this exam. */
  targetExamCode: string | null
  targetExam: string | null
  members: TeamMember[]
}

/** The viewer's own attempt at a team assignment. */
export interface TeamAssignmentAttempt {
  sessionId: string
  status: "in-progress" | "completed"
  correct: number
  answered: number
}

/** A shared mock exam assigned to the whole team (identical questions). */
export interface TeamAssignment {
  id: string
  title: string
  exam: string
  examCode: string
  questionCount: number
  durationSec: number | null
  passMark: number | null
  dueAt: string | null
  createdAt: string
  createdBy: string
  completedCount?: number
  myAttempt?: TeamAssignmentAttempt | null
}

export interface TeamAssignmentMemberResult {
  userId: string
  name: string
  email: string
  status: "not-started" | "in-progress" | "completed"
  correct: number
  answered: number
  timeUsedSec: number | null
  completedAt: string | null
}

export interface TeamAssignmentResults {
  assignment: TeamAssignment
  members: TeamAssignmentMemberResult[]
}

/** Team subscription details for the settings/billing panel. */
export interface TeamBilling {
  hasSubscription: boolean
  status: string | null
  seats: number | null
  nextBilledAt: string | null
  cancelEffectiveAt: string | null
  updatePaymentUrl: string | null
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

/** Server-computed score counts shipped with summary session listings. */
export interface SessionScoreSummary {
  correct: number
  answered: number
  skipped: number
  total: number
}

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
  /**
   * Server-anchored moment the exam clock started (set when the learner
   * leaves the rules screen). Present = the exam can be resumed with its
   * real remaining time.
   */
  examStartedAt?: string // ISO
  /**
   * True for list-view stubs: `questions`/`answers` are empty and score data
   * lives in `scoreSummary`. The full session loads lazily when opened.
   */
  summary?: boolean
  /** Precomputed score counts; present on summary stubs. */
  scoreSummary?: SessionScoreSummary
}

/** AI examiner debrief generated once per completed exam (Pro+). */
export interface ExamDebrief {
  summary: string
  topPriorities: string[]
  examDayTip: string
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
  /** True when the plan is inherited from a team seat (no own subscription). */
  planViaTeam?: boolean
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
  /** When the user completed (or skipped) onboarding; null = show onboarding. */
  onboardedAt?: string | null
  /** Server-resolved active exam (last practiced, else onboarding choice). */
  activeExam?: { examCode: string; exam: string } | null
  /**
   * Used/remaining for counter-quota features. `limits` alone says what the cap
   * is, not how much of it is left — this is what lets the UI show "N left".
   */
  usage?: Partial<Record<CounterFeature, CounterUsage>>
}

/** Features metered by the usage_counters table (see backend entitlements.py). */
export type CounterFeature = "mentor_messages" | "tutor_messages"

export interface CounterUsage {
  /** null = unlimited on this tier. */
  limit: number | null
  used: number
  remaining: number | null
}

/** One turn of a chat thread — shared by the tutors and Mentor. */
export interface ChatMessage {
  role: "user" | "assistant"
  content: string
}

/** A saved Mentor thread. */
export interface MentorConversation {
  id: string
  title: string
  /** Exam pinned at creation, so grounding doesn't shift mid-thread. */
  examCode: string | null
  messageCount: number
  createdAt: string
  updatedAt: string
}

export interface MentorMessage extends ChatMessage {
  id: number
  createdAt: string
}

/** Hand-authored exam-taking tip (static catalog content, zero AI cost). */
export interface ExamTip {
  title: string
  body: string
}

/** One step of a guided hands-on lab. */
export interface LabStep {
  title: string
  instruction: string
  hint?: string | null
}

/** Guided lab content — performed in the user's own free-tier cloud account. */
export interface LabContent {
  title: string
  scenario: string
  estimatedMinutes: number
  costWarning: string
  prerequisites: string[]
  steps: LabStep[]
  checkpoints: CheckQuestion[]
  cleanup: string[]
  references: { label: string; url: string }[]
}

/** Lab list entry for the active exam. */
export interface LabCatalogItem {
  topicSlug: string
  topicName: string
  domainName: string
  domainWeight: string
  generated: boolean
  status: LessonStatus
  title?: string | null
  estimatedMinutes?: number | null
}

/** A topic's lab with the user's progress. Content is present only after start. */
export interface TopicLab {
  id?: string
  topicSlug: string
  topicName: string
  exam: string
  examCode: string
  status: LessonStatus
  started: boolean
  content?: LabContent
  preview?: {
    title?: string
    scenario?: string
    estimatedMinutes?: number
    costWarning?: string
    prerequisites?: string[]
    stepsCount?: number
    checkpointCount?: number
  }
  stepsDone: number[]
  checkpointScore?: number | null
  checkpointTotal?: number | null
  labsUsed: number
  /** null = unlimited on the user's tier. */
  labLimit: number | null
}

/** An exam the user is studying (chosen at onboarding or added later). */
export interface UserExam {
  examCode: string
  exam: string
  examDate: string | null
  /** False for custom exams without a preset blueprint. */
  isPreset: boolean
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
  /** Paddle price id of the active subscription item (distinguishes annual). */
  priceId?: string | null
  /** Billing interval from Paddle, e.g. "month" or "year". */
  billingInterval?: string | null
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

/** Structured X-vs-Y decision table (e.g. ALB vs NLB). */
export interface ComparisonTable {
  title: string
  columns: string[]
  rows: string[][]
}

/** Single-answer MCQ from the end-of-lesson knowledge check. */
export interface CheckQuestion {
  prompt: string
  options: string[]
  correctIndex: number
  explanation: string
}

/** A memorizable fact plus the recall question used on its flashcard. */
export interface KeyFact {
  fact: string
  question: string
}

/** AI-generated deep-dive content for a topic lesson. */
export interface TopicLessonContent {
  deepDive: { title: string; body: string }[]
  comparisons?: ComparisonTable[]
  commonTraps: string[]
  keyFacts?: KeyFact[]
  recap: string
  checkQuestions?: CheckQuestion[]
  references: { label: string; url: string }[]
}

export type LessonStatus = "not-started" | "started" | "completed"

/** A topic available for learning with mastery and lesson status. */
export interface LearnTopic {
  topic: string
  slug: string
  mastery: number
  questionsAnswered: number
  /** False for catalog topics the user hasn't practiced yet (mastery unknown). */
  assessed?: boolean
  /** Exam domain this topic belongs to, when it maps to the catalog. */
  domainName?: string
  /** Domain's share of the exam, e.g. "30%". */
  domainWeight?: string
  lessonId?: string
  lessonStatus: LessonStatus
  bookmarked: boolean
  hasAiContent: boolean
  /** This topic has a curated free-tier hands-on lab. */
  hasLab?: boolean
}

/** A key-fact flashcard from a lesson, with its spaced-review state. */
export interface FactCard {
  lessonId: string
  factIndex: number
  topicName: string
  /** Set the lesson's topic, so a topic-scoped review can filter on it. */
  topicSlug?: string
  question: string
  fact: string
  due: boolean
  nextReviewAt?: string | null
}

export interface MissedQuestionItem {
  questionId: string
  sessionId: string
  exam: string
  examCode: string
  answeredAt: string
  lastSelectedOptionIds?: string[]
  lastDragAnswer?: DragAnswer
  question: Question
  nextReviewAt?: string
  intervalDays?: number
  due?: boolean
  /** Answered right enough times to leave the backlog; shown as "Mastered". */
  retired?: boolean
}

/** Which of the two spaced-repetition sources a review draws from. */
export type ReviewSource = "all" | "questions" | "facts"

export interface ReviewQueue {
  questions: MissedQuestionItem[]
  facts: FactCard[]
  count: number
  /** Spans both sources, whichever source was requested. */
  dueCount: number
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
  /** Exam vendor (aws, azure, gcp, comptia, cisco, isc2, custom). */
  provider?: string
  mastery: number
  questionsAnswered: number
  domainName: string
  domainWeight: string
  outline: string[]
  curatedReferences: { label: string; url: string }[]
  content?: TopicLessonContent
  status: LessonStatus
  bookmarked: boolean
  /** Best knowledge-check result, if the user has taken it. */
  checkScore?: number | null
  checkTotal?: number | null
  lessonsUsedToday?: number
  /** null = unlimited. */
  dailyLessonLimit?: number | null
}
