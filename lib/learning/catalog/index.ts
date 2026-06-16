import type { ExamCatalog, ResolvedCatalogTopic } from "@/lib/learning/types"
import saaC03 from "./saa-c03.json"
import custom from "./custom.json"

const catalogs: Record<string, ExamCatalog> = {
  "SAA-C03": saaC03 as ExamCatalog,
  CUSTOM: custom as ExamCatalog,
}

export function getExamCatalog(examCode: string): ExamCatalog {
  return catalogs[examCode] ?? catalogs.CUSTOM
}

export function getAllCatalogTopics(examCode: string): ResolvedCatalogTopic[] {
  const catalog = getExamCatalog(examCode)
  return catalog.domains.flatMap((domain) =>
    domain.topics.map((topic) => ({
      ...topic,
      domainId: domain.id,
      domainName: domain.name,
      domainWeight: domain.weight,
    })),
  )
}

export function getCatalogTopicBySlug(
  examCode: string,
  slug: string,
): ResolvedCatalogTopic | null {
  return getAllCatalogTopics(examCode).find((t) => t.slug === slug) ?? null
}
