import { test } from "node:test"
import assert from "node:assert/strict"
import { rebalancePlan, type RebalanceTask, type RebalanceMove } from "./rebalance.ts"
import { daysBetween, weekdayOf } from "./dates.ts"

const START = "2026-06-01" // a Monday
const TARGET = "2026-06-29"

let nextId = 0
function task(
  dayIndex: number,
  scheduledDate: string,
  status: RebalanceTask["status"] = "pending",
  type: RebalanceTask["type"] = "practice",
): RebalanceTask {
  return { id: `t${nextId++}`, dayIndex, scheduledDate, type, status }
}

function run(tasks: RebalanceTask[], today: string, restDays: number[] = []) {
  return rebalancePlan({
    startDate: START,
    targetDate: TARGET,
    today,
    restDays,
    tasks,
  })
}

/** Apply moves to a task list, as the server would. */
function apply(tasks: RebalanceTask[], moves: RebalanceMove[]): RebalanceTask[] {
  const byId = new Map(moves.map((m) => [m.id, m]))
  return tasks.map((t) => {
    const m = byId.get(t.id)
    if (!m) return t
    return {
      ...t,
      scheduledDate: m.scheduledDate,
      dayIndex: m.dayIndex,
      status: m.status ?? t.status,
    }
  })
}

test("no overdue tasks → no moves", () => {
  const tasks = [task(0, "2026-06-01", "done"), task(3, "2026-06-04")]
  assert.deepEqual(run(tasks, "2026-06-02").moves, [])
})

test("overdue pending tasks roll forward onto the runway", () => {
  const tasks = [
    task(0, "2026-06-01"),
    task(1, "2026-06-02"),
    task(5, "2026-06-06"),
  ]
  const { moves } = run(tasks, "2026-06-04")
  assert.equal(moves.length, 2)
  for (const m of moves) {
    assert.ok(m.scheduledDate >= "2026-06-04", "moved on or after today")
    assert.ok(m.scheduledDate < TARGET, "moved before the exam")
    assert.equal(m.status, undefined)
  }
})

test("done and skipped tasks are never touched", () => {
  const tasks = [
    task(0, "2026-06-01", "done"),
    task(1, "2026-06-02", "skipped"),
    task(2, "2026-06-03"),
  ]
  const { moves } = run(tasks, "2026-06-05")
  assert.deepEqual(moves.map((m) => m.id), [tasks[2].id])
})

test("future pending tasks stay where they are", () => {
  const tasks = [task(0, "2026-06-01"), task(10, "2026-06-11")]
  const { moves } = run(tasks, "2026-06-03")
  assert.ok(!moves.some((m) => m.id === tasks[1].id))
})

test("dayIndex invariant: always daysBetween(startDate, newDate)", () => {
  const tasks = [task(0, "2026-06-01"), task(1, "2026-06-02")]
  for (const m of run(tasks, "2026-06-10").moves) {
    assert.equal(m.dayIndex, daysBetween(START, m.scheduledDate))
  }
})

test("idempotent: applying the moves and rerunning yields no moves", () => {
  const tasks = [
    task(0, "2026-06-01"),
    task(1, "2026-06-02"),
    task(2, "2026-06-03"),
    task(8, "2026-06-09"),
  ]
  const first = run(tasks, "2026-06-05")
  assert.ok(first.moves.length > 0)
  const after = apply(tasks, first.moves)
  assert.deepEqual(run(after, "2026-06-05").moves, [])
})

test("rest days are respected when rolling forward", () => {
  const tasks = [task(0, "2026-06-01"), task(1, "2026-06-02")]
  const { moves } = run(tasks, "2026-06-05", [0, 6]) // no weekends
  assert.ok(moves.length > 0)
  for (const m of moves) {
    const wd = weekdayOf(m.scheduledDate)
    assert.ok(wd !== 0 && wd !== 6, `landed on rest day: ${m.scheduledDate}`)
  }
})

test("caps rolled-forward load at 2/day with room to spare", () => {
  const tasks = [
    task(0, "2026-06-01"),
    task(1, "2026-06-02"),
    task(2, "2026-06-03"),
  ]
  const { moves } = run(tasks, "2026-06-10")
  const perDay = new Map<string, number>()
  for (const m of moves) {
    perDay.set(m.scheduledDate, (perDay.get(m.scheduledDate) ?? 0) + 1)
  }
  for (const [, n] of perDay) assert.ok(n <= 2)
})

test("overflow skips oldest overdue practice tasks, never exams or reviews", () => {
  // 25 overdue tasks with 3 runway days (26th..28th) → 3/day = 9 slots max.
  const tasks: RebalanceTask[] = []
  for (let i = 0; i < 23; i++) tasks.push(task(i, "2026-06-02"))
  tasks.push(task(23, "2026-06-02", "pending", "exam"))
  tasks.push(task(24, "2026-06-02", "pending", "review"))
  const { moves } = run(tasks, "2026-06-26")
  const skipped = moves.filter((m) => m.status === "skipped")
  assert.ok(skipped.length > 0, "overflow must skip something")
  const byId = new Map(tasks.map((t) => [t.id, t]))
  for (const m of skipped) {
    assert.equal(byId.get(m.id)?.type, "practice")
  }
  // Exam and review survive with a scheduled slot before the exam.
  for (const t of tasks.slice(23)) {
    const move = moves.find((m) => m.id === t.id)
    assert.ok(move && !move.status, `${t.type} must be rescheduled, not skipped`)
    assert.ok(move.scheduledDate < TARGET)
  }
})

test("exam date passed → leaves everything alone", () => {
  const tasks = [task(0, "2026-06-01")]
  assert.deepEqual(run(tasks, "2026-06-29").moves, [])
  assert.deepEqual(run(tasks, "2026-07-15").moves, [])
})
