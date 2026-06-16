import { getAllCatalogTopics, getExamCatalog } from "@/lib/learning/catalog"
import type { ResolvedCatalogTopic } from "@/lib/learning/types"

function normalize(text: string): string {
  return text
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
}

function slugify(text: string): string {
  return normalize(text).replace(/\s+/g, "-")
}

function similarity(a: string, b: string): number {
  const tokensA = new Set(normalize(a).split(/\s+/).filter(Boolean))
  const tokensB = new Set(normalize(b).split(/\s+/).filter(Boolean))
  if (tokensA.size === 0 || tokensB.size === 0) return 0

  let overlap = 0
  for (const token of tokensA) {
    if (tokensB.has(token)) overlap += 1
  }

  return overlap / Math.max(tokensA.size, tokensB.size)
}

export interface TopicResolution {
  slug: string
  name: string
  examCode: string
  catalogTopic: ResolvedCatalogTopic | null
}

export function resolveTopicName(
  topicName: string,
  examCode: string,
): TopicResolution {
  const catalog = getExamCatalog(examCode)
  const topics = getAllCatalogTopics(examCode)

  const exact = topics.find(
    (t) => normalize(t.name) === normalize(topicName) || t.slug === slugify(topicName),
  )
  if (exact) {
    return {
      slug: exact.slug,
      name: exact.name,
      examCode: catalog.examCode,
      catalogTopic: exact,
    }
  }

  let best: ResolvedCatalogTopic | null = null
  let bestScore = 0

  for (const topic of topics) {
    const score = Math.max(
      similarity(topicName, topic.name),
      similarity(topicName, topic.slug.replace(/-/g, " ")),
    )
    if (score > bestScore) {
      bestScore = score
      best = topic
    }
  }

  if (best && bestScore >= 0.5) {
    return {
      slug: best.slug,
      name: best.name,
      examCode: catalog.examCode,
      catalogTopic: best,
    }
  }

  const fallbackSlug = slugify(topicName) || "general-topic"
  const fallbackCatalog = getAllCatalogTopics("CUSTOM")
  const generic = fallbackCatalog[0]

  return {
    slug: fallbackSlug,
    name: topicName,
    examCode: examCode === "CUSTOM" ? "CUSTOM" : examCode,
    catalogTopic: best ?? {
      ...generic,
      slug: fallbackSlug,
      name: topicName,
      outline: generic.outline,
      references: generic.references,
    },
  }
}

export function inferExamFromSessions(
  sessions: { examCode: string; exam: string; createdAt: string }[],
): { examCode: string; exam: string } {
  if (sessions.length === 0) {
    return { examCode: "CUSTOM", exam: "Custom Certification Exam" }
  }

  const sorted = [...sessions].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  )
  return { examCode: sorted[0].examCode, exam: sorted[0].exam }
}
