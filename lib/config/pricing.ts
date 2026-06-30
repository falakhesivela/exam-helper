// Plan definitions surfaced on the /upgrade page and in the paywall UI.
// Pricing copy lives here; the Paddle price id comes from env so it can differ
// between sandbox and production.

export const PRO_PRICE_LABEL = "$6"
export const PRO_PRICE_CYCLE = "month"

export const FREE_PLAN = {
  name: "Free",
  price: "$0",
  cycle: "forever",
  tagline: "Start practising right away — no account needed.",
  features: [
    "20 practice questions per day",
    "AI-generated questions & explanations",
    "Progress tracking & streaks",
    "Sign up free to save progress across devices",
  ],
} as const

export const PRO_PLAN = {
  name: "Pro",
  price: PRO_PRICE_LABEL,
  cycle: PRO_PRICE_CYCLE,
  tagline: "Unlimited practice for serious exam prep.",
  features: [
    "Unlimited practice questions",
    "Full mock exams, any length",
    "Priority AI generation",
    "Everything in Free",
  ],
} as const

/** Paddle price id for the Pro subscription (set per environment). */
export function getProPriceId(): string | undefined {
  return process.env.NEXT_PUBLIC_PADDLE_PRO_PRICE_ID
}
