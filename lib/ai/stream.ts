import OpenAI from "openai"
import { zodResponseFormat } from "openai/helpers/zod"
import type { z } from "zod"
import {
  clarifyResponseSchema,
  generatedQuestionsSchema,
  type GeneratedQuestion,
} from "./schemas"
import {
  clarifySystemPrompt,
  clarifyUserPrompt,
  generateSystemPrompt,
  generateUserPrompt,
} from "./prompts"
import { filterValidQuestions } from "./validator"

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

function getClient(provider: Provider) {
  return provider === "xai" ? getXaiClient() : getOpenAiClient()
}

function getModel(provider: Provider) {
  if (provider === "xai") {
    return process.env.XAI_MODEL ?? "grok-3-fast"
  }
  return process.env.OPENAI_MODEL ?? "gpt-4o-mini"
}

type ClarifyPartial = Partial<z.infer<typeof clarifyResponseSchema>>
type GeneratePartial = Partial<z.infer<typeof generatedQuestionsSchema>>

async function streamStructured<T>(
  provider: Provider,
  system: string,
  user: string,
  schema: Parameters<typeof zodResponseFormat>[0],
  schemaName: string,
  onDelta: (parsed: Partial<T> | null) => void,
): Promise<T> {
  const client = getClient(provider)
  if (!client) throw new Error(`Missing API key for ${provider}`)

  const completionStream = client.chat.completions.stream({
    model: getModel(provider),
    messages: [
      { role: "system", content: system },
      { role: "user", content: user },
    ],
    response_format: zodResponseFormat(schema, schemaName),
    stream: true,
  })

  completionStream.on("content.delta", (event) => {
    onDelta(event.parsed as Partial<T> | null)
  })

  const completion = await completionStream.finalChatCompletion()
  const parsed = completion.choices[0]?.message?.parsed
  if (!parsed) throw new Error(`Empty ${schemaName} response from ${provider}`)
  return parsed as T
}

async function withStreamingFailover<T>(
  fn: (provider: Provider) => Promise<T>,
): Promise<T> {
  const providers: Provider[] = ["xai", "openai"]
  let lastError: unknown
  for (const provider of providers) {
    try {
      return await fn(provider)
    } catch (err) {
      lastError = err
      console.warn(`[ai:stream] ${provider} failed:`, err)
    }
  }
  throw lastError ?? new Error("All AI providers failed")
}

function isClarifyQuestionComplete(
  q: Partial<z.infer<typeof clarifyResponseSchema>["questions"][number]>,
): q is z.infer<typeof clarifyResponseSchema>["questions"][number] {
  return Boolean(
    q.id &&
      q.question &&
      Array.isArray(q.suggestions) &&
      q.suggestions.length > 0 &&
      q.suggestions.every((s) => typeof s === "string" && s.length > 0),
  )
}

function isGeneratedQuestionComplete(
  q: Partial<GeneratedQuestion>,
): q is GeneratedQuestion {
  return Boolean(
    q.topic &&
      q.prompt &&
      q.difficulty &&
      typeof q.multiSelect === "boolean" &&
      Array.isArray(q.options) &&
      q.options.length >= 3 &&
      Array.isArray(q.correctOptionIds) &&
      q.correctOptionIds.length > 0 &&
      q.explanation,
  )
}

export async function streamClarify(
  description: string,
  onEvent: {
    onQuestion?: (index: number, question: z.infer<typeof clarifyResponseSchema>["questions"][number]) => void
    onDelta?: (partial: ClarifyPartial) => void
  },
) {
  let emittedQuestions = 0

  const result = await withStreamingFailover((provider) =>
    streamStructured<z.infer<typeof clarifyResponseSchema>>(
      provider,
      clarifySystemPrompt(),
      clarifyUserPrompt(description),
      clarifyResponseSchema,
      "clarify_response",
      (partial) => {
        onEvent.onDelta?.(partial ?? {})
        const questions = partial?.questions ?? []
        for (let i = emittedQuestions; i < questions.length; i++) {
          const q = questions[i]
          if (isClarifyQuestionComplete(q)) {
            onEvent.onQuestion?.(i, q)
            emittedQuestions = i + 1
          }
        }
      },
    ),
  )

  return result
}

export async function streamGenerateQuestions(
  params: {
    description: string
    clarifications?: Record<string, string>
    count: number
    groundingText?: string
  },
  onEvent: {
    onMetadata?: (meta: { exam?: string; examCode?: string; focusTopics?: string[] }) => void
    onQuestionPreview?: (index: number, preview: { topic?: string; difficulty?: string }) => void
    onQuestion?: (index: number, question: GeneratedQuestion) => void
    onDelta?: (partial: GeneratePartial) => void
  },
): Promise<{
  exam: string
  examCode: string
  focusTopics: string[]
  questions: GeneratedQuestion[]
}> {
  let lastValid: GeneratedQuestion[] = []

  for (let attempt = 0; attempt <= MAX_REGEN_ATTEMPTS; attempt++) {
    let emittedPreviews = 0
    let emittedQuestions = 0
    let lastMetadataKey = ""

    const result = await withStreamingFailover((provider) =>
      streamStructured<z.infer<typeof generatedQuestionsSchema>>(
        provider,
        generateSystemPrompt(),
        generateUserPrompt(params) +
          (attempt > 0
            ? `\n\nPrevious output had quality issues. Regenerate all ${params.count} questions.`
            : ""),
        generatedQuestionsSchema,
        "generated_questions",
        (partial) => {
          onEvent.onDelta?.(partial ?? {})

          const metaKey = `${partial?.exam ?? ""}|${partial?.examCode ?? ""}|${(partial?.focusTopics ?? []).join(",")}`
          if (metaKey !== lastMetadataKey && (partial?.exam || partial?.examCode)) {
            lastMetadataKey = metaKey
            onEvent.onMetadata?.({
              exam: partial?.exam,
              examCode: partial?.examCode,
              focusTopics: partial?.focusTopics,
            })
          }

          const questions = partial?.questions ?? []
          for (let i = emittedPreviews; i < questions.length; i++) {
            const q = questions[i]
            if (q?.topic || q?.prompt) {
              onEvent.onQuestionPreview?.(i, {
                topic: q.topic,
                difficulty: q.difficulty,
              })
              emittedPreviews = i + 1
            }
          }

          for (let i = emittedQuestions; i < questions.length; i++) {
            const q = questions[i]
            if (isGeneratedQuestionComplete(q)) {
              onEvent.onQuestion?.(i, q)
              emittedQuestions = i + 1
            }
          }
        },
      ),
    )

    const valid = filterValidQuestions(result.questions)
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
