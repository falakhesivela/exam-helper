import { NextResponse } from "next/server"
import { z } from "zod"
import { requireUser } from "@/lib/api/auth"
import { apiError, handleRouteError } from "@/lib/api/route-utils"
import { createAdminClient } from "@/lib/supabase/admin"
import { toStudyPlanTask, type DbStudyPlanTask } from "@/lib/db/mappers"

export const runtime = "nodejs"

const patchSchema = z.object({
  status: z.enum(["pending", "done", "skipped"]),
})

/** PATCH — update a task's status (mark done / skipped / reopen). */
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = await requireUser()
    const { id } = await params
    const { status } = patchSchema.parse(await request.json())

    const admin = createAdminClient()
    const { data, error } = await admin
      .from("study_plan_tasks")
      .update({
        status,
        completed_at: status === "done" ? new Date().toISOString() : null,
      })
      .eq("id", id)
      .eq("user_id", user.id) // ownership guard (admin client bypasses RLS)
      .select(
        "id, day_index, scheduled_date, type, domain_id, domain_name, question_count, title, rationale, status",
      )
      .maybeSingle()

    if (error) throw error
    if (!data) return apiError("Task not found", 404, { code: "NOT_FOUND" })

    return NextResponse.json(toStudyPlanTask(data as DbStudyPlanTask))
  } catch (err) {
    return handleRouteError(err)
  }
}
