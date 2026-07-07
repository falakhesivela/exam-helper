import type { SupabaseClient } from "@supabase/supabase-js"
import { getEntitlements, type Entitlements } from "@/lib/entitlements"

export function getLocalDate(timezone = "UTC"): string {
  try {
    return new Intl.DateTimeFormat("en-CA", { timeZone: timezone }).format(
      new Date(),
    )
  } catch {
    return new Date().toISOString().slice(0, 10)
  }
}

export async function getTodayUsage(
  admin: SupabaseClient,
  userId: string,
  timezone: string,
): Promise<number> {
  const usageDate = getLocalDate(timezone)
  const { data } = await admin
    .from("daily_usage")
    .select("questions_used")
    .eq("user_id", userId)
    .eq("usage_date", usageDate)
    .maybeSingle()
  return data?.questions_used ?? 0
}

/**
 * All-time totals from daily_usage. Powers the free tier's lifetime
 * allowances; free users stop accruing rows quickly, so this stays small.
 */
async function getLifetimeUsage(
  admin: SupabaseClient,
  userId: string,
): Promise<{ questions: number; lessons: number }> {
  const { data } = await admin
    .from("daily_usage")
    .select("questions_used, lessons_generated")
    .eq("user_id", userId)
  let questions = 0
  let lessons = 0
  for (const row of data ?? []) {
    questions += row.questions_used ?? 0
    lessons += row.lessons_generated ?? 0
  }
  return { questions, lessons }
}

export async function incrementUsage(
  admin: SupabaseClient,
  userId: string,
  timezone: string,
  count: number,
): Promise<number> {
  const usageDate = getLocalDate(timezone)
  const { data, error } = await admin.rpc("increment_daily_usage", {
    p_user_id: userId,
    p_usage_date: usageDate,
    p_questions: count,
    p_lessons: 0,
  })
  if (error) throw error
  return (data as { questions_used: number }).questions_used
}

export interface QuestionQuota {
  allowed: boolean
  /** null = unlimited. Never Infinity: this crosses the JSON boundary. */
  remaining: number | null
  /** The limit for the user's window (daily or lifetime); null = unlimited. */
  dailyLimit: number | null
  /** Questions consumed in the user's window. */
  used: number
  entitlements: Entitlements
}

export async function checkFreemiumLimit(
  admin: SupabaseClient,
  userId: string,
  requested: number,
): Promise<QuestionQuota> {
  const ent = await getEntitlements(admin, userId)
  const limit = ent.limits.questions

  const used =
    ent.limits.questionsWindow === "lifetime"
      ? (await getLifetimeUsage(admin, userId)).questions
      : await getTodayUsage(admin, userId, ent.timezone)

  if (limit === null) {
    return {
      allowed: true,
      remaining: null,
      dailyLimit: null,
      used,
      entitlements: ent,
    }
  }

  const remaining = Math.max(0, limit - used)
  return {
    allowed: requested <= remaining,
    remaining,
    dailyLimit: limit,
    used,
    entitlements: ent,
  }
}

export class FreemiumExceededError extends Error {
  code = "FREEMIUM_LIMIT"
  remaining: number
  constructor(remaining: number) {
    super("Question limit reached")
    this.remaining = remaining
  }
}

export class LessonLimitExceededError extends Error {
  code = "LESSON_LIMIT"
  remaining: number
  constructor(remaining: number) {
    super("AI lesson limit reached")
    this.remaining = remaining
  }
}

export async function getTodayLessonUsage(
  admin: SupabaseClient,
  userId: string,
  timezone: string,
): Promise<number> {
  const usageDate = getLocalDate(timezone)
  const { data } = await admin
    .from("daily_usage")
    .select("lessons_generated")
    .eq("user_id", userId)
    .eq("usage_date", usageDate)
    .maybeSingle()
  return data?.lessons_generated ?? 0
}

export async function incrementLessonUsage(
  admin: SupabaseClient,
  userId: string,
  timezone: string,
): Promise<number> {
  const usageDate = getLocalDate(timezone)
  const { data, error } = await admin.rpc("increment_daily_usage", {
    p_user_id: userId,
    p_usage_date: usageDate,
    p_questions: 0,
    p_lessons: 1,
  })
  if (error) throw error
  return (data as { lessons_generated: number }).lessons_generated
}

export interface LessonQuota {
  allowed: boolean
  remaining: number | null
  dailyLimit: number | null
  used: number
  entitlements: Entitlements
}

export async function checkLessonLimit(
  admin: SupabaseClient,
  userId: string,
): Promise<LessonQuota> {
  const ent = await getEntitlements(admin, userId)
  const limit = ent.limits.lessons
  if (limit === null) {
    return {
      allowed: true,
      remaining: null,
      dailyLimit: null,
      used: 0,
      entitlements: ent,
    }
  }

  const used =
    ent.limits.lessonsWindow === "lifetime"
      ? (await getLifetimeUsage(admin, userId)).lessons
      : await getTodayLessonUsage(admin, userId, ent.timezone)
  const remaining = Math.max(0, limit - used)
  return {
    allowed: remaining > 0,
    remaining,
    dailyLimit: limit,
    used,
    entitlements: ent,
  }
}

export async function enforceLessonLimit(
  admin: SupabaseClient,
  userId: string,
) {
  const check = await checkLessonLimit(admin, userId)
  if (!check.allowed) {
    throw new LessonLimitExceededError(check.remaining ?? 0)
  }
  return check
}

export async function enforceFreemium(
  admin: SupabaseClient,
  userId: string,
  count: number,
) {
  const check = await checkFreemiumLimit(admin, userId, count)
  if (!check.allowed) {
    throw new FreemiumExceededError(check.remaining ?? 0)
  }
  return check
}
