import { getExamBlueprint } from "./registry"
import type { ExamBlueprint, ExamBlueprintDomain } from "./types"

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 48)
}

function parseFocusTopicsInput(raw?: string): string[] {
  if (!raw?.trim()) return []
  return [
    ...new Set(
      raw
        .split(/[\n,;]+/)
        .map((s) => s.trim())
        .filter((s) => s.length >= 2),
    ),
  ]
}

const DEFAULT_CUSTOM_DOMAINS: Omit<
  ExamBlueprintDomain,
  "weightPercent"
>[] = [
  {
    id: "fundamentals",
    name: "Fundamentals",
    topics: ["Core concepts, terminology, and exam scope"],
  },
  {
    id: "implementation",
    name: "Implementation",
    topics: ["Configuration, deployment, and integration patterns"],
  },
  {
    id: "security",
    name: "Security",
    topics: ["Security controls, identity, and compliance"],
  },
  {
    id: "operations",
    name: "Operations",
    topics: ["Monitoring, troubleshooting, and operational best practices"],
  },
]

function domainsWithEqualWeights(
  rows: Omit<ExamBlueprintDomain, "weightPercent">[],
): ExamBlueprintDomain[] {
  const n = rows.length
  let remaining = 100
  return rows.map((row, i) => {
    const weight =
      i === n - 1 ? remaining : Math.max(1, Math.floor(100 / n))
    remaining -= weight
    return { ...row, weightPercent: weight }
  })
}

export interface CustomBlueprintParams {
  exam: string
  examCode: string
  focusTopics?: string[]
  focusTopicsText?: string
  questionCount: number
  durationMin: number
  description?: string
}

/**
 * Resolves a registered preset, or builds a synthetic blueprint for custom exams.
 */
export function resolveExamBlueprint(
  exam?: string,
  examCode?: string,
  options?: {
    focusTopics?: string[]
    focusTopicsText?: string
    questionCount?: number
    durationMin?: number
    description?: string
  },
): ExamBlueprint | null {
  const code = examCode?.trim()
  if (code && code.toUpperCase() !== "CUSTOM") {
    const preset = getExamBlueprint(code)
    if (preset) return preset
  }

  const name = exam?.trim()
  if (!name || name.length < 3) return null

  return buildCustomExamBlueprint({
    exam: name,
    examCode: code?.toUpperCase() || "CUSTOM",
    focusTopics: options?.focusTopics,
    focusTopicsText: options?.focusTopicsText,
    questionCount: options?.questionCount ?? 65,
    durationMin: options?.durationMin ?? 90,
    description: options?.description,
  })
}

export function buildCustomExamBlueprint(
  params: CustomBlueprintParams,
): ExamBlueprint {
  const topicNames =
    params.focusTopics?.length
      ? params.focusTopics
      : parseFocusTopicsInput(params.focusTopicsText)

  const domainRows: Omit<ExamBlueprintDomain, "weightPercent">[] =
    topicNames.length > 0
      ? topicNames.map((name, i) => ({
          id: slugify(name) || `domain-${i + 1}`,
          name,
          topics: [
            name,
            `Exam-style scenarios for ${name}`,
            ...(params.description
              ? [`Context: ${params.description.slice(0, 120)}`]
              : []),
          ],
        }))
      : DEFAULT_CUSTOM_DOMAINS.map((d) => ({
          ...d,
          topics: [
            ...d.topics,
            `Ground questions in ${params.exam} (${params.examCode})`,
          ],
        }))

  return {
    examCode: params.examCode,
    exam: params.exam,
    provider: "custom",
    questionCount: params.questionCount,
    durationMin: params.durationMin,
    passMark: 72,
    questionMix: { singleChoice: 0.85, multipleResponse: 0.15 },
    styleGuide: { scenarioHeavy: true },
    domains: domainsWithEqualWeights(domainRows),
  }
}

export { parseFocusTopicsInput }
