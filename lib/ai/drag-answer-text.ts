import type { DragAnswer, DragQuestionData, Question } from "@/types"

function itemText(
  items: { id: string; text: string }[] | undefined,
  id: string,
): string {
  return items?.find((i) => i.id === id)?.text ?? id
}

/** Human-readable summary of the correct answer for non-MCQ questions. */
export function describeCorrectDragAnswer(data: DragQuestionData): string {
  switch (data.type) {
    case "drag_match":
      return Object.entries(data.correctMatch)
        .map(([targetId, itemId]) => {
          const target = data.targets.find((t) => t.id === targetId)
          const item = data.items.find((i) => i.id === itemId)
          return `${target?.label ?? targetId} → ${item?.text ?? itemId}`
        })
        .join("; ")
    case "drag_order":
      return data.correctOrder
        .map((id, i) => `${i + 1}. ${itemText(data.items, id)}`)
        .join("; ")
    case "drag_categorize":
      return Object.entries(data.correctBuckets)
        .map(([catId, itemIds]) => {
          const cat = data.categories.find((c) => c.id === catId)
          const names = itemIds.map((id) => itemText(data.items, id)).join(", ")
          return `${cat?.label ?? catId}: ${names}`
        })
        .join("; ")
    case "select_grid":
      return data.rows
        .map((row) => {
          const colId = data.correctByRow[row.id]
          const col = data.columns.find((c) => c.id === colId)
          return `${row.statement} → ${col?.label ?? colId}`
        })
        .join("; ")
    case "command_input": {
      const accepted = data.acceptedAnswers.filter((a) => a.trim())
      if (accepted.length === 0) return ""
      const extra =
        accepted.length > 1 ? ` (also accepted: ${accepted.slice(1).join(", ")})` : ""
      return `Correct command: ${accepted[0]}${extra}`
    }
  }
}

/** Human-readable summary of the learner's drag/grid answer. */
export function describeUserDragAnswer(
  data: DragQuestionData,
  answer?: DragAnswer,
): string {
  if (!answer) return "(nothing)"

  switch (data.type) {
    case "drag_match":
      if (answer.type !== "drag_match") return "(invalid)"
      return Object.entries(answer.mapping)
        .map(([targetId, itemId]) => {
          const target = data.targets.find((t) => t.id === targetId)
          const item = data.items.find((i) => i.id === itemId)
          return `${target?.label ?? targetId} → ${item?.text ?? itemId}`
        })
        .join("; ") || "(nothing)"
    case "drag_order":
      if (answer.type !== "drag_order") return "(invalid)"
      return answer.order
        .map((id, i) => `${i + 1}. ${itemText(data.items, id)}`)
        .join("; ") || "(nothing)"
    case "drag_categorize":
      if (answer.type !== "drag_categorize") return "(invalid)"
      return Object.entries(answer.buckets)
        .map(([catId, itemIds]) => {
          const cat = data.categories.find((c) => c.id === catId)
          const names = itemIds.map((id) => itemText(data.items, id)).join(", ")
          return `${cat?.label ?? catId}: ${names}`
        })
        .join("; ") || "(nothing)"
    case "select_grid":
      if (answer.type !== "select_grid") return "(invalid)"
      return data.rows
        .map((row) => {
          const colId = answer.selections[row.id]
          const col = data.columns.find((c) => c.id === colId)
          return `${row.statement} → ${col?.label ?? colId ?? "?"}`
        })
        .join("; ")
    case "command_input": {
      if (answer.type !== "command_input") return "(invalid)"
      const value = answer.value.trim()
      return value ? `Typed: ${value}` : "(no command entered)"
    }
  }
}

/** Build flashcard back text from drag/grid correct answer + explanation. */
export function dragAnswerFlashcardBack(question: Question): string {
  if (!question.dragData) return question.explanation?.trim() ?? ""
  const answerLine = `✓ ${describeCorrectDragAnswer(question.dragData)}`
  return [answerLine, question.explanation?.trim()].filter(Boolean).join("\n\n")
}

/** Context fields for the AI tutor about drag/grid questions. */
export function dragTutorFields(question: Question, dragAnswer?: DragAnswer) {
  if (!question.dragData) return null
  return {
    questionType: question.dragData.type,
    correctSummary: describeCorrectDragAnswer(question.dragData),
    userSummary: describeUserDragAnswer(question.dragData, dragAnswer),
  }
}
