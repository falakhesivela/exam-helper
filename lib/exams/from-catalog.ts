import type { ExamCatalog } from "@/lib/learning/types"
import type { ExamBlueprint, ExamBlueprintDomain, ExamProvider } from "./types"

function parseWeight(weight: string): number {
  const n = Number.parseFloat(weight.replace("%", ""))
  return Number.isFinite(n) ? n : 0
}

export function domainsFromCatalog(catalog: ExamCatalog): ExamBlueprintDomain[] {
  return catalog.domains.map((domain) => ({
    id: domain.id,
    name: domain.name,
    weightPercent: parseWeight(domain.weight),
    topics: domain.topics.flatMap((topic) => topic.outline),
  }))
}

export function blueprintFromCatalog(
  catalog: ExamCatalog,
  meta: {
    provider: ExamProvider
    questionCount: number
    durationMin: number
    passMark: number
    questionMix: ExamBlueprint["questionMix"]
    styleGuide?: ExamBlueprint["styleGuide"]
  },
): ExamBlueprint {
  return {
    examCode: catalog.examCode,
    exam: catalog.exam,
    provider: meta.provider,
    questionCount: meta.questionCount,
    durationMin: meta.durationMin,
    passMark: meta.passMark,
    questionMix: meta.questionMix,
    styleGuide: meta.styleGuide,
    domains: domainsFromCatalog(catalog),
  }
}
