// Server-only entitlement resolution and quota accounting.
//
// Tier limits come from lib/config/tiers.ts. Questions and lessons keep their
// existing daily_usage storage (lifetime = SUM over days for the free tier);
// features that had no counter before (tutor, mock exams, clarify) use the
// generic usage_counters table from migration 023.

import type { SupabaseClient } from "@supabase/supabase-js"
import {
  isPaidTier,
  limitsFor,
  type LimitWindow,
  type Tier,
  type TierLimits,
} from "@/lib/config/tiers"

/** Paddle statuses that keep a subscription entitled (mirrors the webhook). */
const ENTITLED_STATUSES = new Set(["active", "trialing"])

export interface Entitlements {
  tier: Tier
  limits: TierLimits
  timezone: string
  planExpiresAt: string | null
}

export class QuotaExceededError extends Error {
  code = "QUOTA_LIMIT"
  feature: string
  remaining: number
  /** Tier the paywall should suggest. */
  upgradeTier: Tier
  constructor(feature: string, remaining: number, currentTier: Tier, message: string) {
    super(message)
    this.feature = feature
    this.remaining = remaining
    this.upgradeTier = currentTier === "free" ? "pro" : "exam_pass"
  }
}

function localDate(timezone: string): string {
  try {
    return new Intl.DateTimeFormat("en-CA", { timeZone: timezone }).format(new Date())
  } catch {
    return new Date().toISOString().slice(0, 10)
  }
}

/** Window key for usage_counters: 'YYYY-MM-DD' | 'YYYY-MM' | 'life'. */
export function periodFor(window: LimitWindow, timezone: string): string {
  if (window === "lifetime") return "life"
  const date = localDate(timezone)
  return window === "monthly" ? date.slice(0, 7) : date
}

/**
 * Resolve the user's effective tier. An expired Exam Pass lazily downgrades to
 * `pro` (if an entitled subscription exists) or `free`, written back so the
 * next read is cheap.
 */
export async function getEntitlements(
  admin: SupabaseClient,
  userId: string,
): Promise<Entitlements> {
  const { data: profile } = await admin
    .from("profiles")
    .select("plan, plan_expires_at, timezone, subscription_status")
    .eq("id", userId)
    .single()
  if (!profile) throw new Error("Profile not found")

  let tier = (profile.plan ?? "free") as Tier
  let planExpiresAt: string | null = profile.plan_expires_at ?? null

  if (
    tier === "exam_pass" &&
    planExpiresAt &&
    new Date(planExpiresAt).getTime() <= Date.now()
  ) {
    tier = ENTITLED_STATUSES.has(profile.subscription_status ?? "") ? "pro" : "free"
    planExpiresAt = null
    await admin
      .from("profiles")
      .update({ plan: tier, plan_expires_at: null })
      .eq("id", userId)
      .eq("plan", "exam_pass")
  }

  return {
    tier,
    limits: limitsFor(tier),
    timezone: profile.timezone ?? "UTC",
    planExpiresAt,
  }
}

export type CounterFeature =
  | "tutor_messages"
  | "mock_exams"
  | "clarify_requests"
  | "coach_messages"

async function readCounter(
  admin: SupabaseClient,
  userId: string,
  counter: CounterFeature,
  period: string,
): Promise<number> {
  const { data } = await admin
    .from("usage_counters")
    .select("count")
    .eq("user_id", userId)
    .eq("counter", counter)
    .eq("period", period)
    .maybeSingle()
  return data?.count ?? 0
}

const COUNTER_MESSAGES: Record<CounterFeature, string> = {
  tutor_messages: "Tutor message limit reached",
  mock_exams: "Mock exam limit reached",
  clarify_requests: "Clarify request limit reached",
  coach_messages: "Daily coach limit reached",
}

function counterWindow(limits: TierLimits, feature: CounterFeature): {
  limit: number | null
  window: LimitWindow
} {
  switch (feature) {
    case "tutor_messages":
      return { limit: limits.tutorMessages, window: limits.tutorWindow }
    case "mock_exams":
      return { limit: limits.mockExams, window: limits.mockExamsWindow }
    case "clarify_requests":
      return { limit: limits.clarify, window: limits.clarifyWindow }
    case "coach_messages":
      return { limit: limits.coach, window: limits.coachWindow }
  }
}

export async function checkCounterQuota(
  admin: SupabaseClient,
  ent: Entitlements,
  userId: string,
  feature: CounterFeature,
  requested = 1,
): Promise<{ allowed: boolean; remaining: number | null; used: number }> {
  const { limit, window } = counterWindow(ent.limits, feature)
  if (limit === null) return { allowed: true, remaining: null, used: 0 }
  const period = periodFor(window, ent.timezone)
  const used = await readCounter(admin, userId, feature, period)
  const remaining = Math.max(0, limit - used)
  return { allowed: requested <= remaining, remaining, used }
}

/** Check + atomically consume; throws QuotaExceededError when exhausted. */
export async function consumeCounterQuota(
  admin: SupabaseClient,
  ent: Entitlements,
  userId: string,
  feature: CounterFeature,
  amount = 1,
): Promise<void> {
  const { limit, window } = counterWindow(ent.limits, feature)
  if (limit === null) return
  const period = periodFor(window, ent.timezone)
  const { data, error } = await admin.rpc("increment_usage_counter", {
    p_user_id: userId,
    p_counter: feature,
    p_period: period,
    p_amount: amount,
  })
  if (error) throw error
  const newCount = data as number
  if (newCount > limit) {
    // Over the line: roll the increment back so retries aren't penalized.
    await admin.rpc("increment_usage_counter", {
      p_user_id: userId,
      p_counter: feature,
      p_period: period,
      p_amount: -amount,
    })
    throw new QuotaExceededError(
      feature,
      Math.max(0, limit - (newCount - amount)),
      ent.tier,
      COUNTER_MESSAGES[feature],
    )
  }
}

/** Refund a previously consumed counter (e.g. generation failed hard). */
export async function refundCounterQuota(
  admin: SupabaseClient,
  ent: Entitlements,
  userId: string,
  feature: CounterFeature,
  amount = 1,
): Promise<void> {
  const { limit, window } = counterWindow(ent.limits, feature)
  if (limit === null) return
  const period = periodFor(window, ent.timezone)
  await admin.rpc("increment_usage_counter", {
    p_user_id: userId,
    p_counter: feature,
    p_period: period,
    p_amount: -amount,
  })
}

/** Feature-lock gate for the plan coach. */
export function assertCoachAccess(ent: Entitlements): void {
  if (ent.limits.coach === 0) {
    throw new QuotaExceededError(
      "coach",
      0,
      ent.tier,
      "The AI coach is available on paid plans",
    )
  }
}

export { isPaidTier }
