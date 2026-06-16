import { NextResponse } from "next/server"
import { z } from "zod"
import { requireUser } from "@/lib/api/auth"
import { handleRouteError } from "@/lib/api/route-utils"
import { createAdminClient } from "@/lib/supabase/admin"
import { loadSession } from "@/lib/db/sessions"

export const runtime = "nodejs"

const bodySchema = z.object({
  index: z.number().int().min(0),
})

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = await requireUser()
    const { id: sessionId } = await params
    const body = bodySchema.parse(await request.json())
    const admin = createAdminClient()

    const { data: session, error } = await admin
      .from("sessions")
      .update({ current_index: body.index })
      .eq("id", sessionId)
      .eq("user_id", user.id)
      .select()
      .single()

    if (error || !session) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 })
    }

    const updated = await loadSession(admin, sessionId, user.id)
    return NextResponse.json(updated)
  } catch (err) {
    return handleRouteError(err)
  }
}
