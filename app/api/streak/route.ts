import { NextResponse } from "next/server"
import { z } from "zod"
import { requireUser } from "@/lib/api/auth"
import { getTimezone, handleRouteError } from "@/lib/api/route-utils"
import { createAdminClient } from "@/lib/supabase/admin"
import { getLocalDate } from "@/lib/db/usage"
import { buildActivityRow, isStreakAtRisk } from "@/lib/streak/status"
import type { StreakSummary } from "@/types"

export const runtime = "nodejs"

/** GET — streak summary + last-7-days activity for the dashboard streak card. */
export async function GET(request: Request) {
  try {
    const user = await requireUser()
    const admin = createAdminClient()
    const tz = getTimezone(request)
    const today = getLocalDate(tz)

    const { data: profile } = await admin
      .from("profiles")
      .select("streak_days, longest_streak, daily_goal, last_active_date")
      .eq("id", user.id)
      .single()

    const since = new Date(`${today}T00:00:00Z`)
    since.setUTCDate(since.getUTCDate() - 6)
    const { data: usageRows } = await admin
      .from("daily_usage")
      .select("usage_date, questions_used")
      .eq("user_id", user.id)
      .gte("usage_date", since.toISOString().slice(0, 10))

    const usageByDate: Record<string, number> = {}
    for (const r of usageRows ?? []) {
      usageByDate[r.usage_date] = r.questions_used
    }

    const dailyGoal = profile?.daily_goal ?? 10
    const summary: StreakSummary = {
      currentStreak: profile?.streak_days ?? 0,
      longestStreak: profile?.longest_streak ?? 0,
      dailyGoal,
      questionsToday: usageByDate[today] ?? 0,
      atRisk: isStreakAtRisk(profile?.last_active_date ?? null, today),
      activity: buildActivityRow(usageByDate, dailyGoal, today),
    }
    return NextResponse.json(summary)
  } catch (err) {
    return handleRouteError(err)
  }
}

const patchSchema = z.object({
  dailyGoal: z.number().int().min(1).max(200),
})

/** PATCH — update the user's daily question goal. */
export async function PATCH(request: Request) {
  try {
    const user = await requireUser()
    const { dailyGoal } = patchSchema.parse(await request.json())
    const admin = createAdminClient()

    const { error } = await admin
      .from("profiles")
      .update({ daily_goal: dailyGoal })
      .eq("id", user.id)
    if (error) throw error

    return NextResponse.json({ dailyGoal })
  } catch (err) {
    return handleRouteError(err)
  }
}
