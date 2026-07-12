import type { Readiness } from "@/lib/progress/readiness"

/** A starter chip. `focusDomain` marks the ones that can launch real practice. */
export interface MentorSuggestion {
  label: string
  /** The message sent to Mentor when tapped. */
  prompt: string
  /** Set when tapping should generate a practice session instead of chatting. */
  focusDomain?: string
}

export type MentorFollowUpAction =
  | { type: "practice"; label: string; domainName: string }
  | { type: "plan"; label: string }
  | { type: "prompt"; label: string; prompt: string }

export interface MentorSuggestionContext {
  daysToExam?: number | null
}

/** Mastery at or below this reads as "weak enough to call out by name". */
const WEAK_THRESHOLD = 70

const GENERIC: MentorSuggestion[] = [
  {
    label: "Where do I start?",
    prompt: "I'm just starting out. What should I study first, and in what order?",
  },
  {
    label: "How is the exam scored?",
    prompt: "How is this exam scored, and what do I need to pass?",
  },
  {
    label: "Build me a study plan",
    prompt: "Build me a realistic week-by-week study plan for this exam.",
  },
]

/**
 * Starter chips for an empty Mentor thread.
 *
 * The whole point is that Mentor already knows the learner's weak spots, so the
 * empty state should say so rather than showing a blank box. Pure — the caller
 * supplies readiness that's already computed for the dashboard.
 */
export function buildMentorSuggestions(
  readiness: Readiness | null,
  limit = 4,
  context: MentorSuggestionContext = {},
): MentorSuggestion[] {
  const weak = (readiness?.weakestDomains ?? []).filter(
    (d) => d.mastery <= WEAK_THRESHOLD,
  )

  const suggestions: MentorSuggestion[] = []

  for (const domain of weak) {
    suggestions.push({
      label: `Explain ${domain.name}`,
      prompt: `Explain ${domain.name} to me from scratch. I'm at ${Math.round(
        domain.mastery,
      )}% mastery and it's ${domain.weightPercent}% of the exam.`,
    })
    suggestions.push({
      label: `Quiz me on ${domain.name}`,
      prompt: `Quiz me on ${domain.name}.`,
      focusDomain: domain.name,
    })
  }

  if (readiness && suggestions.length < limit) {
    suggestions.push({
      label: "Am I ready?",
      prompt: `I'm at ${Math.round(readiness.score)}% readiness and the pass mark is ${
        readiness.passMark
      }%. Am I ready, and what should I fix first?`,
    })
  }

  if (
    readiness &&
    context.daysToExam != null &&
    context.daysToExam <= 14 &&
    suggestions.length < limit
  ) {
    suggestions.push({
      label: `Plan my final ${context.daysToExam} days`,
      prompt: `My exam is in ${context.daysToExam} days. Build a realistic final review plan using my readiness and weakest domains.`,
    })
  }

  for (const generic of GENERIC) {
    if (suggestions.length >= limit) break
    suggestions.push(generic)
  }

  return suggestions.slice(0, limit)
}

/**
 * Deterministic actions shown after a reply. They launch real product flows
 * instead of asking the model to encode links in Markdown.
 */
export function buildMentorFollowUpActions(
  readiness: Readiness | null,
  assistantContent: string,
  context: MentorSuggestionContext = {},
): MentorFollowUpAction[] {
  const normalized = assistantContent.toLocaleLowerCase()
  const relevant =
    readiness?.weakestDomains.find((domain) =>
      normalized.includes(domain.name.toLocaleLowerCase()),
    ) ?? readiness?.weakestDomains[0]

  const actions: MentorFollowUpAction[] = []
  if (relevant) {
    actions.push({
      type: "practice",
      label: `Practice ${relevant.name}`,
      domainName: relevant.name,
    })
  }

  if (readiness && (readiness.score < readiness.passMark || context.daysToExam != null)) {
    actions.push({ type: "plan", label: "Open study plan" })
  }

  actions.push({
    type: "prompt",
    label: "Explain more simply",
    prompt: "Can you explain that more simply with one realistic exam example?",
  })
  return actions.slice(0, 3)
}
