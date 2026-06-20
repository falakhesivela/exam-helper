import { z } from "zod"

export const questionOptionSchema = z.object({
  id: z.string(),
  text: z.string(),
})

const referencesSchema = z.array(z.object({ label: z.string(), url: z.string() }))

const baseQuestionFields = {
  topic: z.string(),
  difficulty: z.enum(["easy", "medium", "hard"]),
  scenario: z.string().nullable(),
  prompt: z.string(),
  explanation: z.string(),
  references: referencesSchema,
}

export const generatedMcqSchema = z.object({
  questionType: z.literal("mcq").optional().default("mcq"),
  ...baseQuestionFields,
  multiSelect: z.boolean(),
  options: z.array(questionOptionSchema).min(3),
  correctOptionIds: z.array(z.string()).min(1),
})

const dragItemSchema = z.object({ id: z.string(), text: z.string() })
const dropTargetSchema = z.object({ id: z.string(), label: z.string() })

export const generatedDragMatchSchema = z.object({
  questionType: z.literal("drag_match"),
  ...baseQuestionFields,
  items: z.array(dragItemSchema).min(3).max(6),
  targets: z.array(dropTargetSchema).min(3).max(6),
  correctMatch: z.record(z.string(), z.string()),
})

export const generatedDragOrderSchema = z.object({
  questionType: z.literal("drag_order"),
  ...baseQuestionFields,
  items: z.array(dragItemSchema).min(4).max(7),
  correctOrder: z.array(z.string()).min(4),
})

export const generatedDragCategorizeSchema = z.object({
  questionType: z.literal("drag_categorize"),
  ...baseQuestionFields,
  categories: z.array(z.object({ id: z.string(), label: z.string() })).min(2).max(4),
  items: z.array(dragItemSchema).min(4).max(8),
  correctBuckets: z.record(z.string(), z.array(z.string())),
})

export const generatedDragQuestionSchema = z.discriminatedUnion("questionType", [
  generatedDragMatchSchema,
  generatedDragOrderSchema,
  generatedDragCategorizeSchema,
])

export const questionSchema = z.object({
  id: z.string(),
  topic: z.string(),
  difficulty: z.enum(["easy", "medium", "hard"]),
  multiSelect: z.boolean(),
  prompt: z.string(),
  options: z.array(questionOptionSchema).min(3),
  correctOptionIds: z.array(z.string()).min(1),
  explanation: z.string(),
  references: referencesSchema,
})

export const clarifyingQuestionSchema = z.object({
  id: z.string(),
  question: z.string(),
  suggestions: z.array(z.string()).min(1),
})

export const clarifyResponseSchema = z.object({
  needsClarification: z.boolean(),
  questions: z.array(clarifyingQuestionSchema),
})

export const generatedQuestionsSchema = z.object({
  exam: z.string(),
  examCode: z.string(),
  focusTopics: z.array(z.string()),
  questions: z.array(
    z.object({
      topic: z.string(),
      difficulty: z.enum(["easy", "medium", "hard"]),
      multiSelect: z.boolean(),
      scenario: z.string().nullable(),
      prompt: z.string(),
      options: z.array(questionOptionSchema).min(3),
      correctOptionIds: z.array(z.string()).min(1),
      explanation: z.string(),
      references: referencesSchema,
    }),
  ),
})

export const generatedDragBatchSchema = z.object({
  questions: z.array(generatedDragQuestionSchema),
})

export type GeneratedMcqQuestion = z.infer<typeof generatedMcqSchema>
export type GeneratedDragQuestion = z.infer<typeof generatedDragQuestionSchema>
export type GeneratedQuestion = (GeneratedMcqQuestion | GeneratedDragQuestion) & {
  domainId?: string
}

export function isGeneratedMcq(
  q: GeneratedQuestion,
): q is GeneratedMcqQuestion {
  return !q.questionType || q.questionType === "mcq"
}

export function isGeneratedDrag(
  q: GeneratedQuestion,
): q is GeneratedDragQuestion {
  return q.questionType !== "mcq"
}
