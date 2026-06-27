import {
  mapWeakTopicsToDomains,
  parseMasteryTopicKey,
} from "@/lib/exams"
import type { ExamBlueprint } from "@/lib/exams/types"
import type { TopicMastery } from "@/types"

/** Prior the per-domain mastery is shrunk toward when sample size is low. */
const PRIOR_MASTERY = 50
/** Strength of the shrinkage prior, in "virtual questions". */
const PRIOR_WEIGHT = 8
/** Safety band around the pass mark for the verdict. */
const VERDICT_MARGIN = 5
/** A domain needs at least this many answered questions to count as "covered". */
const COVERAGE_MIN_QUESTIONS = 3
/** Virtual-question prior governing how fast the mock-exam blend ramps in. */
const BLEND_PRIOR = 15
/** Cap on how much a recent full mock exam can dominate the score. */
const BLEND_MAX_WEIGHT = 0.6

/** Recent full mock-exam performance for the target exam (server-computed). */
export interface RecentExamSignal {
  /** Accuracy across recent completed mock exams (0-100). */
  accuracy: number
  /** Number of graded questions behind that accuracy. */
  questions: number
}

export type ReadinessVerdict = "not-ready" | "almost" | "ready"
export type ReadinessConfidence = "low" | "medium" | "high"

export interface DomainReadiness {
  id: string
  name: string
  weightPercent: number
  /** Effective, shrinkage-adjusted mastery (0-100). */
  mastery: number
  questionsAnswered: number
}

export interface Readiness {
  examCode: string
  exam: string
  /** The real certification pass threshold (0-100). */
  passMark: number
  /** Blueprint-weighted readiness score (0-100). */
  score: number
  verdict: ReadinessVerdict
  confidence: ReadinessConfidence
  totalAnswered: number
  domainsCovered: number
  totalDomains: number
  /** Effective mastery for every blueprint domain (drives the study plan). */
  domains: DomainReadiness[]
  /** Up to three domains dragging the score down most. */
  weakestDomains: DomainReadiness[]
  /** Graded questions from recent mock exams folded into the score (0 if none). */
  mockExamQuestions: number
}

/** Pull a small sample toward the prior so a few lucky answers ≠ mastery. */
function shrink(mastery: number, n: number): number {
  return (mastery * n + PRIOR_MASTERY * PRIOR_WEIGHT) / (n + PRIOR_WEIGHT)
}

interface DomainSample {
  mastery: number
  n: number
}

/**
 * Compute an exam-readiness score for a single blueprint from a user's
 * topic-mastery rows. Pure and side-effect free.
 *
 * Domains with no data contribute the prior (50), so coverage gaps naturally
 * pull the score toward "not ready". Recent full mock-exam performance is a
 * stronger signal but lives server-side (correct answers are never sent to the
 * client); blending it in is a Phase 2 enhancement.
 */
export function computeExamReadiness(
  blueprint: ExamBlueprint,
  topics: TopicMastery[],
  recentExam?: RecentExamSignal,
): Readiness {
  // 1. Assign each mastery row to a blueprint domain.
  const byDomain = new Map<string, DomainSample>()
  const assign = (domainId: string, mastery: number, n: number) => {
    const cur = byDomain.get(domainId)
    if (!cur) {
      byDomain.set(domainId, { mastery, n })
      return
    }
    const totalN = cur.n + n
    const merged =
      totalN > 0 ? (cur.mastery * cur.n + mastery * n) / totalN : cur.mastery
    byDomain.set(domainId, { mastery: merged, n: totalN })
  }

  for (const t of topics) {
    const parsed = parseMasteryTopicKey(t.topic)
    if (parsed) {
      // Canonical key — only count rows belonging to this exam.
      const sameExam =
        parsed.examCode.toUpperCase() === blueprint.examCode.toUpperCase()
      const known = blueprint.domains.some((d) => d.id === parsed.domainId)
      if (sameExam && known) assign(parsed.domainId, t.mastery, t.questionsAnswered)
      continue
    }
    // Legacy/free-text topic — fuzzy-map to the closest blueprint domain.
    const [domain] = mapWeakTopicsToDomains(blueprint, [t.topic])
    if (domain) assign(domain.id, t.mastery, t.questionsAnswered)
  }

  // 2. Per-domain effective mastery.
  const domains: DomainReadiness[] = blueprint.domains.map((d) => {
    const hit = byDomain.get(d.id)
    const n = hit?.n ?? 0
    const eff = shrink(hit?.mastery ?? PRIOR_MASTERY, n)
    return {
      id: d.id,
      name: d.name,
      weightPercent: d.weightPercent,
      mastery: Math.round(eff),
      questionsAnswered: n,
    }
  })

  // 3. Blueprint-weighted base score.
  const totalWeight = domains.reduce((s, d) => s + d.weightPercent, 0) || 1
  const baseScore = domains.reduce(
    (s, d) => s + (d.weightPercent / totalWeight) * d.mastery,
    0,
  )

  // 4. Blend in recent full mock-exam accuracy — the most realistic signal.
  // Its weight ramps with sample size and is capped so it can't fully dominate.
  const mockExamQuestions = recentExam?.questions ?? 0
  let score = baseScore
  if (recentExam && mockExamQuestions > 0) {
    const w = Math.min(
      BLEND_MAX_WEIGHT,
      mockExamQuestions / (mockExamQuestions + BLEND_PRIOR),
    )
    score = baseScore * (1 - w) + recentExam.accuracy * w
  }
  score = Math.round(score)

  const totalAnswered = domains.reduce((s, d) => s + d.questionsAnswered, 0)
  const domainsCovered = domains.filter(
    (d) => d.questionsAnswered >= COVERAGE_MIN_QUESTIONS,
  ).length
  const coverage = domainsCovered / domains.length

  const verdict: ReadinessVerdict =
    score < blueprint.passMark - VERDICT_MARGIN
      ? "not-ready"
      : score <= blueprint.passMark + VERDICT_MARGIN
        ? "almost"
        : "ready"

  // A recent full mock exam is strong evidence, so it raises the confidence floor.
  const baseConfident =
    totalAnswered >= 60 && coverage >= 0.7
      ? "high"
      : totalAnswered >= 20 && coverage >= 0.4
        ? "medium"
        : "low"
  const confidence: ReadinessConfidence =
    mockExamQuestions >= 40
      ? "high"
      : mockExamQuestions >= 20 && baseConfident === "low"
        ? "medium"
        : baseConfident

  const weakestDomains = [...domains]
    .sort((a, b) => a.mastery * a.weightPercent - b.mastery * b.weightPercent)
    .slice(0, 3)

  return {
    examCode: blueprint.examCode,
    exam: blueprint.exam,
    passMark: blueprint.passMark,
    score,
    verdict,
    confidence,
    totalAnswered,
    domainsCovered,
    totalDomains: domains.length,
    domains,
    weakestDomains,
    mockExamQuestions,
  }
}
