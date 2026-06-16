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
