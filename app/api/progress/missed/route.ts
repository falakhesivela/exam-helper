import { NextResponse } from "next/server"
import { requireUser } from "@/lib/api/auth"
import { handleRouteError } from "@/lib/api/route-utils"
import { loadMissedQuestions } from "@/lib/db/missed-questions"
import { createAdminClient } from "@/lib/supabase/admin"

export const runtime = "nodejs"

export async function GET(request: Request) {
  try {
    const user = await requireUser()
    const admin = createAdminClient()
    const url = new URL(request.url)
    const dueOnly = url.searchParams.get("due") === "true"
    const limit = Math.min(
      50,
      Math.max(1, Number(url.searchParams.get("limit") ?? 30) || 30),
    )

    const items = await loadMissedQuestions(admin, user.id, { limit, dueOnly })

    return NextResponse.json({ items, count: items.length })
  } catch (err) {
    return handleRouteError(err)
  }
}
