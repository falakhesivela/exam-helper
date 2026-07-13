import type { ExamBlueprint } from "@/lib/exams/types"
import type { ExamHubDoc } from "./exams"

export interface ExamFaq {
  q: string
  a: string
}

function listDomains(blueprint: ExamBlueprint): string {
  return blueprint.domains
    .map((d) => `${d.name} (${d.weightPercent}%)`)
    .join(", ")
}

function heaviestDomain(blueprint: ExamBlueprint) {
  return [...blueprint.domains].sort(
    (a, b) => b.weightPercent - a.weightPercent,
  )[0]
}

/**
 * FAQ entries for an exam hub page. The factual ones are derived from the
 * blueprint rather than written by hand so the page, the exam-facts table, and
 * the generated questions can never disagree. Frontmatter `faqs` are appended
 * for anything blueprint data cannot answer.
 */
export function buildExamFaqs(
  doc: ExamHubDoc,
  blueprint: ExamBlueprint | null,
): ExamFaq[] {
  if (!blueprint) return doc.faqs

  const { exam, examCode, questionCount, durationMin, passMark } = blueprint
  const top = heaviestDomain(blueprint)
  const minutesEach = Math.floor((durationMin / questionCount) * 10) / 10

  const derived: ExamFaq[] = [
    {
      q: `How many questions are on the ${examCode} exam?`,
      a: `The ${exam} has ${questionCount} questions and a ${durationMin}-minute time limit — about ${minutesEach} minutes per question. Prepa's mock exams mirror that exact count and clock so pacing on the day feels familiar.`,
    },
    {
      q: `What score do you need to pass ${examCode}?`,
      a: `You need roughly ${passMark}% to pass the ${exam}. Prepa scores every practice session on the same scale and tracks a readiness score, so you know whether you are clearing the bar before you book.`,
    },
    {
      q: `What topics does the ${examCode} exam cover?`,
      a: `The ${exam} is split across ${blueprint.domains.length} official domains: ${listDomains(blueprint)}. Prepa weights your practice to match, so you spend the most time where the exam does.`,
    },
    {
      q: `Which ${examCode} domain matters most?`,
      a: `${top.name} carries the largest weight at ${top.weightPercent}% of the exam, so it decides more of your score than any other domain. Prepa detects the domains you keep missing and rebalances your study plan toward them automatically.`,
    },
    {
      q: `Can I practise for the ${examCode} for free?`,
      a: `Yes. Prepa's free tier gives you 10 fresh AI-generated ${examCode} questions every day, with a full explanation on every answer. No card required to start.`,
    },
  ]

  return [...derived, ...doc.faqs]
}

/** FAQPage structured data for an exam hub. Returns null when there is nothing to mark up. */
export function examFaqJsonLd(faqs: ExamFaq[]): object | null {
  if (faqs.length === 0) return null
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: f.a },
    })),
  }
}
