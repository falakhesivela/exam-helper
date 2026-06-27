/**
 * Deterministic study-plan scheduling engine. Pure and side-effect free so it's
 * cheap to test and reason about; the AI layer (Phase 2) only annotates copy.
 *
 * Inputs come from the readiness engine (per-domain mastery) and the exam
 * blueprint (domain weights). The engine front-loads the domains with the
 * biggest weighted gap to the target, interleaves periodic full mock exams and
 * spaced-review days, and never schedules more questions than the daily cap.
 */

export type StudyTaskType = "practice" | "exam" | "lesson" | "review"

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
  tasks: StudyTask[]
  /** Naive projection of the weighted score if the plan is completed. */
  projectedScore: number
}

/** Mock exam roughly once a week. */
const EXAM_INTERVAL_DAYS = 7
/** Domains below this mastery get a lesson before their first practice. */
const LESSON_MASTERY_THRESHOLD = 40
/** Maintenance weight so on-target domains still get occasional practice. */
const MAINTENANCE_EPSILON = 0.05
/** Per-session mastery-gain decay used only for the projection. */
const PROJECTION_DECAY = 0.6

function parseDate(iso: string): Date {
  const [y, m, d] = iso.split("-").map(Number)
  return new Date(Date.UTC(y, m - 1, d))
}

function toIso(date: Date): string {
  return date.toISOString().slice(0, 10)
}

function addDays(iso: string, days: number): string {
  const d = parseDate(iso)
  d.setUTCDate(d.getUTCDate() + days)
  return toIso(d)
}

function daysBetween(startIso: string, endIso: string): number {
  const ms = parseDate(endIso).getTime() - parseDate(startIso).getTime()
  return Math.round(ms / 86_400_000)
}

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

  const practiceQuestions = Math.max(1, Math.min(input.dailyLimit, 12))

  // 1. Focus weight per domain: weighted gap to target (maintenance floor).
  const focus = input.domains.map((d) => {
    const gap = Math.max(0, input.targetScore - d.mastery)
    const weight =
      (gap / 100) * (d.weightPercent / 100) + MAINTENANCE_EPSILON
    return { id: d.id, weight }
  })

  // 2. Classify each day. Day 0..totalDays-1 are study days; the exam is on the
  //    final day (dayIndex === totalDays). The day before the exam is a light
  //    review; a mock exam lands every EXAM_INTERVAL days; the day after each
  //    mock is a spaced review.
  type Slot = { dayIndex: number; kind: StudyTaskType }
  const slots: Slot[] = []
  const examDays = new Set<number>()
  for (let day = 0; day < totalDays; day++) {
    const isFinalDay = day === totalDays - 1
    const isExamDay =
      !isFinalDay &&
      day > 0 &&
      day % EXAM_INTERVAL_DAYS === 0 &&
      totalDays - day > 2
    if (isExamDay) {
      examDays.add(day)
      slots.push({ dayIndex: day, kind: "exam" })
    } else if (examDays.has(day - 1)) {
      slots.push({ dayIndex: day, kind: "review" })
    } else if (isFinalDay) {
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
    tasks,
    projectedScore,
  }
}
