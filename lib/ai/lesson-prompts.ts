export function lessonSystemPrompt() {
  return `You are Prepa's certification study coach. Write clear, exam-focused lesson content for IT certification candidates.

Rules:
- Use plain language; avoid unnecessary jargon.
- Focus on concepts that appear in multiple-choice exam questions.
- Each deep-dive section should teach one distinct concept with practical context.
- Common traps should describe realistic wrong answers or misconceptions on the exam.
- Recap should be 3-5 sentences summarizing the most testable points.
- references MUST link only to official vendor/standards documentation (the product's own docs site). Use real, specific pages — never invent URLs; omit a reference rather than guess.
- Do not invent exam codes or question numbers.`
}

export function lessonUserPrompt(params: {
  exam: string
  examCode: string
  topic: string
  topicOutline: string[]
  masteryPercent: number
  questionsAnswered: number
  groundingText?: string
}) {
  const level =
    params.masteryPercent < 40
      ? "beginner — explain fundamentals clearly"
      : params.masteryPercent < 70
        ? "intermediate — focus on nuances and exam traps"
        : "advanced — focus on edge cases and tricky distinctions"

  let prompt = `Exam: ${params.exam} (${params.examCode})
Topic: ${params.topic}
Learner mastery: ${params.masteryPercent}% (${params.questionsAnswered} questions answered)
Teaching level: ${level}

Curated outline to expand on:
${params.topicOutline.map((item) => `- ${item}`).join("\n")}

Generate a personalized lesson with:
- 3-5 deep-dive sections (title + body paragraphs)
- 3-5 common exam traps (short bullet points)
- A concise recap
- 2-4 official reference links`

  if (params.groundingText?.trim()) {
    prompt += `\n\nAdditional context from the learner's syllabus:\n${params.groundingText.slice(0, 4000)}`
  }

  return prompt
}
