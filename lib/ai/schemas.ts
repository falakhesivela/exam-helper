import { z } from "zod"

export const questionOptionSchema = z.object({
  id: z.string(),
  text: z.string(),
})

export const questionSchema = z.object({
  id: z.string(),
  topic: z.string(),
  difficulty: z.enum(["easy", "medium", "hard"]),
  multiSelect: z.boolean(),
  prompt: z.string(),
  options: z.array(questionOptionSchema).min(3),
  correctOptionIds: z.array(z.string()).min(1),
  explanation: z.string(),
  references: z.array(z.object({ label: z.string(), url: z.string() })),
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
      prompt: z.string(),
      options: z.array(questionOptionSchema).min(3),
      correctOptionIds: z.array(z.string()).min(1),
      explanation: z.string(),
      references: z.array(z.object({ label: z.string(), url: z.string() })),
    }),
  ),
})

export type GeneratedQuestion = z.infer<typeof generatedQuestionsSchema>["questions"][number]
