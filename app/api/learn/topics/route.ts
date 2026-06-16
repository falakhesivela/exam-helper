import { NextResponse } from "next/server"
import { requireUser } from "@/lib/api/auth"
import { handleRouteError } from "@/lib/api/route-utils"
import { createAdminClient } from "@/lib/supabase/admin"
import { loadLearnTopics } from "@/lib/db/lessons"

export const runtime = "nodejs"

export async function GET() {
  try {
    const user = await requireUser()
    const admin = createAdminClient()
    const topics = await loadLearnTopics(admin, user.id)
    return NextResponse.json(topics)
  } catch (err) {
    return handleRouteError(err)
  }
}
