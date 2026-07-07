import { callChat, streamChat, type AiContext, type ChatMessage } from "./client"

export interface TutorContext {
  prompt: string
  scenario?: string
  options: { id: string; text: string }[]
  correctOptionIds: string[]
  userSelectedIds: string[]
  explanation: string
  questionType?: string
  dragCorrectSummary?: string
  dragUserSummary?: string
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
    context.questionType && context.questionType !== "mcq"
      ? `Question type: ${context.questionType}`
      : "",
    context.options.length > 0
      ? `Options: ${context.options.map((o) => `${o.id}) ${o.text}`).join(" | ")}`
      : "",
    context.dragCorrectSummary
      ? `Correct answer: ${context.dragCorrectSummary}`
      : `Correct answer(s): ${correctTexts.join("; ") || "(unknown)"}`,
    context.dragUserSummary
      ? `The learner answered: ${context.dragUserSummary}`
      : `The learner chose: ${userTexts.join("; ") || "(nothing)"}`,
    `Reference explanation: ${context.explanation}`,
  ]
    .filter(Boolean)
    .join("\n")
}

function buildMessages(
  context: TutorContext,
  history: TutorMessage[],
): ChatMessage[] {
  const turns: TutorMessage[] =
    history.length > 0
      ? history
      : [{ role: "user", content: TUTOR_OPENING_PROMPT }]

  return [
    { role: "system", content: buildSystemPrompt(context) },
    ...turns.map((m) => ({ role: m.role, content: m.content })),
  ]
}

/**
 * Continue a tutoring conversation about a question. `history` is the prior
 * turns (assistant + user); an empty history starts with the opening prompt.
 */
export async function tutorReply(
  context: TutorContext,
  history: TutorMessage[],
  ctx: AiContext = {},
): Promise<string> {
  return callChat("tutor", ctx, buildMessages(context, history))
}

/**
 * Streaming variant of `tutorReply`: emits text deltas as they arrive and
 * resolves with the full reply.
 */
export async function tutorReplyStream(
  context: TutorContext,
  history: TutorMessage[],
  onDelta: (text: string) => void,
  ctx: AiContext = {},
): Promise<string> {
  return streamChat("tutor", ctx, buildMessages(context, history), onDelta)
}
