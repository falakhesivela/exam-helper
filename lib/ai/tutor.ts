import OpenAI from "openai"

const TIMEOUT_MS = 30_000

type Provider = "xai" | "openai"

function getClient(provider: Provider) {
  if (provider === "xai") {
    const apiKey = process.env.XAI_API_KEY
    if (!apiKey) return null
    return new OpenAI({
      apiKey,
      baseURL: "https://api.x.ai/v1",
      timeout: TIMEOUT_MS,
    })
  }
  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) return null
  return new OpenAI({ apiKey, timeout: TIMEOUT_MS })
}

function getModel(provider: Provider) {
  return provider === "xai"
    ? (process.env.XAI_MODEL ?? "grok-3-fast")
    : (process.env.OPENAI_MODEL ?? "gpt-4o-mini")
}

export interface TutorContext {
  prompt: string
  scenario?: string
  options: { id: string; text: string }[]
  correctOptionIds: string[]
  userSelectedIds: string[]
  explanation: string
}

export interface TutorMessage {
  role: "user" | "assistant"
  content: string
}

/** Opening turn used when the learner first opens the tutor on a missed item. */
export const TUTOR_OPENING_PROMPT =
  "Explain why my answer was wrong and how I can recognize the right answer next time."

function buildSystemPrompt(context: TutorContext): string {
  const correctTexts = context.options
    .filter((o) => context.correctOptionIds.includes(o.id))
    .map((o) => o.text)
  const userTexts = context.options
    .filter((o) => context.userSelectedIds.includes(o.id))
    .map((o) => o.text)

  return [
    "You are Prepa, a concise, encouraging certification exam tutor.",
    "Answer the learner's questions about THIS specific exam question. Keep replies to 2-5 short sentences, specific and exam-focused, in plain language. Don't just restate the reference explanation verbatim.",
    "",
    "Question context:",
    context.scenario ? `Scenario: ${context.scenario}` : "",
    `Question: ${context.prompt}`,
    `Options: ${context.options.map((o) => `${o.id}) ${o.text}`).join(" | ")}`,
    `Correct answer(s): ${correctTexts.join("; ") || "(unknown)"}`,
    `The learner chose: ${userTexts.join("; ") || "(nothing)"}`,
    `Reference explanation: ${context.explanation}`,
  ]
    .filter(Boolean)
    .join("\n")
}

/**
 * Continue a tutoring conversation about a question. `history` is the prior
 * turns (assistant + user); an empty history starts with the opening prompt.
 */
export async function tutorReply(
  context: TutorContext,
  history: TutorMessage[],
): Promise<string> {
  const turns: TutorMessage[] =
    history.length > 0
      ? history
      : [{ role: "user", content: TUTOR_OPENING_PROMPT }]

  const messages = [
    { role: "system" as const, content: buildSystemPrompt(context) },
    ...turns.map((m) => ({ role: m.role, content: m.content })),
  ]

  let lastError: unknown
  for (const provider of ["xai", "openai"] as Provider[]) {
    const client = getClient(provider)
    if (!client) continue
    try {
      const completion = await client.chat.completions.create({
        model: getModel(provider),
        messages,
        max_tokens: 400,
      })
      const text = completion.choices[0]?.message?.content?.trim()
      if (text) return text
    } catch (err) {
      lastError = err
    }
  }

  throw lastError ?? new Error("AI tutor unavailable")
}
