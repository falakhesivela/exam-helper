import type { createAdminClient } from "@/lib/supabase/admin"
import { loadExamReadiness } from "@/lib/progress/server-readiness"
import { buildStudyPlan, type PlanEffort } from "@/lib/plan/schedule"
import { rebalancePlan } from "@/lib/plan/rebalance"
import { toStudyPlan, type DbStudyPlanTask, type DbStudyPlan } from "@/lib/db/mappers"
import { limitsFor } from "@/lib/config/tiers"
import type { StudyPlan } from "@/types"

type AdminClient = ReturnType<typeof createAdminClient>

/** Pass-mark buffer so the plan aims slightly above the bare minimum. */
const TARGET_BUFFER = 3
/** Cap on questions/day scheduled for Pro (unlimited) users. */
const PRO_DAILY_CAP = 30

/** Columns the API layer needs from study_plans. */
export const PLAN_COLUMNS =
  "id, exam_code, exam, start_date, target_date, target_score, projected_score, rest_days, effort, last_rebalanced_on"
/** Columns the API layer needs from study_plan_tasks. */
export const TASK_COLUMNS =
  "id, day_index, scheduled_date, type, domain_id, domain_name, question_count, title, rationale, status"

export interface GeneratePlanOptions {
  targetDate: string
  /** Defaults to today (server UTC date). */
  startDate?: string
  /** Pin generation to this exam (e.g. regenerating an existing plan). */
  examCode?: string
  /** UTC weekdays (0=Sun..6=Sat) with no scheduled tasks. */
  restDays?: number[]
  effort?: PlanEffort
}

export class PlanError extends Error {
  constructor(
    message: string,
    readonly code: "NO_EXAM" | "NO_DATA" | "NO_PLAN" | "NOT_ENOUGH_DAYS",
  ) {
    super(message)
  }
}

/**
 * Build and persist an active study plan. Archives any existing active plan
 * for the exam first (one active plan per exam). Defaults to the user's
 * primary exam unless `examCode` pins it.
 */
export async function generateAndStorePlan(
  admin: AdminClient,
  userId: string,
  opts: GeneratePlanOptions,
): Promise<StudyPlan> {
  const ctx = await loadExamReadiness(admin, userId, opts.examCode)
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
    .select("plan")
    .eq("id", userId)
    .single()
  const tierQuestions = limitsFor(profile?.plan).questions
  const dailyLimit =
    tierQuestions === null
      ? PRO_DAILY_CAP
      : Math.min(PRO_DAILY_CAP, tierQuestions)

  const startDate = opts.startDate ?? new Date().toISOString().slice(0, 10)
  const targetScore = Math.min(95, blueprint.passMark + TARGET_BUFFER)

  let built
  try {
    built = buildStudyPlan({
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
      restDays: opts.restDays,
      effort: opts.effort,
    })
  } catch (err) {
    if (err instanceof RangeError) {
      throw new PlanError(
        "That schedule leaves no study days before the exam. Pick a later date or free up a weekday.",
        "NOT_ENOUGH_DAYS",
      )
    }
    throw err
  }

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
      start_date: built.startDate,
      target_date: opts.targetDate,
      target_score: targetScore,
      projected_score: built.projectedScore,
      rest_days: built.restDays,
      effort: built.effort,
      last_rebalanced_on: built.startDate,
      status: "active",
    })
    .select(PLAN_COLUMNS)
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
    .select(TASK_COLUMNS)
  if (taskErr) throw taskErr

  return toStudyPlan(planRow as DbStudyPlan, (insertedTasks ?? []) as DbStudyPlanTask[])
}

interface RebalanceablePlanRow {
  id: string
  start_date: string
  target_date: string
  rest_days: number[] | null
  last_rebalanced_on: string | null
}

/**
 * Roll overdue pending tasks forward onto the remaining study days. Runs at
 * most once per UTC day per plan (gated by `last_rebalanced_on`) and persists
 * the moves, so every reader — plan page, dashboard, coach, .ics — sees the
 * same adapted schedule. Returns the refreshed task rows (or the input when
 * nothing changed).
 */
export async function rebalanceStoredPlan(
  admin: AdminClient,
  userId: string,
  planRow: RebalanceablePlanRow,
  tasks: DbStudyPlanTask[],
  today: string,
): Promise<DbStudyPlanTask[]> {
  if (planRow.last_rebalanced_on && planRow.last_rebalanced_on >= today) {
    return tasks
  }

  const { moves } = rebalancePlan({
    startDate: planRow.start_date,
    targetDate: planRow.target_date,
    today,
    restDays: planRow.rest_days ?? [],
    tasks: tasks.map((t) => ({
      id: t.id,
      dayIndex: t.day_index,
      scheduledDate: t.scheduled_date,
      type: t.type,
      status: t.status,
    })),
  })

  const stamp = admin
    .from("study_plans")
    .update({ last_rebalanced_on: today, updated_at: new Date().toISOString() })
    .eq("id", planRow.id)
    .eq("user_id", userId)

  if (moves.length === 0) {
    await stamp
    return tasks
  }

  await Promise.all([
    stamp,
    ...moves.map((m) =>
      admin
        .from("study_plan_tasks")
        .update({
          scheduled_date: m.scheduledDate,
          day_index: m.dayIndex,
          ...(m.status ? { status: m.status } : {}),
        })
        .eq("id", m.id)
        .eq("user_id", userId),
    ),
  ])

  const byId = new Map(moves.map((m) => [m.id, m]))
  return tasks.map((t) => {
    const m = byId.get(t.id)
    if (!m) return t
    return {
      ...t,
      scheduled_date: m.scheduledDate,
      day_index: m.dayIndex,
      status: m.status ?? t.status,
    }
  })
}

/**
 * Validate a client-supplied plan-task id: it must belong to the user and sit
 * on an active plan. Returns the id when valid, undefined otherwise — invalid
 * ids are silently dropped so generation still works without the linkage.
 */
export async function resolveValidPlanTaskId(
  admin: AdminClient,
  userId: string,
  planTaskId: string | undefined,
): Promise<string | undefined> {
  if (!planTaskId) return undefined
  const { data } = await admin
    .from("study_plan_tasks")
    .select("id, study_plans!inner(status)")
    .eq("id", planTaskId)
    .eq("user_id", userId)
    .eq("study_plans.status", "active")
    .maybeSingle()
  return data ? planTaskId : undefined
}

/**
 * Mark the plan task linked to a completed session as done. Idempotent; used
 * by the session complete/submit routes so a task only counts once the user
 * actually finishes the work.
 */
export async function completePlanTaskForSession(
  admin: AdminClient,
  userId: string,
  planTaskId: string,
): Promise<void> {
  await admin
    .from("study_plan_tasks")
    .update({ status: "done", completed_at: new Date().toISOString() })
    .eq("id", planTaskId)
    .eq("user_id", userId)
    .neq("status", "done")
}
