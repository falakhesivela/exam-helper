import OpenAI from "openai"
import { zodResponseFormat } from "openai/helpers/zod"
import {
  clarifyResponseSchema,
  generatedQuestionsSchema,
  planCoachSchema,
  type GeneratedQuestion,
  type PlanCoach,
} from "./schemas"
import type { z } from "zod"
import {
  clarifySystemPrompt,
  clarifyUserPrompt,
  generateSystemPrompt,
  generateUserPrompt,
} from "./prompts"
import { filterValidMcqQuestions } from "./validator"
import { topicLessonContentSchema } from "./lesson-schemas"
import { lessonSystemPrompt, lessonUserPrompt } from "./lesson-prompts"
import type { TopicLessonContent } from "@/types"

const TIMEOUT_MS = 60_000
const MAX_REGEN_ATTEMPTS = 2

type Provider = "xai" | "openai"

function getXaiClient() {
  const apiKey = process.env.XAI_API_KEY
  if (!apiKey) return null
  return new OpenAI({
    apiKey,
    baseURL: "https://api.x.ai/v1",
    timeout: TIMEOUT_MS,
  })
}

function getOpenAiClient() {
  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) return null
  return new OpenAI({ apiKey, timeout: TIMEOUT_MS })
}

function getModel(provider: Provider) {
  if (provider === "xai") {
    return process.env.XAI_MODEL ?? "grok-3-fast"
  }
  return process.env.OPENAI_MODEL ?? "gpt-4o-mini"
}

async function callStructured<T>(
  provider: Provider,
  system: string,
  user: string,
  schema: Parameters<typeof zodResponseFormat>[0],
  schemaName: string,
): Promise<T> {
  const client = provider === "xai" ? getXaiClient() : getOpenAiClient()
  if (!client) throw new Error(`Missing API key for ${provider}`)

  const completion = await client.chat.completions.parse({
    model: getModel(provider),
    messages: [
      { role: "system", content: system },
      { role: "user", content: user },
    ],
    response_format: zodResponseFormat(schema, schemaName),
  })

  const parsed = completion.choices[0]?.message?.parsed
  if (!parsed) throw new Error(`Empty ${schemaName} response from ${provider}`)
  return parsed as T
}

async function withFailover<T>(
  fn: (provider: Provider) => Promise<T>,
): Promise<T> {
  const providers: Provider[] = ["xai", "openai"]
  let lastError: unknown
  for (const provider of providers) {
    try {
      return await fn(provider)
    } catch (err) {
      lastError = err
      console.warn(`[ai] ${provider} failed:`, err)
    }
  }
  throw lastError ?? new Error("All AI providers failed")
}

export async function clarify(description: string) {
  return withFailover((provider) =>
    callStructured(
      provider,
      clarifySystemPrompt(),
      clarifyUserPrompt(description),
      clarifyResponseSchema,
      "clarify_response",
    ),
  )
}

type GeneratedResult = z.infer<typeof generatedQuestionsSchema>

export async function generateQuestions(params: {
  description: string
  clarifications?: Record<string, string>
  count: number
  groundingText?: string
}): Promise<{
  exam: string
  examCode: string
  focusTopics: string[]
  questions: GeneratedQuestion[]
}> {
  let lastValid: GeneratedQuestion[] = []

  for (let attempt = 0; attempt <= MAX_REGEN_ATTEMPTS; attempt++) {
    const result = await withFailover((provider) =>
      callStructured<GeneratedResult>(
        provider,
        generateSystemPrompt(),
        generateUserPrompt({
          ...params,
          count: params.count,
        }) + (attempt > 0 ? `\n\nPrevious output had quality issues. Regenerate all ${params.count} questions.` : ""),
        generatedQuestionsSchema,
        "generated_questions",
      ),
    )

    const valid = filterValidMcqQuestions(
      result.questions.map((q) => ({ ...q, questionType: "mcq" as const })),
    )
    lastValid = valid

    if (valid.length >= params.count) {
      return {
        exam: result.exam,
        examCode: result.examCode,
        focusTopics: result.focusTopics,
        questions: valid.slice(0, params.count),
      }
    }
  }

  if (lastValid.length === 0) {
    throw new Error("Failed to generate valid questions after retries")
  }

  return {
    exam: "Certification Exam",
    examCode: "CUSTOM",
    focusTopics: ["Mixed topics"],
    questions: lastValid,
  }
}

export async function generateTopicLesson(params: {
  exam: string
  examCode: string
  topic: string
  topicOutline: string[]
  masteryPercent: number
  questionsAnswered: number
  groundingText?: string
}): Promise<TopicLessonContent> {
  const result = await withFailover((provider) =>
    callStructured<TopicLessonContent>(
      provider,
      lessonSystemPrompt(),
      lessonUserPrompt(params),
      topicLessonContentSchema,
      "topic_lesson",
    ),
  )

  return {
    deepDive: result.deepDive,
    commonTraps: result.commonTraps,
    recap: result.recap,
    references: result.references,
  }
}

export interface PlanCoachParams {
  exam: string
  examCode: string
  currentScore: number
  targetScore: number
  daysRemaining: number
  paceStatus: "behind" | "on-track" | "ahead" | "complete"
  behindBy: number
  tasksRemaining: number
  weakDomains: { name: string; mastery: number }[]
}

export async function coachPlan(params: PlanCoachParams): Promise<PlanCoach> {
  const system =
    "You are Prepa, a sharp, encouraging certification study coach. Give concrete, exam-specific advice — never generic platitudes. Be concise and motivating. Reference the learner's actual numbers and weakest domains."
  const user = [
    `Exam: ${params.exam} (${params.examCode}).`,
    `Current readiness: ${params.currentScore}%. Target: ${params.targetScore}%.`,
    `Days until exam: ${params.daysRemaining}. Tasks left: ${params.tasksRemaining}.`,
    `Pace: ${params.paceStatus}${params.behindBy > 0 ? ` (behind by ${params.behindBy} tasks)` : ""}.`,
    `Weakest domains: ${
      params.weakDomains.map((d) => `${d.name} (${d.mastery}%)`).join(", ") ||
      "none recorded"
    }.`,
    "Write a one-line headline, a 2-3 sentence coaching message, and up to 3 domain-specific tips.",
  ].join("\n")

  return withFailover((provider) =>
    callStructured<PlanCoach>(
      provider,
      system,
      user,
      planCoachSchema,
      "plan_coach",
    ),
  )
}
