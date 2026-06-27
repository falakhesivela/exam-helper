import { NextResponse } from "next/server"
import { z } from "zod"
import { requireUser } from "@/lib/api/auth"
import { apiError, handleRouteError } from "@/lib/api/route-utils"
import { createAdminClient } from "@/lib/supabase/admin"
import { generateAndStorePlan, PlanError } from "@/lib/plan/server"
import { toStudyPlan, type DbStudyPlanTask, type DbStudyPlan } from "@/lib/db/mappers"

export const runtime = "nodejs"

const createSchema = z.object({
  targetDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Expected YYYY-MM-DD"),
})

/** GET — the user's active plan (with tasks) for their primary exam, or null. */
export async function GET() {
  try {
    const user = await requireUser()
    const admin = createAdminClient()

    const { data: planRow } = await admin
      .from("study_plans")
      .select("id, exam_code, exam, target_date, target_score, projected_score")
      .eq("user_id", user.id)
      .eq("status", "active")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle()

    if (!planRow) return NextResponse.json(null)

    const { data: tasks } = await admin
      .from("study_plan_tasks")
      .select(
        "id, day_index, scheduled_date, type, domain_id, domain_name, question_count, title, rationale, status",
      )
      .eq("plan_id", planRow.id)
      .order("day_index", { ascending: true })

    return NextResponse.json(
      toStudyPlan(planRow as DbStudyPlan, (tasks ?? []) as DbStudyPlanTask[]),
    )
  } catch (err) {
    return handleRouteError(err)
  }
}

/** POST — generate (and persist) a fresh plan to a target date. */
export async function POST(request: Request) {
  try {
    const user = await requireUser()
    const body = createSchema.parse(await request.json())

    const today = new Date().toISOString().slice(0, 10)
    if (body.targetDate <= today) {
      return apiError("Pick a target date in the future.", 400, {
        code: "INVALID_DATE",
      })
    }

    const admin = createAdminClient()
    const plan = await generateAndStorePlan(admin, user.id, {
      targetDate: body.targetDate,
    })
    return NextResponse.json(plan)
  } catch (err) {
    if (err instanceof PlanError) {
      return apiError(err.message, 400, { code: err.code })
    }
    return handleRouteError(err)
  }
}
