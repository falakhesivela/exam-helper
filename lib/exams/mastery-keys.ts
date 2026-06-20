import { getExamBlueprint } from "./registry"
import type { ExamBlueprint, ExamBlueprintDomain } from "./types"

const MASTERY_KEY_SEP = "::"

export interface ParsedMasteryTopicKey {
  examCode: string
  domainId: string
}

/** Stable mastery key for blueprint-domain questions. */
export function buildMasteryTopicKey(
  examCode: string,
  topic: string,
  domainId?: string | null,
): string {
  const id = domainId?.trim()
  if (id) return `${examCode.toUpperCase()}${MASTERY_KEY_SEP}${id}`
  return topic
}

export function parseMasteryTopicKey(
  topicKey: string,
): ParsedMasteryTopicKey | null {
  const sep = topicKey.indexOf(MASTERY_KEY_SEP)
  if (sep <= 0) return null
  const examCode = topicKey.slice(0, sep)
  const domainId = topicKey.slice(sep + MASTERY_KEY_SEP.length)
  if (!examCode || !domainId) return null
  return { examCode, domainId }
}

export function resolveMasteryTopicLabel(
  topicKey: string,
  fallbackExamCode?: string,
): string {
  const parsed = parseMasteryTopicKey(topicKey)
  if (parsed) {
    const blueprint = getExamBlueprint(parsed.examCode)
    const domain = blueprint?.domains.find((d) => d.id === parsed.domainId)
    if (domain) return domain.name
  }
  return topicKey
}

export function enrichTopicMastery(row: {
  topic: string
  mastery: number
  questions_answered: number
}): {
  topic: string
  displayTopic: string
  domainId?: string
  examCode?: string
  mastery: number
  questionsAnswered: number
} {
  const parsed = parseMasteryTopicKey(row.topic)
  const displayTopic = resolveMasteryTopicLabel(row.topic)
  return {
    topic: row.topic,
    displayTopic,
    domainId: parsed?.domainId,
    examCode: parsed?.examCode,
    mastery: Number(row.mastery),
    questionsAnswered: row.questions_answered,
  }
}

/**
 * Map weak mastery rows to blueprint domains.
 * Uses canonical domain keys first, then fuzzy name matching for legacy rows.
 */
export function mapWeakTopicsToDomains(
  blueprint: ExamBlueprint,
  weakTopicKeys: string[],
): ExamBlueprintDomain[] {
  const matched = new Map<string, ExamBlueprintDomain>()
  const legacyTopics: string[] = []

  for (const topicKey of weakTopicKeys) {
    const parsed = parseMasteryTopicKey(topicKey)
    if (
      parsed &&
      parsed.examCode.toUpperCase() === blueprint.examCode.toUpperCase()
    ) {
      const domain = blueprint.domains.find((d) => d.id === parsed.domainId)
      if (domain) {
        matched.set(domain.id, domain)
        continue
      }
    }
    legacyTopics.push(resolveMasteryTopicLabel(topicKey))
  }

  if (legacyTopics.length > 0) {
    for (const domain of mapWeakTopicsByName(blueprint, legacyTopics)) {
      matched.set(domain.id, domain)
    }
  }

  return [...matched.values()]
}

function normalize(text: string): string {
  return text
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
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

function mapWeakTopicsByName(
  blueprint: ExamBlueprint,
  weakTopics: string[],
): ExamBlueprintDomain[] {
  const matched = new Map<string, ExamBlueprintDomain>()

  for (const topic of weakTopics) {
    let best: ExamBlueprintDomain | null = null
    let bestScore = 0

    for (const domain of blueprint.domains) {
      const scores = [
        similarity(topic, domain.name),
        ...domain.topics.map((t) => similarity(topic, t)),
      ]
      const score = Math.max(...scores)
      if (score > bestScore) {
        bestScore = score
        best = domain
      }
    }

    if (best && bestScore >= 0.35) {
      matched.set(best.id, best)
    }
  }

  return [...matched.values()]
}
