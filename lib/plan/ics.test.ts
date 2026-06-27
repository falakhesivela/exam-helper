import { test } from "node:test"
import assert from "node:assert/strict"
import { buildPlanIcs } from "./ics.ts"
import type { StudyPlan } from "@/types"

function plan(): StudyPlan {
  return {
    id: "p1",
    examCode: "SAA-C03",
    exam: "AWS SAA",
    targetDate: "2026-07-18",
    targetScore: 75,
    projectedScore: 72,
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

test("uses CRLF line endings", () => {
  const ics = buildPlanIcs(plan())
  assert.ok(ics.includes("\r\n"))
  assert.ok(!/[^\r]\n/.test(ics), "every LF must be preceded by CR")
})
