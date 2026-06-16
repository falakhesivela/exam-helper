import { z } from "zod"

export const topicLessonContentSchema = z.object({
  deepDive: z
    .array(
      z.object({
        title: z.string(),
        body: z.string(),
      }),
    )
    .min(2)
    .max(6),
  commonTraps: z.array(z.string()).min(2).max(6),
  recap: z.string(),
  references: z.array(z.object({ label: z.string(), url: z.string() })),
})

export type TopicLessonContentResult = z.infer<typeof topicLessonContentSchema>
