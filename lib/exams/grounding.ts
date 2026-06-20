import type { ExamBlueprint, ExamBlueprintDomain } from "./types"

export function domainGroundingText(domain: ExamBlueprintDomain): string {
  return [
    `Domain: ${domain.name} (${domain.weightPercent}% of exam)`,
    "",
    "Topics:",
    ...domain.topics.map((t) => `- ${t}`),
  ].join("\n")
}

export function blueprintSummary(blueprint: ExamBlueprint): string {
  return [
    `${blueprint.exam} (${blueprint.examCode})`,
    `${blueprint.questionCount} questions · ${blueprint.durationMin} min · pass ${blueprint.passMark}%`,
    "",
    "Domains:",
    ...blueprint.domains.map((d) => `- ${d.name} (${d.weightPercent}%)`),
  ].join("\n")
}
