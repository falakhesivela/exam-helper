import { NextResponse } from "next/server"
import { requireUser } from "@/lib/api/auth"
import { handleRouteError } from "@/lib/api/route-utils"
import { createAdminClient } from "@/lib/supabase/admin"
import { loadSession, updateStreak } from "@/lib/db/sessions"

export const runtime = "nodejs"

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = await requireUser()
    const { id: sessionId } = await params
    const admin = createAdminClient()

    const { data: session } = await admin
      .from("sessions")
      .select("*")
      .eq("id", sessionId)
      .eq("user_id", user.id)
      .single()

    if (!session) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 })
    }

    // Idempotent: completing an already-completed session must not re-grant a
    // streak (otherwise it can be POSTed repeatedly to farm streak days).
    if (session.status === "completed") {
      const current = await loadSession(admin, sessionId, user.id)
      return NextResponse.json(current)
    }

    await admin
      .from("sessions")
      .update({
        status: "completed",
        completed_at: new Date().toISOString(),
      })
      .eq("id", sessionId)

    const { data: profile } = await admin
      .from("profiles")
      .select("timezone")
      .eq("id", user.id)
      .single()

    await updateStreak(admin, user.id, profile?.timezone ?? "UTC")

    const updated = await loadSession(admin, sessionId, user.id)
    return NextResponse.json(updated)
  } catch (err) {
    return handleRouteError(err)
  }
}
