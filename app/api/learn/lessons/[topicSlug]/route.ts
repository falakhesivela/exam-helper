import { NextResponse } from "next/server"
import { requireUser } from "@/lib/api/auth"
import { getTimezone, handleRouteError } from "@/lib/api/route-utils"
import { createAdminClient } from "@/lib/supabase/admin"
import { loadTopicLesson } from "@/lib/db/lessons"

export const runtime = "nodejs"

export async function GET(
  request: Request,
  { params }: { params: Promise<{ topicSlug: string }> },
) {
  try {
    const user = await requireUser()
    const { topicSlug } = await params
    const admin = createAdminClient()
    const lesson = await loadTopicLesson(
      admin,
      user.id,
      topicSlug,
      getTimezone(request),
    )
    return NextResponse.json(lesson)
  } catch (err) {
    return handleRouteError(err)
  }
}
