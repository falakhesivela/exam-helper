import { getCatalogTopicBySlug } from "@/lib/learning/catalog"

export interface TopicDrillParams {
  description: string
  exam?: string
  examCode: string
  focusDomainIds?: string[]
  focusTopics: string[]
  count: number
  difficulty: "easier" | "balanced" | "harder"
}

/**
 * Build the generation params for a drill on one topic.
 *
 * Two scoping levers, and both are needed. `focusDomainIds` picks the blueprint
 * domain, which is what keeps the exam-realistic prompt, question mix and
 * grounding text; `focusTopics` narrows the questions to this one topic inside
 * it. Sending only the domain would silently deliver a drill on all 5-15 of its
 * topics, which is not what a button labelled "drill this topic" promises.
 */
export function buildTopicDrillParams({
  topicSlug,
  topicName,
  exam,
  examCode,
  count,
  difficulty,
}: {
  topicSlug: string
  topicName: string
  exam?: string
  examCode: string
  count: number
  difficulty: "easier" | "balanced" | "harder"
}): TopicDrillParams {
  const catalogTopic = getCatalogTopicBySlug(examCode, topicSlug)

  return {
    // The API requires a description of at least 15 characters, and the
    // non-blueprint generator has nothing but this to go on, so synthesize one
    // rather than making the user write it.
    description: `Focused drill on "${topicName}"${
      exam ? ` from ${exam} (${examCode})` : ""
    }. Generate exam-style questions that test only this topic.`,
    exam,
    examCode,
    focusDomainIds: catalogTopic ? [catalogTopic.domainId] : undefined,
    focusTopics: [topicName],
    count,
    difficulty,
  }
}
