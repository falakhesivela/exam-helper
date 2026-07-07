// Single source of truth for subscription tiers and their limits.
// Every quota the app enforces and every limit the UI displays comes from
// TIER_LIMITS — never hardcode a number or a `plan === "pro"` check elsewhere.

export type Tier = "free" | "pro" | "exam_pass"

export const TIERS: readonly Tier[] = ["free", "pro", "exam_pass"] as const

/** Window a limit is measured over. */
export type LimitWindow = "daily" | "monthly" | "lifetime"

/**
 * `null` means unlimited. Never use Infinity for limits: these values cross
 * the JSON boundary via /api/me and Infinity serializes to null silently.
 */
export interface TierLimits {
  /** AI practice questions (generation + answering). */
  questions: number | null
  questionsWindow: LimitWindow
  /** Full mock exams started. */
  mockExams: number | null
  mockExamsWindow: LimitWindow
  /** Max questions in a single mock exam. */
  maxExamLength: number
  /** AI-generated topic lessons. */
  lessons: number | null
  lessonsWindow: LimitWindow
  /** AI tutor chat messages. Capped on every tier — chat is the #1 abuse surface. */
  tutorMessages: number | null
  tutorWindow: LimitWindow
  /** Plan coach available at all. */
  coach: boolean
  /** Intake clarify requests. */
  clarify: number | null
  clarifyWindow: LimitWindow
}

export const TIER_LIMITS: Record<Tier, TierLimits> = {
  // Trial-style taste: lifetime allowances, enough to feel the quality.
  free: {
    questions: 30,
    questionsWindow: "lifetime",
    mockExams: 1,
    mockExamsWindow: "lifetime",
    maxExamLength: 10,
    lessons: 2,
    lessonsWindow: "lifetime",
    tutorMessages: 10,
    tutorWindow: "lifetime",
    coach: false,
    clarify: 3,
    clarifyWindow: "lifetime",
  },
  pro: {
    questions: 100,
    questionsWindow: "daily",
    mockExams: 4,
    mockExamsWindow: "monthly",
    maxExamLength: 65,
    lessons: 5,
    lessonsWindow: "daily",
    tutorMessages: 100,
    tutorWindow: "daily",
    coach: true,
    clarify: null,
    clarifyWindow: "daily",
  },
  // 90-day "pass your exam" bundle — the top tier.
  exam_pass: {
    questions: null,
    questionsWindow: "daily",
    mockExams: null,
    mockExamsWindow: "monthly",
    maxExamLength: 90,
    lessons: null,
    lessonsWindow: "daily",
    tutorMessages: 300,
    tutorWindow: "daily",
    coach: true,
    clarify: null,
    clarifyWindow: "daily",
  },
}

export function isTier(value: string | null | undefined): value is Tier {
  return value === "free" || value === "pro" || value === "exam_pass"
}

export function limitsFor(tier: string | null | undefined): TierLimits {
  return TIER_LIMITS[isTier(tier) ? tier : "free"]
}

export function isPaidTier(tier: string | null | undefined): tier is "pro" | "exam_pass" {
  return tier === "pro" || tier === "exam_pass"
}

export const TIER_NAMES: Record<Tier, string> = {
  free: "Free",
  pro: "Pro",
  exam_pass: "Exam Pass",
}

/** Days of access granted by an Exam Pass purchase. */
export const EXAM_PASS_DAYS = 90
