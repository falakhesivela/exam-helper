import { NextResponse } from "next/server"
import { z } from "zod"
import { requireUser } from "@/lib/api/auth"
import { apiError, handleRouteError } from "@/lib/api/route-utils"
import { createAdminClient } from "@/lib/supabase/admin"
import { createOrg, loadTeam, OrgError } from "@/lib/db/organizations"

export const runtime = "nodejs"

/** GET — the user's team with member progress, or null. */
export async function GET() {
  try {
    const user = await requireUser()
    const admin = createAdminClient()
    const team = await loadTeam(admin, user.id)
    return NextResponse.json(team)
  } catch (err) {
    return handleRouteError(err)
  }
}

const createSchema = z.object({ name: z.string().min(1).max(80) })

/** POST — create a team (the user becomes owner). */
export async function POST(request: Request) {
  try {
    const user = await requireUser()
    const { name } = createSchema.parse(await request.json())
    const admin = createAdminClient()
    const team = await createOrg(admin, user.id, name)
    return NextResponse.json(team)
  } catch (err) {
    if (err instanceof OrgError) return apiError(err.message, err.status, { code: err.code })
    return handleRouteError(err)
  }
}
