import type { QuestionType } from "@/types"
import type { ExamBlueprint } from "./types"

export interface QuestionTypeAllocation {
  type: QuestionType
  count: number
}

/** Splits total exam questions into MCQ vs drag types from blueprint mix fractions. */
export function allocateQuestionTypes(
  total: number,
  mix?: ExamBlueprint["questionTypeMix"],
): QuestionTypeAllocation[] {
  if (!mix || total <= 0) {
    return [{ type: "mcq", count: total }]
  }

  const dragTypes: Array<Exclude<QuestionType, "mcq">> = [
    "drag_match",
    "drag_order",
    "drag_categorize",
    "select_grid",
    "command_input",
  ]

  const raw = dragTypes.map((type) => ({
    type,
    fraction: mix[type] ?? 0,
  }))

  const dragTotal = Math.min(
    total - 1,
    raw.reduce((sum, r) => sum + Math.round(total * r.fraction), 0),
  )

  const counts = new Map<QuestionType, number>()
  let assigned = 0

  for (const { type, fraction } of raw) {
    const count = Math.round(total * fraction)
    if (count > 0) {
      counts.set(type, count)
      assigned += count
    }
  }

  while (assigned > dragTotal) {
    const largest = [...counts.entries()].sort((a, b) => b[1] - a[1])[0]
    if (!largest || largest[1] <= 0) break
    counts.set(largest[0], largest[1] - 1)
    assigned -= 1
  }

  while (assigned < dragTotal) {
    const pick = raw.find((r) => (mix[r.type] ?? 0) > 0)?.type ?? "drag_match"
    counts.set(pick, (counts.get(pick) ?? 0) + 1)
    assigned += 1
  }

  const result: QuestionTypeAllocation[] = [
    { type: "mcq", count: total - dragTotal },
  ]
  for (const type of dragTypes) {
    const count = counts.get(type) ?? 0
    if (count > 0) result.push({ type, count })
  }
  return result
}

/** Spreads drag question counts across domains by weight. */
export function allocateDragByDomain(
  dragCount: number,
  domainWeights: { domainId: string; weight: number }[],
): Map<string, number> {
  const map = new Map<string, number>()
  if (dragCount <= 0 || domainWeights.length === 0) return map

  const totalWeight = domainWeights.reduce((s, d) => s + d.weight, 0)
  let assigned = 0
  const rows = domainWeights.map((d, i) => {
    const exact = (dragCount * d.weight) / totalWeight
    const floor = Math.floor(exact)
    assigned += floor
    return { domainId: d.domainId, floor, remainder: exact - floor, i }
  })

  let remaining = dragCount - assigned
  rows
    .sort((a, b) => b.remainder - a.remainder || a.i - b.i)
    .forEach((row) => {
      if (remaining <= 0) return
      row.floor += 1
      remaining -= 1
    })

  for (const row of rows) {
    if (row.floor > 0) map.set(row.domainId, row.floor)
  }
  return map
}
