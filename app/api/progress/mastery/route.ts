import { NextResponse } from "next/server"
import { requireUser } from "@/lib/api/auth"
import { handleRouteError } from "@/lib/api/route-utils"
import { createAdminClient } from "@/lib/supabase/admin"
import {
  buildMasteryTopicKey,
  enrichTopicMastery,
} from "@/lib/exams/mastery-keys"

export const runtime = "nodejs"

export async function GET() {
  try {
    const user = await requireUser()
    const admin = createAdminClient()

    const { data, error } = await admin
      .from("topic_mastery")
      .select("*")
      .eq("user_id", user.id)
      .order("topic")

    if (error) throw error

    return NextResponse.json((data ?? []).map((row) => enrichTopicMastery(row)))
  } catch (err) {
    return handleRouteError(err)
  }
}
