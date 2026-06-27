import OpenAI from "openai"
import { zodResponseFormat } from "openai/helpers/zod"
import type { z } from "zod"
import {
  clarifyResponseSchema,
  generatedDragBatchSchema,
  generatedQuestionsSchema,
  type GeneratedDragQuestion,
  type GeneratedMcqQuestion,
  type GeneratedQuestion,
} from "./schemas"
import {
  clarifySystemPrompt,
  clarifyUserPrompt,
  generateSystemPrompt,
  generateUserPrompt,
} from "./prompts"
import { filterValidDragQuestions, filterValidMcqQuestions } from "./validator"

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

function isGeneratedMcqComplete(
  q: Partial<GeneratedMcqQuestion>,
): q is GeneratedMcqQuestion {
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

function isGeneratedDragComplete(
  q: Partial<GeneratedDragQuestion>,
): q is GeneratedDragQuestion {
  if (!q.topic || !q.prompt || !q.difficulty || !q.explanation) return false
  if (q.questionType === "drag_match") {
    return Boolean(
      Array.isArray(q.items) &&
        q.items.length >= 3 &&
        Array.isArray(q.targets) &&
        q.targets.length >= 3 &&
        q.correctMatch &&
        Object.keys(q.correctMatch).length > 0,
    )
  }
  if (q.questionType === "drag_order") {
    return Boolean(
      Array.isArray(q.items) &&
        q.items.length >= 4 &&
        Array.isArray(q.correctOrder) &&
        q.correctOrder.length >= 4,
    )
  }
  if (q.questionType === "drag_categorize") {
    return Boolean(
      Array.isArray(q.categories) &&
        q.categories.length >= 2 &&
        Array.isArray(q.items) &&
        q.items.length >= 4 &&
        q.correctBuckets &&
        Object.keys(q.correctBuckets).length > 0,
    )
  }
  if (q.questionType === "select_grid") {
    return Boolean(
      Array.isArray(q.rows) &&
        q.rows.length >= 2 &&
        Array.isArray(q.columns) &&
        q.columns.length >= 2 &&
        q.correctByRow &&
        Object.keys(q.correctByRow).length > 0,
    )
  }
  return false
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
    /** Override the default practice system prompt (used for exam simulation). */
    systemPrompt?: string
    /** When set, user prompt is used as-is instead of generateUserPrompt(). */
    userPrompt?: string
    /** Adaptive difficulty guidance appended to the generated user prompt. */
    difficultyHint?: string
    /** Pin exam metadata instead of trusting model output. */
    fixedExam?: {
      exam: string
      examCode: string
      focusTopics: string[]
    }
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

    const system = params.systemPrompt ?? generateSystemPrompt()
    const user =
      params.userPrompt ??
      generateUserPrompt({
        description: params.description,
        clarifications: params.clarifications,
        count: params.count,
        groundingText: params.groundingText,
        difficultyHint: params.difficultyHint,
      })

    const result = await withStreamingFailover((provider) =>
      streamStructured<z.infer<typeof generatedQuestionsSchema>>(
        provider,
        system,
        user +
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
            if (isGeneratedMcqComplete(q)) {
              onEvent.onQuestion?.(i, { ...q, questionType: "mcq" })
              emittedQuestions = i + 1
            }
          }
        },
      ),
    )

    const valid = filterValidMcqQuestions(
      result.questions.map((q) => ({ ...q, questionType: "mcq" as const })),
    )
    lastValid = valid

    if (valid.length >= params.count) {
      const exam = params.fixedExam?.exam ?? result.exam
      const examCode = params.fixedExam?.examCode ?? result.examCode
      const focusTopics =
        params.fixedExam?.focusTopics ?? result.focusTopics
      return {
        exam,
        examCode,
        focusTopics,
        questions: valid.slice(0, params.count),
      }
    }
  }

  if (lastValid.length === 0) {
    throw new Error("Failed to generate valid questions after retries")
  }

  return {
    exam: params.fixedExam?.exam ?? "Certification Exam",
    examCode: params.fixedExam?.examCode ?? "CUSTOM",
    focusTopics: params.fixedExam?.focusTopics ?? ["Mixed topics"],
    questions: lastValid,
  }
}

export async function streamGenerateDragQuestions(
  params: {
    description: string
    count: number
    dragType: "drag_match" | "drag_order" | "drag_categorize" | "select_grid"
    systemPrompt: string
    userPrompt: string
  },
  onEvent: {
    onQuestionPreview?: (index: number, preview: { topic?: string; difficulty?: string }) => void
    onQuestion?: (index: number, question: GeneratedDragQuestion) => void
  },
): Promise<GeneratedDragQuestion[]> {
  let lastValid: GeneratedDragQuestion[] = []

  for (let attempt = 0; attempt <= MAX_REGEN_ATTEMPTS; attempt++) {
    let emittedPreviews = 0
    let emittedQuestions = 0

    const result = await withStreamingFailover((provider) =>
      streamStructured<z.infer<typeof generatedDragBatchSchema>>(
        provider,
        params.systemPrompt,
        params.userPrompt +
          (attempt > 0
            ? `\n\nPrevious output had quality issues. Regenerate all ${params.count} questions.`
            : ""),
        generatedDragBatchSchema,
        "generated_drag_questions",
        (partial) => {
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
            if (isGeneratedDragComplete(q)) {
              onEvent.onQuestion?.(i, q)
              emittedQuestions = i + 1
            }
          }
        },
      ),
    )

    lastValid = filterValidDragQuestions(result.questions)
    if (lastValid.length >= params.count) {
      return lastValid.slice(0, params.count)
    }
  }

  if (lastValid.length === 0) {
    throw new Error("Failed to generate valid drag questions after retries")
  }
  return lastValid
}
