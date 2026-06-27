import { test } from "node:test"
import assert from "node:assert/strict"
import { computePlanPace } from "./pace.ts"
import type { StudyPlan, StudyPlanTask, StudyTaskStatus } from "@/types"

function task(
  dayIndex: number,
  scheduledDate: string,
  status: StudyTaskStatus,
): StudyPlanTask {
  return {
    id: `t${dayIndex}`,
    dayIndex,
    scheduledDate,
    type: "practice",
    questionCount: 10,
    title: "Practice",
    rationale: "",
    status,
  }
}

function plan(tasks: StudyPlanTask[], targetDate: string): StudyPlan {
  return {
    id: "p1",
    examCode: "SAA-C03",
    exam: "AWS SAA",
    targetDate,
    targetScore: 75,
    projectedScore: 72,
    tasks,
  }
}

test("on-track when completed matches what's scheduled by today", () => {
  const p = plan(
    [
      task(0, "2026-06-01", "done"),
      task(1, "2026-06-02", "done"),
      task(2, "2026-06-03", "pending"),
    ],
    "2026-06-10",
  )
  const pace = computePlanPace(p, "2026-06-02")
  assert.equal(pace.status, "on-track")
  assert.equal(pace.behindBy, 0)
  assert.equal(pace.daysRemaining, 8)
})

test("behind when scheduled tasks are left undone", () => {
  const p = plan(
    [
      task(0, "2026-06-01", "pending"),
      task(1, "2026-06-02", "pending"),
      task(2, "2026-06-03", "pending"),
    ],
    "2026-06-10",
  )
  const pace = computePlanPace(p, "2026-06-03")
  assert.equal(pace.status, "behind")
  assert.equal(pace.expectedDoneByToday, 3)
  assert.equal(pace.behindBy, 3)
})

test("ahead when more done than scheduled", () => {
  const p = plan(
    [
      task(0, "2026-06-01", "done"),
      task(1, "2026-06-02", "done"),
      task(2, "2026-06-03", "done"),
      task(3, "2026-06-08", "pending"), // future work still left
    ],
    "2026-06-10",
  )
  const pace = computePlanPace(p, "2026-06-02") // only 2 scheduled by now, 3 done
  assert.equal(pace.status, "ahead")
})

test("complete when all tasks done", () => {
  const p = plan([task(0, "2026-06-01", "done")], "2026-06-10")
  const pace = computePlanPace(p, "2026-06-05")
  assert.equal(pace.status, "complete")
  assert.equal(pace.tasksRemaining, 0)
  assert.equal(pace.requiredPerDay, 0)
})

test("one task behind is tolerated (still on-track)", () => {
  const p = plan(
    [
      task(0, "2026-06-01", "done"),
      task(1, "2026-06-02", "pending"),
      task(2, "2026-06-03", "pending"),
    ],
    "2026-06-10",
  )
  const pace = computePlanPace(p, "2026-06-02")
  assert.equal(pace.status, "on-track")
})

test("required-per-day reflects remaining workload", () => {
  const tasks = Array.from({ length: 10 }, (_, i) =>
    task(i, `2026-06-${String(i + 1).padStart(2, "0")}`, "pending"),
  )
  const pace = computePlanPace(plan(tasks, "2026-06-06"), "2026-06-01")
  // 10 tasks remaining over 5 days = 2/day.
  assert.equal(pace.requiredPerDay, 2)
})
