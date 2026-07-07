import { test } from "node:test"
import assert from "node:assert/strict"
import { buildPlanIcs } from "./ics.ts"
import type { StudyPlan } from "@/types"

function plan(): StudyPlan {
  return {
    id: "p1",
    examCode: "SAA-C03",
    exam: "AWS SAA",
    startDate: "2026-06-27",
    targetDate: "2026-07-18",
    targetScore: 75,
    projectedScore: 72,
    restDays: [],
    effort: "standard",
    tasks: [
      {
        id: "task-1",
        dayIndex: 0,
        scheduledDate: "2026-06-27",
        type: "lesson",
        domainName: "Cost-Optimized",
        questionCount: 0,
        title: "Learn: Cost-Optimized; review S3, EC2",
        rationale: "Fundamentals first.",
        status: "pending",
      },
      {
        id: "task-2",
        dayIndex: 7,
        scheduledDate: "2026-07-04",
        type: "exam",
        questionCount: 65,
        title: "Full mock exam (SAA-C03)",
        rationale: "Check readiness.",
        status: "pending",
      },
    ],
  }
}

test("emits a valid VCALENDAR envelope", () => {
  const ics = buildPlanIcs(plan())
  assert.ok(ics.startsWith("BEGIN:VCALENDAR\r\n"))
  assert.ok(ics.trimEnd().endsWith("END:VCALENDAR"))
  assert.match(ics, /VERSION:2\.0/)
})

test("one VEVENT per task with all-day dates", () => {
  const ics = buildPlanIcs(plan())
  assert.equal(ics.match(/BEGIN:VEVENT/g)?.length, 2)
  assert.match(ics, /DTSTART;VALUE=DATE:20260627/)
  // All-day DTEND is exclusive → the next day.
  assert.match(ics, /DTEND;VALUE=DATE:20260628/)
  assert.match(ics, /UID:task-1@prepa\.app/)
})

test("escapes commas and semicolons in text", () => {
  const ics = buildPlanIcs(plan())
  // "Learn: Cost-Optimized; review S3, EC2" → ; and , escaped.
  assert.match(ics, /SUMMARY:Learn: Cost-Optimized\\; review S3\\, EC2/)
})

test("default DTSTAMP is the current time, not a fixed constant", () => {
  const ics = buildPlanIcs(plan())
  const year = new Date().getUTCFullYear()
  assert.match(ics, new RegExp(`DTSTAMP:${year}\\d{4}T\\d{6}Z`))
  assert.ok(!ics.includes("DTSTAMP:20240101T000000Z"))
})

test("injectable DTSTAMP stays deterministic", () => {
  const ics = buildPlanIcs(plan(), "20260101T120000Z")
  assert.match(ics, /DTSTAMP:20260101T120000Z/)
})

test("skipped tasks are not exported", () => {
  const p = plan()
  p.tasks[0].status = "skipped"
  const ics = buildPlanIcs(p)
  assert.equal(ics.match(/BEGIN:VEVENT/g)?.length, 1)
  assert.ok(!ics.includes("UID:task-1@prepa.app"))
})

test("uses CRLF line endings", () => {
  const ics = buildPlanIcs(plan())
  assert.ok(ics.includes("\r\n"))
  assert.ok(!/[^\r]\n/.test(ics), "every LF must be preceded by CR")
})
