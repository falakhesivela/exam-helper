import { NextResponse } from "next/server"
import { requireUser } from "@/lib/api/auth"
import { handleRouteError } from "@/lib/api/route-utils"
import { createAdminClient } from "@/lib/supabase/admin"
import { loadSessions } from "@/lib/db/sessions"

export const runtime = "nodejs"

export async function GET() {
  try {
    const user = await requireUser()
    const admin = createAdminClient()
    const sessions = await loadSessions(admin, user.id)
    return NextResponse.json(sessions)
  } catch (err) {
    return handleRouteError(err)
  }
}
