import { NextResponse } from "next/server"
import { requireUser } from "@/lib/api/auth"
import { apiError, handleRouteError } from "@/lib/api/route-utils"
import { createAdminClient } from "@/lib/supabase/admin"
import { removeMember, OrgError } from "@/lib/db/organizations"

export const runtime = "nodejs"

/** DELETE — remove a member (owner) or leave the team (self). */
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ userId: string }> },
) {
  try {
    const user = await requireUser()
    const { userId } = await params
    const admin = createAdminClient()
    await removeMember(admin, user.id, userId)
    return NextResponse.json({ ok: true })
  } catch (err) {
    if (err instanceof OrgError) return apiError(err.message, err.status, { code: err.code })
    return handleRouteError(err)
  }
}
