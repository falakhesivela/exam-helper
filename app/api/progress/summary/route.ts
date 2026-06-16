import { NextResponse } from "next/server"
import { requireUser } from "@/lib/api/auth"
import { handleRouteError } from "@/lib/api/route-utils"
import { createAdminClient } from "@/lib/supabase/admin"
import { toTopicMastery } from "@/lib/db/mappers"

export const runtime = "nodejs"

export async function GET() {
  try {
    const user = await requireUser()
    const admin = createAdminClient()

    const { data: masteryRows } = await admin
      .from("topic_mastery")
      .select("*")
      .eq("user_id", user.id)

    const topics = (masteryRows ?? []).map(toTopicMastery)
    const overallMastery =
      topics.length > 0
        ? Math.round(
            topics.reduce((s, t) => s + t.mastery, 0) / topics.length,
          )
        : 0
    const lifetimeAnswered = topics.reduce((s, t) => s + t.questionsAnswered, 0)

    const { data: profile } = await admin
      .from("profiles")
      .select("streak_days")
      .eq("id", user.id)
      .single()

    return NextResponse.json({
      overallMastery,
      lifetimeAnswered,
      streakDays: profile?.streak_days ?? 0,
    })
  } catch (err) {
    return handleRouteError(err)
  }
}
