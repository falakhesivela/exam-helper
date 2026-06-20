import type { DragAnswer, Question } from "@/types"
import { isQuestionAnswered } from "@/lib/session-utils"

export function isExamQuestionAnswered(
  question: Question,
  answers: Record<string, string[]>,
  dragAnswers: Record<string, DragAnswer>,
): boolean {
  return isQuestionAnswered(
    question,
    answers[question.id] ?? [],
    dragAnswers[question.id],
  )
}
