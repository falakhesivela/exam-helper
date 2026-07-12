// Plan pricing + Paddle price↔tier mapping. Feature bullets are derived from
// TIER_LIMITS so the marketing copy can never drift from the enforced limits.
// Prices live here (and in Paddle); everything else comes from lib/config/tiers.

import { TIER_LIMITS, TIER_NAMES, type Tier } from "@/lib/config/tiers"

export const PRO_PRICE_LABEL = "$12"
export const PRO_PRICE_CYCLE = "month"
export const PRO_ANNUAL_PRICE_LABEL = "$79"
export const PRO_ANNUAL_PRICE_CYCLE = "year"
export const EXAM_PASS_PRICE_LABEL = "$39"
export const EXAM_PASS_CYCLE = "90 days"

/**
 * What the user buys at checkout. pro_annual is a billing variant of the
 * `pro` tier — it never appears in the plan enum or entitlements.
 */
export type CheckoutSku = "pro" | "pro_annual" | "exam_pass"

/** Paddle price id for the Pro ($12/mo) subscription. */
export function getProPriceId(): string | undefined {
  return process.env.NEXT_PUBLIC_PADDLE_PRO_PRICE_ID
}

/** Paddle price id for the annual Pro ($79/yr) subscription. */
export function getProAnnualPriceId(): string | undefined {
  return process.env.NEXT_PUBLIC_PADDLE_PRO_ANNUAL_PRICE_ID
}

/** Paddle price id for the one-time Exam Pass ($39 / 90 days). */
export function getExamPassPriceId(): string | undefined {
  return process.env.NEXT_PUBLIC_PADDLE_EXAM_PASS_PRICE_ID
}

/** Paddle price id for a checkout SKU (used by the checkout hook). */
export function priceIdForSku(sku: CheckoutSku): string | undefined {
  if (sku === "pro") return getProPriceId()
  if (sku === "pro_annual") return getProAnnualPriceId()
  if (sku === "exam_pass") return getExamPassPriceId()
  return undefined
}

/**
 * Map a Paddle price id back to a tier. This is the webhook's source of truth —
 * never trust a client-supplied custom_data.tier. Returns null for unknown
 * prices so the webhook can log-and-skip instead of misclassifying.
 */
export function tierForPriceId(priceId: string | null | undefined): Tier | null {
  if (!priceId) return null
  if (priceId === getProPriceId()) return "pro"
  if (priceId === getProAnnualPriceId()) return "pro"
  if (priceId === getExamPassPriceId()) return "exam_pass"
  return null
}

function quotaLabel(limit: number | null, noun: string, window: string): string {
  if (limit === null) return `Unlimited ${noun}`
  return `${limit} ${noun} ${window}`
}

const WINDOW_WORD: Record<"daily" | "monthly" | "lifetime", string> = {
  daily: "per day",
  monthly: "per month",
  lifetime: "to start",
}

export interface PlanCard {
  tier: Tier
  name: string
  price: string
  cycle: string
  tagline: string
  features: string[]
  /** Highlighted as the recommended plan on the pricing UI. */
  featured: boolean
}

function planFeatures(tier: Tier): string[] {
  const l = TIER_LIMITS[tier]
  const features = [
    quotaLabel(l.questions, "practice questions", WINDOW_WORD[l.questionsWindow]),
    quotaLabel(l.mockExams, "mock exams", WINDOW_WORD[l.mockExamsWindow]) +
      ` (up to ${l.maxExamLength} questions)`,
    quotaLabel(l.lessons, "AI lessons", WINDOW_WORD[l.lessonsWindow]),
    quotaLabel(l.tutorMessages, "AI tutor messages", WINDOW_WORD[l.tutorWindow]),
    quotaLabel(l.mentorMessages, "Mentor chat messages", WINDOW_WORD[l.mentorWindow]),
    quotaLabel(l.labs, "hands-on cloud labs", WINDOW_WORD[l.labsWindow]),
  ]
  if (l.coach !== 0) {
    features.push(
      l.coach === null
        ? "AI study-plan coach"
        : `AI study-plan coach (${l.coach}/day)`,
    )
  }
  return features
}

export const PLANS: PlanCard[] = [
  {
    tier: "free",
    name: TIER_NAMES.free,
    price: "$0",
    cycle: "free",
    tagline: "Try the full experience — no card required.",
    features: [...planFeatures("free"), "Progress tracking & streaks"],
    featured: false,
  },
  {
    tier: "pro",
    name: TIER_NAMES.pro,
    price: PRO_PRICE_LABEL,
    cycle: PRO_PRICE_CYCLE,
    tagline: "Daily practice to build real exam readiness.",
    features: [...planFeatures("pro"), "Everything in Free"],
    featured: true,
  },
  {
    tier: "exam_pass",
    name: TIER_NAMES.exam_pass,
    price: EXAM_PASS_PRICE_LABEL,
    cycle: EXAM_PASS_CYCLE,
    tagline: "Everything, at exam-cram volume, for 90 days.",
    features: [
      ...planFeatures("exam_pass"),
      "One-time payment — no subscription",
    ],
    featured: false,
  },
]
