import type { DomainAllocation, ExamBlueprint, ExamBlueprintDomain } from "./types"

/**
 * Split a question count across exam domains using official weights.
 * Uses largest-remainder rounding so the total always matches exactly.
 */
export function allocateQuestionsByDomain(
  total: number,
  domains: ExamBlueprintDomain[],
): DomainAllocation[] {
  if (total <= 0 || domains.length === 0) return []

  const weightSum = domains.reduce((sum, d) => sum + d.weightPercent, 0) || 1
  const raw = domains.map((d) => (total * d.weightPercent) / weightSum)
  const floors = raw.map((r) => Math.floor(r))
  let remaining = total - floors.reduce((a, b) => a + b, 0)

  const byRemainder = raw
    .map((r, i) => ({ i, frac: r - floors[i] }))
    .sort((a, b) => b.frac - a.frac)

  const counts = [...floors]
  for (const { i } of byRemainder) {
    if (remaining <= 0) break
    counts[i] += 1
    remaining -= 1
  }

  return domains
    .map((domain, i) => ({ domain, count: counts[i] }))
    .filter((a) => a.count > 0)
}

/** Scale duration proportionally when running a shorter mock exam. */
export function scaledExamParams(
  blueprint: Pick<ExamBlueprint, "questionCount" | "durationMin">,
  questionCount: number,
): { questionCount: number; durationMin: number } {
  if (questionCount >= blueprint.questionCount) {
    return {
      questionCount: blueprint.questionCount,
      durationMin: blueprint.durationMin,
    }
  }
  const ratio = questionCount / blueprint.questionCount
  return {
    questionCount,
    durationMin: Math.max(5, Math.round(blueprint.durationMin * ratio)),
  }
}
