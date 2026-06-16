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
