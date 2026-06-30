import { NextResponse } from "next/server"
import { requireUser } from "@/lib/api/auth"
import { getTimezone, handleRouteError } from "@/lib/api/route-utils"
import { checkRateLimit } from "@/lib/db/rate-limit"
import { createAdminClient } from "@/lib/supabase/admin"
import { generateAndCacheLesson } from "@/lib/db/lessons"

export const runtime = "nodejs"

export async function POST(
  request: Request,
  { params }: { params: Promise<{ topicSlug: string }> },
) {
  try {
    const user = await requireUser()
    if (!(await checkRateLimit(`lesson-generate:${user.id}`, 5))) {
      return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429 })
    }

    const { topicSlug } = await params
    const url = new URL(request.url)
    const force = url.searchParams.get("force") === "true"

    const admin = createAdminClient()
    const lesson = await generateAndCacheLesson(
      admin,
      user.id,
      topicSlug,
      getTimezone(request),
      force,
    )

    return NextResponse.json(lesson)
  } catch (err) {
    return handleRouteError(err)
  }
}
