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
import { verifyMcqBatch } from "./accuracy-gate"
import { topicLessonContentSchema } from "./lesson-schemas"
import { lessonSystemPrompt, lessonUserPrompt } from "./lesson-prompts"
import { verifyReferences } from "./verify-references"
import { callStructured, streamStructured, type AiContext } from "./client"
import { getExamBlueprint } from "@/lib/exams"
import type { TopicLessonContent } from "@/types"

const MAX_REGEN_ATTEMPTS = 2

/** Upper bound on output tokens for a question batch (~800 tokens/question). */
export function questionBatchMaxTokens(count: number): number {
  return Math.min(16000, 800 * count + 600)
}

export async function clarify(description: string, ctx: AiContext = {}) {
  return callStructured(
    "clarify",
    ctx,
    clarifySystemPrompt(),
    clarifyUserPrompt(description),
    clarifyResponseSchema,
    "clarify_response",
  )
}

type GeneratedResult = z.infer<typeof generatedQuestionsSchema>

export async function generateQuestions(
  params: {
    description: string
    clarifications?: Record<string, string>
    count: number
    groundingText?: string
  },
  ctx: AiContext = {},
): Promise<{
  exam: string
  examCode: string
  focusTopics: string[]
  questions: GeneratedQuestion[]
}> {
  let exam = "Certification Exam"
  let examCode = "CUSTOM"
  let focusTopics = ["Mixed topics"]
  const collected: GeneratedQuestion[] = []

  for (let attempt = 0; attempt <= MAX_REGEN_ATTEMPTS; attempt++) {
    // Only ask for the shortfall — regenerating the whole batch wastes tokens.
    const needed = params.count - collected.length
    if (needed <= 0) break

    const result = await callStructured<GeneratedResult>(
      "generate",
      ctx,
      generateSystemPrompt(),
      generateUserPrompt({ ...params, count: needed }) +
        (attempt > 0
          ? `\n\nGenerate ${needed} more high-quality questions that differ from any prior ones.`
          : ""),
      generatedQuestionsSchema,
      "generated_questions",
      { maxTokens: questionBatchMaxTokens(needed) },
    )

    if (attempt === 0) {
      exam = result.exam
      examCode = result.examCode
      focusTopics = result.focusTopics
    }

    const structurallyValid = filterValidMcqQuestions(
      result.questions.map((q) => ({ ...q, questionType: "mcq" as const })),
    )
    // Blind re-answer gate — see lib/ai/accuracy-gate.ts. Rejected questions
    // count toward the shortfall the next loop iteration regenerates.
    const { passed } = await verifyMcqBatch(structurallyValid, ctx)
    collected.push(...passed)
  }

  if (collected.length === 0) {
    throw new Error("Failed to generate valid questions after retries")
  }

  return {
    exam,
    examCode,
    focusTopics,
    questions: collected.slice(0, params.count),
  }
}

/** Deep-partial lesson snapshot emitted while the lesson streams in. */
export interface StreamingLessonContent {
  deepDive?: { title?: string; body?: string }[]
  commonTraps?: string[]
  recap?: string
}

export async function generateTopicLesson(
  params: {
    exam: string
    examCode: string
    topic: string
    topicOutline: string[]
    masteryPercent: number
    questionsAnswered: number
    groundingText?: string
  },
  ctx: AiContext = {},
  onDelta?: (partial: StreamingLessonContent) => void,
): Promise<TopicLessonContent> {
  const result = await streamStructured<TopicLessonContent>(
    "lesson",
    ctx,
    lessonSystemPrompt(),
    lessonUserPrompt(params),
    topicLessonContentSchema,
    "topic_lesson",
    (partial) => {
      if (partial) onDelta?.(partial as StreamingLessonContent)
    },
  )

  return {
    deepDive: result.deepDive,
    commonTraps: result.commonTraps,
    recap: result.recap,
    references: await verifyReferences(
      result.references,
      getExamBlueprint(params.examCode)?.provider ?? "custom",
    ),
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

export async function coachPlan(
  params: PlanCoachParams,
  ctx: AiContext = {},
): Promise<PlanCoach> {
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

  return callStructured<PlanCoach>(
    "coach",
    ctx,
    system,
    user,
    planCoachSchema,
    "plan_coach",
  )
}
