// Core domain types for CertForge

/** A single answer option on a question. */
export interface QuestionOption {
  id: string // "a" | "b" | "c" | "d"
  text: string
}

/** A multiple-choice question. Supports single- and multi-select. */
export interface Question {
  id: string
  topic: string
  difficulty: "easy" | "medium" | "hard"
  /** When true, more than one option is correct (multi-select). */
  multiSelect: boolean
  prompt: string
  options: QuestionOption[]
  /** Ids of the correct option(s). */
  correctOptionIds: string[]
  explanation: string
  references: { label: string; url: string }[]
}

/** The per-question record of how a user responded during a session. */
export interface AnswerRecord {
  questionId: string
  selectedOptionIds: string[]
  isCorrect: boolean
  markedForReview: boolean
  skipped: boolean
  timeSpentSec: number
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
  topic: string
  mastery: number // 0-100
  questionsAnswered: number
}

export interface UserProfile {
  name: string
  email: string
  plan: "free" | "pro"
  /** Daily free-tier question allowance. */
  dailyLimit: number
  questionsUsedToday: number
  streakDays: number
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
  dailyLessonLimit?: number
}
