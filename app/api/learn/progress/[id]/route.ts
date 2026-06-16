import { NextResponse } from "next/server"
import { z } from "zod"
import { requireUser } from "@/lib/api/auth"
import { handleRouteError } from "@/lib/api/route-utils"
import { createAdminClient } from "@/lib/supabase/admin"
import { updateLessonProgress } from "@/lib/db/lessons"

export const runtime = "nodejs"

const bodySchema = z.object({
  status: z.enum(["started", "completed"]).optional(),
  bookmarked: z.boolean().optional(),
})

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = await requireUser()
    const { id } = await params
    const body = bodySchema.parse(await request.json())

    const admin = createAdminClient()
    const result = await updateLessonProgress(admin, user.id, id, body)

    return NextResponse.json(result)
  } catch (err) {
    return handleRouteError(err)
  }
}
