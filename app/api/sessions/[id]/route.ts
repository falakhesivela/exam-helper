import { NextResponse } from "next/server"
import { requireUser } from "@/lib/api/auth"
import { handleRouteError } from "@/lib/api/route-utils"
import { createAdminClient } from "@/lib/supabase/admin"
import { loadSession } from "@/lib/db/sessions"

export const runtime = "nodejs"

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = await requireUser()
    const { id } = await params
    const admin = createAdminClient()
    const session = await loadSession(admin, id, user.id)
    if (!session) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 })
    }
    return NextResponse.json(session)
  } catch (err) {
    return handleRouteError(err)
  }
}
