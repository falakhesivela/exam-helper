import { NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { requireUser } from "@/lib/api/auth"
import { handleRouteError } from "@/lib/api/route-utils"
import { toUserProfile } from "@/lib/db/mappers"
import { getTodayUsage } from "@/lib/db/usage"
import { getFreeDailyQuestionLimit } from "@/lib/config/freemium"

export const runtime = "nodejs"

export async function GET() {
  try {
    const user = await requireUser()
    const admin = createAdminClient()

    const { data: profile, error } = await admin
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single()

    if (error || !profile) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 })
    }

    const used = await getTodayUsage(
      admin,
      user.id,
      profile.timezone ?? "UTC",
    )

    return NextResponse.json(
      toUserProfile(profile, used, {
        dailyLimit:
          profile.plan === "pro"
            ? profile.daily_limit
            : getFreeDailyQuestionLimit(),
        isAnonymous: user.isAnonymous,
      }),
    )
  } catch (err) {
    return handleRouteError(err)
  }
}
