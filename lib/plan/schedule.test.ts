import { test } from "node:test"
import assert from "node:assert/strict"
import { buildStudyPlan, type BuildPlanInput } from "./schedule.ts"

/** SAA-C03-like fixture: four weighted domains, weakest = cost-optimized. */
function fixture(overrides: Partial<BuildPlanInput> = {}): BuildPlanInput {
  return {
    examCode: "SAA-C03",
    targetScore: 72,
    startDate: "2026-06-01",
    targetDate: "2026-06-29", // 28 days
    dailyLimit: 20,
    fullExamQuestionCount: 65,
    domains: [
      { id: "design-resilient", name: "Resilient", weightPercent: 30, mastery: 60 },
      { id: "design-high-performing", name: "High-Performing", weightPercent: 28, mastery: 75 },
      { id: "design-secure", name: "Secure", weightPercent: 24, mastery: 55 },
      { id: "design-cost-optimized", name: "Cost", weightPercent: 18, mastery: 35 },
    ],
    ...overrides,
  }
}

test("tasks are date-ordered and span the timeline", () => {
  const plan = buildStudyPlan(fixture())
  assert.equal(plan.totalDays, 28)
  for (let i = 1; i < plan.tasks.length; i++) {
    assert.ok(
      plan.tasks[i].dayIndex >= plan.tasks[i - 1].dayIndex,
      "tasks must be non-decreasing in dayIndex",
    )
  }
  // First task starts on the start date.
  assert.equal(plan.tasks[0].date, "2026-06-01")
})

test("never schedules more questions than the daily limit", () => {
  const plan = buildStudyPlan(fixture({ dailyLimit: 8 }))
  for (const t of plan.tasks) {
    if (t.type === "practice") assert.ok(t.questionCount <= 8)
  }
})

test("weakest weighted domain gets the most practice", () => {
  const plan = buildStudyPlan(fixture())
  const counts = new Map<string, number>()
  for (const t of plan.tasks) {
    if (t.type === "practice" && t.domainId) {
      counts.set(t.domainId, (counts.get(t.domainId) ?? 0) + 1)
    }
  }
  const resilient = counts.get("design-resilient") ?? 0 // 30% weight, gap 12
  const highPerf = counts.get("design-high-performing") ?? 0 // 28% weight, gap ~0
  assert.ok(
    resilient > highPerf,
    `resilient(${resilient}) should exceed near-target high-performing(${highPerf})`,
  )
})

test("very weak domain gets a lesson before practice", () => {
  const plan = buildStudyPlan(fixture()) // cost-optimized mastery 35 < 40
  const costTasks = plan.tasks.filter((t) => t.domainId === "design-cost-optimized")
  assert.ok(costTasks.length > 0, "cost-optimized should have tasks")
  assert.equal(costTasks[0].type, "lesson", "first cost task should be a lesson")
})

test("schedules periodic mock exams and a review the day after", () => {
  const plan = buildStudyPlan(fixture())
  const examDays = plan.tasks.filter((t) => t.type === "exam").map((t) => t.dayIndex)
  assert.ok(examDays.length >= 2, "28-day plan should include multiple mock exams")
  for (const d of examDays) {
    const next = plan.tasks.find((t) => t.dayIndex === d + 1)
    assert.equal(next?.type, "review", "day after a mock should be a review")
  }
})

test("projection beats the current weighted score but stays bounded", () => {
  const f = fixture()
  const plan = buildStudyPlan(f)
  const current = Math.round(
    f.domains.reduce((s, d) => s + (d.weightPercent / 100) * d.mastery, 0) /
      f.domains.reduce((s, d) => s + d.weightPercent / 100, 0),
  )
  assert.ok(plan.projectedScore > current, "plan should project improvement")
  assert.ok(plan.projectedScore <= 100)
})

test("rejects a non-positive timeline", () => {
  assert.throws(() => buildStudyPlan(fixture({ targetDate: "2026-06-01" })), RangeError)
})

test("rest days get no tasks", () => {
  // 2026-06-01 is a Monday; rest on Sat(6)+Sun(0).
  const plan = buildStudyPlan(fixture({ restDays: [0, 6] }))
  const restDates = new Set(
    plan.tasks
      .map((t) => new Date(`${t.date}T00:00:00Z`).getUTCDay())
      .filter((d) => d === 0 || d === 6),
  )
  assert.equal(restDates.size, 0, "no task may land on a rest weekday")
  assert.ok(plan.tasks.length > 0)
  assert.deepEqual(plan.restDays, [0, 6])
})

test("mock exam cadence counts study days, not calendar days", () => {
  // 5 study days/week over 28 days = 20 study days → still ≥2 mocks.
  const plan = buildStudyPlan(fixture({ restDays: [0, 6] }))
  const exams = plan.tasks.filter((t) => t.type === "exam")
  assert.ok(exams.length >= 2, `expected ≥2 mocks, got ${exams.length}`)
  // The review after each mock lands on the next *study* day.
  for (const e of exams) {
    const after = plan.tasks.find((t) => t.dayIndex > e.dayIndex)
    assert.equal(after?.type, "review")
  }
})

test("effort maps to the per-day question budget", () => {
  const light = buildStudyPlan(fixture({ effort: "light" }))
  const intense = buildStudyPlan(fixture({ effort: "intense" }))
  const capped = buildStudyPlan(fixture({ effort: "intense", dailyLimit: 10 }))
  const maxQ = (p: ReturnType<typeof buildStudyPlan>) =>
    Math.max(...p.tasks.filter((t) => t.type === "practice").map((t) => t.questionCount))
  assert.equal(maxQ(light), 8)
  assert.equal(maxQ(intense), 20)
  assert.equal(maxQ(capped), 10, "dailyLimit caps the effort budget")
})

test("throws when rest days leave no study days", () => {
  // Two-day window (Mon 1st + Tue 2nd) with both weekdays rested out.
  assert.throws(
    () => buildStudyPlan(fixture({ targetDate: "2026-06-03", restDays: [1, 2] })),
    RangeError,
  )
})

test("final study day before the exam is a review", () => {
  const plan = buildStudyPlan(fixture({ restDays: [0, 6] }))
  const last = plan.tasks[plan.tasks.length - 1]
  assert.equal(last.type, "review")
})

test("handles a short 3-day crunch without exams", () => {
  const plan = buildStudyPlan(fixture({ targetDate: "2026-06-04" })) // 3 days
  assert.equal(plan.totalDays, 3)
  assert.ok(plan.tasks.length >= 1)
  // Too short for the weekly mock cadence.
  assert.equal(plan.tasks.filter((t) => t.type === "exam").length, 0)
})
