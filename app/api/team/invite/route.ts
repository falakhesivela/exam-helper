import { NextResponse } from "next/server"
import { requireUser } from "@/lib/api/auth"
import { apiError, handleRouteError } from "@/lib/api/route-utils"
import { createAdminClient } from "@/lib/supabase/admin"
import { createInvite, OrgError } from "@/lib/db/organizations"

export const runtime = "nodejs"

/** POST — create a shareable invite token (owner/admin only). */
export async function POST() {
  try {
    const user = await requireUser()
    const admin = createAdminClient()
    const token = await createInvite(admin, user.id)
    return NextResponse.json({ token })
  } catch (err) {
    if (err instanceof OrgError) return apiError(err.message, err.status, { code: err.code })
    return handleRouteError(err)
  }
}
