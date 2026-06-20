import type { ExamBlueprint, ExamBlueprintDomain } from "@/lib/exams/types"

export function clarifySystemPrompt() {
  return `You are CertForge, an AI exam-prep assistant. Given a user's exam description, decide if you need clarifying questions before generating practice questions.

Return JSON matching the schema. If the description is clear enough (exam name/code and at least some topic context), set needsClarification to false and questions to [].

When clarification is needed, ask 2-3 focused questions with 3-4 suggestion chips each. Questions should help tailor difficulty, timeline, and weak areas.`
}

export function clarifyUserPrompt(description: string) {
  return `Exam description:\n${description}`
}

export function generateSystemPrompt() {
  return `You are CertForge, an expert certification exam question writer. Generate realistic, exam-style multiple-choice questions.

Rules:
- Questions must be original, technically accurate, and scenario-based when appropriate.
- For scenario-based questions, use scenario (context paragraph) + prompt (the question line).
- When no separate scenario paragraph is needed, set scenario to null.
- Each question has 4 options (ids will be reassigned to a,b,c,d).
- Include a mix of difficulties unless told otherwise.
- multiSelect is true only when the stem asks for TWO or more correct answers.
- correctOptionIds must reference option ids you provide.
- explanations teach the concept; references should point to official docs when possible.
- Never put the correct answer verbatim in the stem.`
}

export function generateUserPrompt(params: {
  description: string
  clarifications?: Record<string, string>
  count: number
  groundingText?: string
}) {
  const parts = [
    `Generate exactly ${params.count} certification exam questions.`,
    `\nUser description:\n${params.description}`,
  ]
  if (params.clarifications && Object.keys(params.clarifications).length > 0) {
    parts.push(
      `\nClarifications:\n${Object.entries(params.clarifications)
        .map(([k, v]) => `- ${k}: ${v}`)
        .join("\n")}`,
    )
  }
  if (params.groundingText?.trim()) {
    parts.push(
      `\nSyllabus excerpt (use for topic grounding):\n${params.groundingText.slice(0, 12000)}`,
    )
  }
  return parts.join("\n")
}

// ---------------------------------------------------------------------------
// Timed mock exam prompts (blueprint-driven)
// ---------------------------------------------------------------------------

export function examSimulationSystemPrompt(blueprint: ExamBlueprint): string {
  const lines = [
    "You are CertForge, an expert certification exam question writer.",
    `Write realistic questions for ${blueprint.exam} (${blueprint.examCode}).`,
    "",
    "Rules:",
    "- Questions must be original, technically accurate, and exam-appropriate.",
    "- Use 4 options for single-select; use 5-6 options when multiSelect is true.",
    "- multiSelect is true only when the stem explicitly asks for TWO or more answers.",
    "- For multi-select stems, include phrasing like 'Select TWO answers' or 'Choose THREE responses'.",
    "- correctOptionIds must reference option ids you provide.",
    "- Set topic to the exam domain name provided in the user prompt.",
    "- explanations teach the concept; references should point to official docs when possible.",
    "- Never put the correct answer verbatim in the stem.",
    "- When no separate scenario paragraph is needed, set scenario to null.",
  ]

  if (blueprint.styleGuide?.scenarioHeavy) {
    const distractorHint =
      blueprint.provider === "aws" || blueprint.provider === "azure"
        ? "Distractors should be plausible cloud/architecture alternatives, not obviously wrong."
        : blueprint.provider === "cisco"
          ? "Distractors should be plausible networking alternatives (protocols, configs, devices)."
          : blueprint.provider === "comptia"
            ? "Distractors should be plausible IT support or networking alternatives."
            : "Distractors should be plausible technical alternatives, not obviously wrong."
    lines.push(
      "- Prefer scenario-based stems: use scenario (2-4 sentences) for context, then prompt for the question line.",
      "- When scenario is set, prompt must be the final question only — do not repeat scenario text in prompt.",
      `- ${distractorHint}`,
    )
  }

  if (blueprint.provider === "cisco") {
    lines.push(
      "- Use Cisco terminology where appropriate (IOS, VLAN, OSPF, ACL).",
      "- Configuration questions may describe show command output in text.",
    )
  }

  if (blueprint.provider === "comptia") {
    lines.push(
      "- Focus on practical technician scenarios: troubleshooting, hardware, and protocols.",
      "- Performance-based style can be approximated with drag items when not MCQ.",
    )
  }

  if (blueprint.provider === "isc2") {
    lines.push(
      "- Questions should test judgment: choose the BEST or MOST appropriate action.",
      "- Emphasize governance, risk, and security program management over trivia.",
    )
  }

  if (blueprint.styleGuide?.servicesShortNames) {
    lines.push(
      "- You may use common AWS service abbreviations (e.g. S3, EC2, IAM) as on the real exam.",
    )
  }

  if (blueprint.styleGuide?.managerialTone) {
    lines.push(
      "- Frame questions around the BEST or MOST appropriate action for a manager/architect.",
    )
  }

  const multiPct = Math.round(blueprint.questionMix.multipleResponse * 100)
  lines.push(
    `- Roughly ${100 - multiPct}% single-select and ${multiPct}% multi-select across the batch.`,
  )

  return lines.join("\n")
}

export function examDomainBatchPrompt(
  blueprint: ExamBlueprint,
  domain: ExamBlueprintDomain,
  count: number,
): string {
  const multiCount = Math.round(count * blueprint.questionMix.multipleResponse)
  const singleCount = count - multiCount

  return [
    `Generate exactly ${count} questions for domain "${domain.name}" of ${blueprint.exam} (${blueprint.examCode}).`,
    `Include approximately ${singleCount} single-select and ${multiCount} multi-select questions.`,
    `Set each question's topic field to "${domain.name}".`,
    "",
    "Return exam and examCode matching the certification above.",
    `Set focusTopics to ["${domain.name}"].`,
  ].join("\n")
}

export function examDragSystemPrompt(blueprint: ExamBlueprint): string {
  return [
    "You are CertForge, an expert certification exam question writer.",
    `Write realistic drag-and-drop questions for ${blueprint.exam} (${blueprint.examCode}).`,
    "",
    "Supported questionType values:",
    "- drag_match: match each item to exactly one target (e.g. port to protocol, term to definition).",
    "- drag_order: put steps or phases in the correct sequence.",
    "- drag_categorize: sort items into 2-4 category buckets.",
    "",
    "Rules:",
    "- Questions must be original and technically accurate.",
    "- Use short, clear item and target labels suitable for mobile tap-to-assign UI.",
    "- Provide unique ids for items, targets, and categories.",
    "- correctMatch maps each target id to exactly one item id.",
    "- correctOrder lists item ids in the correct sequence.",
    "- correctBuckets maps each category id to the item ids that belong there.",
    "- explanations teach the concept; references point to official docs when possible.",
  ].join("\n")
}

export function examDragBatchPrompt(
  blueprint: ExamBlueprint,
  domain: ExamBlueprintDomain,
  count: number,
  dragType: "drag_match" | "drag_order" | "drag_categorize",
): string {
  const typeLabel =
    dragType === "drag_match"
      ? "match items to targets"
      : dragType === "drag_order"
        ? "order steps correctly"
        : "categorize items into buckets"

  return [
    `Generate exactly ${count} ${dragType} questions that ${typeLabel}.`,
    `Domain: "${domain.name}" for ${blueprint.exam} (${blueprint.examCode}).`,
    `Set questionType to "${dragType}" on every question.`,
    `Set each question's topic field to "${domain.name}".`,
  ].join("\n")
}
