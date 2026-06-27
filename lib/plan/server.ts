import type { createAdminClient } from "@/lib/supabase/admin"
import { loadPrimaryExamReadiness } from "@/lib/progress/server-readiness"
import { buildStudyPlan } from "@/lib/plan/schedule"
import { toStudyPlan, type DbStudyPlanTask } from "@/lib/db/mappers"
import type { StudyPlan } from "@/types"

type AdminClient = ReturnType<typeof createAdminClient>

/** Pass-mark buffer so the plan aims slightly above the bare minimum. */
const TARGET_BUFFER = 3
/** Cap on questions/day scheduled for Pro (unlimited) users. */
const PRO_DAILY_CAP = 30

export interface GeneratePlanOptions {
  targetDate: string
  /** Defaults to today (server UTC date). */
  startDate?: string
}

export class PlanError extends Error {
  constructor(
    message: string,
    readonly code: "NO_EXAM" | "NO_DATA",
  ) {
    super(message)
  }
}

/**
 * Build and persist an active study plan for the user's primary exam. Archives
 * any existing active plan for that exam first (one active plan per exam).
 */
export async function generateAndStorePlan(
  admin: AdminClient,
  userId: string,
  opts: GeneratePlanOptions,
): Promise<StudyPlan> {
  const ctx = await loadPrimaryExamReadiness(admin, userId)
  if (!ctx) {
    throw new PlanError(
      "A study plan needs a recognized exam. Practice a preset exam first.",
      "NO_EXAM",
    )
  }
  const { blueprint, readiness } = ctx
  if (readiness.totalAnswered === 0) {
    throw new PlanError(
      "Answer a few questions so we can tailor your plan.",
      "NO_DATA",
    )
  }

  const { data: profile } = await admin
    .from("profiles")
    .select("plan, daily_limit")
    .eq("id", userId)
    .single()
  const dailyLimit =
    profile?.plan === "pro" ? PRO_DAILY_CAP : (profile?.daily_limit ?? 20)

  const startDate = opts.startDate ?? new Date().toISOString().slice(0, 10)
  const targetScore = Math.min(95, blueprint.passMark + TARGET_BUFFER)

  const built = buildStudyPlan({
    examCode: blueprint.examCode,
    targetScore,
    domains: readiness.domains.map((d) => ({
      id: d.id,
      name: d.name,
      weightPercent: d.weightPercent,
      mastery: d.mastery,
    })),
    startDate,
    targetDate: opts.targetDate,
    dailyLimit,
    fullExamQuestionCount: blueprint.questionCount,
  })

  // Archive any existing active plan for this exam, then insert the new one.
  await admin
    .from("study_plans")
    .update({ status: "archived", updated_at: new Date().toISOString() })
    .eq("user_id", userId)
    .eq("exam_code", blueprint.examCode)
    .eq("status", "active")

  const { data: planRow, error: planErr } = await admin
    .from("study_plans")
    .insert({
      user_id: userId,
      exam_code: blueprint.examCode,
      exam: blueprint.exam,
      target_date: opts.targetDate,
      target_score: targetScore,
      projected_score: built.projectedScore,
      status: "active",
    })
    .select("id, exam_code, exam, target_date, target_score, projected_score")
    .single()
  if (planErr || !planRow) throw planErr ?? new Error("Failed to create plan")

  const taskRows = built.tasks.map((t) => ({
    plan_id: planRow.id,
    user_id: userId,
    day_index: t.dayIndex,
    scheduled_date: t.date,
    type: t.type,
    domain_id: t.domainId ?? null,
    domain_name: t.domainName ?? null,
    question_count: t.questionCount,
    title: t.title,
    rationale: t.rationale,
    status: "pending" as const,
  }))

  const { data: insertedTasks, error: taskErr } = await admin
    .from("study_plan_tasks")
    .insert(taskRows)
    .select(
      "id, day_index, scheduled_date, type, domain_id, domain_name, question_count, title, rationale, status",
    )
  if (taskErr) throw taskErr

  return toStudyPlan(planRow, (insertedTasks ?? []) as DbStudyPlanTask[])
}
