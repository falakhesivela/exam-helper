"use client"

import type { DragAnswer, Question } from "@/types"
import { expectedSelectionCount, questionTypeOf } from "@/lib/session-utils"
import { DragCategorizePane } from "./drag-categorize-pane"
import { DragMatchPane } from "./drag-match-pane"
import { DragOrderPane } from "./drag-order-pane"
import { SelectGridPane } from "./select-grid-pane"
import { ExamOptionRow } from "./exam-option-row"
import { QuestionStem } from "./question-stem"

interface ExamQuestionPaneProps {
  question: Question
  selected: string[]
  dragAnswer?: DragAnswer
  isFlagged: boolean
  onToggleOption: (optionId: string) => void
  onDragAnswerChange: (answer: DragAnswer) => void
  /** Practice-mode reveal: locks interaction and shows answer feedback. */
  revealed?: boolean
}

function multiSelectHint(question: Question): string | null {
  if (!question.multiSelect) return null
  const count = expectedSelectionCount(question)
  if (count === 3) return "Select THREE answers"
  if (count === 2) return "Select TWO answers"
  return "Select all that apply"
}

export function ExamQuestionPane({
  question,
  selected,
  dragAnswer,
  isFlagged,
  onToggleOption,
  onDragAnswerChange,
  revealed = false,
}: ExamQuestionPaneProps) {
  const hint = multiSelectHint(question)
  const type = questionTypeOf(question)

  return (
    <div className="flex flex-col gap-5">
      {hint && (
        <p className="text-sm font-medium text-muted-foreground">{hint}</p>
      )}
      <QuestionStem question={question} />
      {isFlagged && (
        <p className="text-xs font-medium text-chart-3">Flagged for review</p>
      )}

      {type === "mcq" ? (
        <div className="flex flex-col gap-px overflow-hidden rounded-md border border-border">
          {(question.options ?? []).map((option, i) => (
            <ExamOptionRow
              key={option.id}
              option={option}
              index={i}
              selected={selected.includes(option.id)}
              multiSelect={Boolean(question.multiSelect)}
              onToggle={() => onToggleOption(option.id)}
            />
          ))}
        </div>
      ) : type === "drag_match" ? (
        <DragMatchPane
          question={question}
          answer={dragAnswer}
          onChange={onDragAnswerChange}
          revealed={revealed}
        />
      ) : type === "drag_order" ? (
        <DragOrderPane
          question={question}
          answer={dragAnswer}
          onChange={onDragAnswerChange}
          revealed={revealed}
        />
      ) : type === "select_grid" ? (
        <SelectGridPane
          question={question}
          answer={dragAnswer}
          onChange={onDragAnswerChange}
          revealed={revealed}
        />
      ) : (
        <DragCategorizePane
          question={question}
          answer={dragAnswer}
          onChange={onDragAnswerChange}
          revealed={revealed}
        />
      )}
    </div>
  )
}
