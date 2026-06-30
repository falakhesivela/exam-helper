import { NextResponse } from "next/server"
import { requireUser } from "@/lib/api/auth"
import { apiError, handleRouteError } from "@/lib/api/route-utils"
import { checkRateLimit } from "@/lib/db/rate-limit"
import { createAdminClient } from "@/lib/supabase/admin"
import { coachPlan } from "@/lib/ai"
import { computePlanPace } from "@/lib/plan/pace"
import { loadPrimaryExamReadiness } from "@/lib/progress/server-readiness"
import { toStudyPlan, type DbStudyPlan, type DbStudyPlanTask } from "@/lib/db/mappers"

export const runtime = "nodejs"

/** POST — AI coaching note for the active plan (pace-aware, domain-specific). */
export async function POST() {
  try {
    const user = await requireUser()
    if (!(await checkRateLimit(`coach:${user.id}`, 6, 60_000))) {
      return apiError("Slow down a moment and try again.", 429, {
        code: "RATE_LIMITED",
      })
    }
    const admin = createAdminClient()

    const { data: planRow } = await admin
      .from("study_plans")
      .select("id, exam_code, exam, target_date, target_score, projected_score")
      .eq("user_id", user.id)
      .eq("status", "active")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle()
    if (!planRow) {
      return apiError("No active plan to coach.", 400, { code: "NO_PLAN" })
    }

    const { data: tasks } = await admin
      .from("study_plan_tasks")
      .select(
        "id, day_index, scheduled_date, type, domain_id, domain_name, question_count, title, rationale, status",
      )
      .eq("plan_id", planRow.id)

    const plan = toStudyPlan(
      planRow as DbStudyPlan,
      (tasks ?? []) as DbStudyPlanTask[],
    )
    const today = new Date().toISOString().slice(0, 10)
    const pace = computePlanPace(plan, today)

    const ctx = await loadPrimaryExamReadiness(admin, user.id)
    const currentScore = ctx?.readiness.score ?? plan.projectedScore
    const weakDomains =
      ctx?.readiness.weakestDomains.map((d) => ({
        name: d.name,
        mastery: d.mastery,
      })) ?? []

    const coach = await coachPlan({
      exam: plan.exam,
      examCode: plan.examCode,
      currentScore,
      targetScore: plan.targetScore,
      daysRemaining: pace.daysRemaining,
      paceStatus: pace.status,
      behindBy: pace.behindBy,
      tasksRemaining: pace.tasksRemaining,
      weakDomains,
    })

    return NextResponse.json(coach)
  } catch (err) {
    return handleRouteError(err)
  }
}
