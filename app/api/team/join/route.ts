import { NextResponse } from "next/server"
import { z } from "zod"
import { requireUser } from "@/lib/api/auth"
import { apiError, handleRouteError } from "@/lib/api/route-utils"
import { createAdminClient } from "@/lib/supabase/admin"
import { joinOrg, OrgError } from "@/lib/db/organizations"

export const runtime = "nodejs"

const schema = z.object({ token: z.string().min(1).max(128) })

/** POST — join a team from an invite token. */
export async function POST(request: Request) {
  try {
    const user = await requireUser()
    const { token } = schema.parse(await request.json())
    const admin = createAdminClient()
    const team = await joinOrg(admin, user.id, token)
    return NextResponse.json(team)
  } catch (err) {
    if (err instanceof OrgError) return apiError(err.message, err.status, { code: err.code })
    return handleRouteError(err)
  }
}
