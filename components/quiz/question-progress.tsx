"use client"

import type { AnswerRecord } from "@/types"
import { cn } from "@/lib/utils"

export type QuestionOutcome = "correct" | "wrong" | "skipped" | "pending" | "current"

interface QuestionProgressProps {
  total: number
  currentIndex: number
  /** Question ids in session order (may be shorter than total while generating). */
  questionIds: string[]
  answers: Record<string, AnswerRecord>
  revealed: boolean
  /** When set, segments up to `maxSelectableIndex` become tappable. */
  onSelect?: (index: number) => void
  /** Highest index the user may jump to (usually the working cursor). */
  maxSelectableIndex?: number
}

function outcomeFor(
  questionId: string | undefined,
  index: number,
  currentIndex: number,
  revealed: boolean,
  answers: Record<string, AnswerRecord>,
): QuestionOutcome {
  if (index === currentIndex) {
    if (revealed && questionId) {
      const a = answers[questionId]
      if (a?.skipped) return "skipped"
      if (a?.isCorrect) return "correct"
      return "wrong"
    }
    return "current"
  }
  if (!questionId) return "pending"
  const a = answers[questionId]
  if (!a) return index < currentIndex ? "pending" : "pending"
  if (a.skipped) return "skipped"
  if (a.selectedOptionIds.length > 0 || a.dragAnswer != null || a.isCorrect) {
    return a.isCorrect ? "correct" : "wrong"
  }
  return "pending"
}

const outcomeStyles: Record<QuestionOutcome, string> = {
  correct: "bg-success",
  wrong: "bg-destructive",
  skipped: "bg-muted-foreground/40",
  pending: "bg-muted",
  current: "bg-primary animate-pulse",
}

/** Segmented per-question progress bar for the quiz runner. */
export function QuestionProgress({
  total,
  currentIndex,
  questionIds,
  answers,
  revealed,
  onSelect,
  maxSelectableIndex = -1,
}: QuestionProgressProps) {
  const segments = Array.from({ length: total }, (_, i) => {
    const id = questionIds[i]
    return outcomeFor(id, i, currentIndex, revealed, answers)
  })

  return (
    <div
      className="flex gap-1"
      role="progressbar"
      aria-valuenow={currentIndex + 1}
      aria-valuemin={1}
      aria-valuemax={total}
      aria-label={`Question ${currentIndex + 1} of ${total}`}
    >
      {segments.map((outcome, i) => {
        const bar = (
          <span
            className={cn(
              "block h-1.5 w-full rounded-full transition-colors",
              outcomeStyles[outcome],
            )}
          />
        )
        if (onSelect && i <= maxSelectableIndex && i !== currentIndex) {
          return (
            // Slim bar, so pad the hit area beyond the visible segment.
            <button
              key={i}
              type="button"
              aria-label={`Go to question ${i + 1}`}
              onClick={() => onSelect(i)}
              className="-my-2 flex-1 cursor-pointer py-2 transition-opacity hover:opacity-70"
            >
              {bar}
            </button>
          )
        }
        return (
          <span key={i} className="flex-1">
            {bar}
          </span>
        )
      })}
    </div>
  )
}
