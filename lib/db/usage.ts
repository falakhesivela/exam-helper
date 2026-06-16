import type { SupabaseClient } from "@supabase/supabase-js"
import { getFreeDailyQuestionLimit } from "@/lib/config/freemium"

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

export async function incrementUsage(
  admin: SupabaseClient,
  userId: string,
  timezone: string,
  count: number,
): Promise<number> {
  const usageDate = getLocalDate(timezone)
  const current = await getTodayUsage(admin, userId, timezone)
  const next = current + count

  await admin.from("daily_usage").upsert(
    {
      user_id: userId,
      usage_date: usageDate,
      questions_used: next,
    },
    { onConflict: "user_id,usage_date" },
  )

  return next
}

export async function checkFreemiumLimit(
  admin: SupabaseClient,
  userId: string,
  requested: number,
): Promise<{ allowed: boolean; remaining: number; dailyLimit: number }> {
  const { data: profile } = await admin
    .from("profiles")
    .select("plan, timezone")
    .eq("id", userId)
    .single()

  if (!profile) throw new Error("Profile not found")
  if (profile.plan === "pro") {
    return { allowed: true, remaining: Infinity, dailyLimit: Infinity }
  }

  const dailyLimit = getFreeDailyQuestionLimit()
  const used = await getTodayUsage(admin, userId, profile.timezone ?? "UTC")
  const remaining = Math.max(0, dailyLimit - used)
  return {
    allowed: requested <= remaining,
    remaining,
    dailyLimit,
  }
}

export class FreemiumExceededError extends Error {
  code = "FREEMIUM_LIMIT"
  remaining: number
  constructor(remaining: number) {
    super("Daily question limit reached")
    this.remaining = remaining
  }
}

export class LessonLimitExceededError extends Error {
  code = "LESSON_LIMIT"
  remaining: number
  constructor(remaining: number) {
    super("Daily AI lesson limit reached")
    this.remaining = remaining
  }
}

export const FREE_DAILY_LESSON_LIMIT = 3

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
  const current = await getTodayLessonUsage(admin, userId, timezone)
  const next = current + 1

  await admin.from("daily_usage").upsert(
    {
      user_id: userId,
      usage_date: usageDate,
      lessons_generated: next,
    },
    { onConflict: "user_id,usage_date" },
  )

  return next
}

export async function checkLessonLimit(
  admin: SupabaseClient,
  userId: string,
): Promise<{ allowed: boolean; remaining: number; dailyLimit: number; used: number }> {
  const { data: profile } = await admin
    .from("profiles")
    .select("plan, timezone")
    .eq("id", userId)
    .single()

  if (!profile) throw new Error("Profile not found")
  if (profile.plan === "pro") {
    return {
      allowed: true,
      remaining: Infinity,
      dailyLimit: Infinity,
      used: 0,
    }
  }

  const used = await getTodayLessonUsage(admin, userId, profile.timezone ?? "UTC")
  const remaining = Math.max(0, FREE_DAILY_LESSON_LIMIT - used)
  return {
    allowed: remaining > 0,
    remaining,
    dailyLimit: FREE_DAILY_LESSON_LIMIT,
    used,
  }
}

export async function enforceLessonLimit(
  admin: SupabaseClient,
  userId: string,
) {
  const check = await checkLessonLimit(admin, userId)
  if (!check.allowed) {
    throw new LessonLimitExceededError(check.remaining)
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
    throw new FreemiumExceededError(check.remaining)
  }
  return check
}
