/**
 * Build an iCalendar (.ics) document from a study plan so learners can add the
 * schedule to Google/Apple/Outlook calendars (which then handle reminders).
 * Pure and dependency-free; emits all-day events per task.
 */

import type { StudyPlan } from "@/types"

/** Escape per RFC 5545 §3.3.11 (text values). */
function escapeText(value: string): string {
  return value
    .replace(/\\/g, "\\\\")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,")
    .replace(/\r?\n/g, "\\n")
}

/** "2026-06-27" -> "20260627". */
function compactDate(iso: string): string {
  return iso.replace(/-/g, "")
}

/** Day after an ISO date, as compact form (all-day DTEND is exclusive). */
function nextDayCompact(iso: string): string {
  const d = new Date(`${iso}T00:00:00Z`)
  d.setUTCDate(d.getUTCDate() + 1)
  return d.toISOString().slice(0, 10).replace(/-/g, "")
}

/** Fold lines longer than 75 octets per RFC 5545 §3.1. */
function fold(line: string): string {
  if (line.length <= 75) return line
  const chunks: string[] = []
  let rest = line
  chunks.push(rest.slice(0, 75))
  rest = rest.slice(75)
  while (rest.length > 74) {
    chunks.push(` ${rest.slice(0, 74)}`)
    rest = rest.slice(74)
  }
  if (rest.length > 0) chunks.push(` ${rest}`)
  return chunks.join("\r\n")
}

export function buildPlanIcs(plan: StudyPlan, dtstamp = "20240101T000000Z"): string {
  const lines: string[] = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Prepa//Study Plan//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    `X-WR-CALNAME:Prepa — ${escapeText(plan.examCode)} study plan`,
  ]

  for (const task of plan.tasks) {
    lines.push(
      "BEGIN:VEVENT",
      `UID:${task.id}@prepa.app`,
      `DTSTAMP:${dtstamp}`,
      `DTSTART;VALUE=DATE:${compactDate(task.scheduledDate)}`,
      `DTEND;VALUE=DATE:${nextDayCompact(task.scheduledDate)}`,
      fold(`SUMMARY:${escapeText(task.title)}`),
      fold(`DESCRIPTION:${escapeText(task.rationale)}`),
      "END:VEVENT",
    )
  }

  lines.push("END:VCALENDAR")
  return lines.join("\r\n")
}
