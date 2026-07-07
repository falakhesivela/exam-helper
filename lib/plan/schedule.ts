/**
 * Deterministic study-plan scheduling engine. Pure and side-effect free so it's
 * cheap to test and reason about; the AI layer (Phase 2) only annotates copy.
 *
 * Inputs come from the readiness engine (per-domain mastery) and the exam
 * blueprint (domain weights). The engine front-loads the domains with the
 * biggest weighted gap to the target, interleaves periodic full mock exams and
 * spaced-review days, and never schedules more questions than the daily cap.
 */

import { addDays, daysBetween, weekdayOf } from "./dates.ts"

export type StudyTaskType = "practice" | "exam" | "lesson" | "review"
export type PlanEffort = "light" | "standard" | "intense"

/** Per-day practice question budget for each effort level (capped by dailyLimit). */
export const EFFORT_QUESTION_BUDGET: Record<PlanEffort, number> = {
  light: 8,
  standard: 12,
  intense: 20,
}

export interface PlanDomainInput {
  id: string
  name: string
  /** Blueprint weight (percent of the exam). */
  weightPercent: number
  /** Current effective mastery, 0-100. */
  mastery: number
}

export interface BuildPlanInput {
  examCode: string
  /** Score the plan aims for (usually the pass mark, maybe +buffer). */
  targetScore: number
  domains: PlanDomainInput[]
  /** Today, ISO `YYYY-MM-DD`. */
  startDate: string
  /** Exam day, ISO `YYYY-MM-DD`. Must be after startDate. */
  targetDate: string
  /** Max questions to schedule on a single day (free tier = 20). */
  dailyLimit: number
  /** Question count for a full mock exam (blueprint.questionCount). */
  fullExamQuestionCount: number
  /** UTC weekdays (0=Sun..6=Sat) with no scheduled tasks. At most 6. */
  restDays?: number[]
  /** Daily intensity; maps to a per-day question budget capped by dailyLimit. */
  effort?: PlanEffort
}

export interface StudyTask {
  /** 0-based offset from startDate. */
  dayIndex: number
  date: string
  type: StudyTaskType
  domainId?: string
  domainName?: string
  questionCount: number
  title: string
  rationale: string
}

export interface StudyPlan {
  examCode: string
  startDate: string
  targetDate: string
  targetScore: number
  totalDays: number
  restDays: number[]
  effort: PlanEffort
  tasks: StudyTask[]
  /** Naive projection of the weighted score if the plan is completed. */
  projectedScore: number
}

/** Mock exam roughly once a week (counted in study days, not calendar days). */
const EXAM_INTERVAL_DAYS = 7
/** Domains below this mastery get a lesson before their first practice. */
const LESSON_MASTERY_THRESHOLD = 40
/** Maintenance weight so on-target domains still get occasional practice. */
const MAINTENANCE_EPSILON = 0.05
/** Per-session mastery-gain decay used only for the projection. */
const PROJECTION_DECAY = 0.6

/** Largest-remainder apportionment of `total` slots across weighted domains. */
function apportion(
  weights: { id: string; weight: number }[],
  total: number,
): Map<string, number> {
  const result = new Map<string, number>()
  const sum = weights.reduce((s, w) => s + w.weight, 0)
  if (sum <= 0 || total <= 0) {
    for (const w of weights) result.set(w.id, 0)
    return result
  }
  const quotas = weights.map((w) => ({
    id: w.id,
    exact: (w.weight / sum) * total,
  }))
  let assigned = 0
  for (const q of quotas) {
    const floor = Math.floor(q.exact)
    result.set(q.id, floor)
    assigned += floor
  }
  // Hand out the remaining slots by largest fractional remainder.
  const remainders = quotas
    .map((q) => ({ id: q.id, frac: q.exact - Math.floor(q.exact) }))
    .sort((a, b) => b.frac - a.frac)
  let i = 0
  while (assigned < total && remainders.length > 0) {
    const id = remainders[i % remainders.length].id
    result.set(id, (result.get(id) ?? 0) + 1)
    assigned += 1
    i += 1
  }
  return result
}

export function buildStudyPlan(input: BuildPlanInput): StudyPlan {
  const totalDays = daysBetween(input.startDate, input.targetDate)
  if (totalDays < 1) {
    throw new RangeError("targetDate must be at least one day after startDate")
  }
  if (input.domains.length === 0) {
    throw new RangeError("at least one domain is required")
  }

  const effort = input.effort ?? "standard"
  const restDays = new Set(input.restDays ?? [])
  const practiceQuestions = Math.max(
    1,
    Math.min(input.dailyLimit, EFFORT_QUESTION_BUDGET[effort]),
  )

  // 1. Focus weight per domain: weighted gap to target (maintenance floor).
  const focus = input.domains.map((d) => {
    const gap = Math.max(0, input.targetScore - d.mastery)
    const weight =
      (gap / 100) * (d.weightPercent / 100) + MAINTENANCE_EPSILON
    return { id: d.id, weight }
  })

  // 2. Study days are days 0..totalDays-1 whose weekday isn't a rest day; the
  //    exam is on the final day (dayIndex === totalDays). Classify each study
  //    day: a mock exam every EXAM_INTERVAL study days, a spaced review on the
  //    study day after each mock, and a light review on the last study day.
  const studyDayIndexes: number[] = []
  for (let day = 0; day < totalDays; day++) {
    if (!restDays.has(weekdayOf(addDays(input.startDate, day)))) {
      studyDayIndexes.push(day)
    }
  }
  if (studyDayIndexes.length === 0) {
    throw new RangeError("no study days available before the exam")
  }

  type Slot = { dayIndex: number; kind: StudyTaskType }
  const slots: Slot[] = []
  const lastStudyDay = studyDayIndexes[studyDayIndexes.length - 1]
  let reviewAfterExam = false
  for (let i = 0; i < studyDayIndexes.length; i++) {
    const day = studyDayIndexes[i]
    const isFinal = day === lastStudyDay
    const isExamDay =
      !isFinal &&
      i > 0 &&
      i % EXAM_INTERVAL_DAYS === 0 &&
      studyDayIndexes.length - i > 2
    if (isExamDay) {
      slots.push({ dayIndex: day, kind: "exam" })
      reviewAfterExam = true
    } else if (reviewAfterExam) {
      slots.push({ dayIndex: day, kind: "review" })
      reviewAfterExam = false
    } else if (isFinal) {
      slots.push({ dayIndex: day, kind: "review" })
    } else {
      slots.push({ dayIndex: day, kind: "practice" })
    }
  }

  // 3. Apportion practice slots to domains by focus weight.
  const practiceSlotDays = slots.filter((s) => s.kind === "practice")
  const perDomain = apportion(focus, practiceSlotDays.length)

  // Build a weakest-first, round-robin order of domain ids to fill practice days.
  const order: string[] = []
  const remaining = new Map(perDomain)
  const byFocus = [...focus].sort((a, b) => b.weight - a.weight).map((f) => f.id)
  let safety = practiceSlotDays.length
  while (order.length < practiceSlotDays.length && safety-- > 0) {
    for (const id of byFocus) {
      if ((remaining.get(id) ?? 0) > 0) {
        order.push(id)
        remaining.set(id, (remaining.get(id) ?? 0) - 1)
        if (order.length >= practiceSlotDays.length) break
      }
    }
  }

  const domainById = new Map(input.domains.map((d) => [d.id, d]))
  const lessonGiven = new Set<string>()
  const practiceCount = new Map<string, number>()

  // 4. Materialize tasks.
  const tasks: StudyTask[] = []
  let practiceCursor = 0
  for (const slot of slots) {
    const date = addDays(input.startDate, slot.dayIndex)
    if (slot.kind === "exam") {
      tasks.push({
        dayIndex: slot.dayIndex,
        date,
        type: "exam",
        questionCount: input.fullExamQuestionCount,
        title: `Full mock exam (${input.examCode})`,
        rationale: "Check your readiness under real timing and pacing.",
      })
      continue
    }
    if (slot.kind === "review") {
      tasks.push({
        dayIndex: slot.dayIndex,
        date,
        type: "review",
        questionCount: 0,
        title: "Review missed questions",
        rationale: "Spaced repetition of the items you got wrong.",
      })
      continue
    }
    // practice
    const domainId = order[practiceCursor++]
    const domain = domainId ? domainById.get(domainId) : undefined
    if (!domain) continue
    if (
      domain.mastery < LESSON_MASTERY_THRESHOLD &&
      !lessonGiven.has(domain.id)
    ) {
      lessonGiven.add(domain.id)
      tasks.push({
        dayIndex: slot.dayIndex,
        date,
        type: "lesson",
        domainId: domain.id,
        domainName: domain.name,
        questionCount: 0,
        title: `Learn: ${domain.name}`,
        rationale: "Build the fundamentals before drilling questions.",
      })
      continue
    }
    practiceCount.set(domain.id, (practiceCount.get(domain.id) ?? 0) + 1)
    tasks.push({
      dayIndex: slot.dayIndex,
      date,
      type: "practice",
      domainId: domain.id,
      domainName: domain.name,
      questionCount: practiceQuestions,
      title: `Practice: ${domain.name} (${practiceQuestions}Q)`,
      rationale: `Currently ${Math.round(domain.mastery)}% — your weakest weighted area.`,
    })
  }

  // 5. Naive projection: each focused practice session closes part of the gap.
  let projected = 0
  let totalWeight = 0
  for (const d of input.domains) {
    const n = practiceCount.get(d.id) ?? 0
    const closed = 1 - Math.pow(PROJECTION_DECAY, n)
    const newMastery = d.mastery + (input.targetScore - d.mastery) * closed * 0.9
    projected += (d.weightPercent / 100) * newMastery
    totalWeight += d.weightPercent / 100
  }
  const projectedScore = Math.round(totalWeight > 0 ? projected / totalWeight : 0)

  return {
    examCode: input.examCode,
    startDate: input.startDate,
    targetDate: input.targetDate,
    targetScore: input.targetScore,
    totalDays,
    restDays: [...restDays].sort(),
    effort,
    tasks,
    projectedScore,
  }
}
