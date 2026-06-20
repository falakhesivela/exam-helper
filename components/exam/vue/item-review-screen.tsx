"use client"

import { Flag } from "lucide-react"
import { Button } from "@/components/ui/button"
import { isExamQuestionAnswered } from "@/lib/exam-answer-state"
import type { DragAnswer, Question } from "@/types"
import { cn } from "@/lib/utils"

interface ExamNavigatorProps {
  total: number
  currentIndex: number
  answers: Record<string, string[]>
  dragAnswers: Record<string, DragAnswer>
  questions: Question[]
  flagged: Set<string>
  questionIds: string[]
  onGoTo: (index: number) => void
}

export function ExamNavigator({
  total,
  currentIndex,
  answers,
  dragAnswers,
  questions,
  flagged,
  questionIds,
  onGoTo,
}: ExamNavigatorProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {questionIds.map((id, i) => {
        const question = questions[i]
        const isAnswered = question
          ? isExamQuestionAnswered(question, answers, dragAnswers)
          : (answers[id] ?? []).length > 0
        const isFlagged = flagged.has(id)
        const isCurrent = i === currentIndex
        return (
          <button
            key={id}
            type="button"
            onClick={() => onGoTo(i)}
            aria-label={`Go to question ${i + 1}`}
            aria-current={isCurrent ? "true" : undefined}
            className={cn(
              "relative flex size-10 items-center justify-center rounded-md border text-sm font-medium transition-colors",
              isCurrent && "ring-2 ring-ring ring-offset-1",
              isAnswered
                ? "border-primary/60 bg-primary/10 text-primary"
                : "border-border text-muted-foreground hover:border-primary/40",
            )}
          >
            {i + 1}
            {isFlagged && (
              <Flag className="absolute -right-1 -top-1 size-3 text-chart-3" />
            )}
          </button>
        )
      })}
      {total > questionIds.length && (
        <span className="self-center text-xs text-muted-foreground">
          +{total - questionIds.length} loading…
        </span>
      )}
    </div>
  )
}

interface ItemReviewScreenProps {
  total: number
  answeredCount: number
  flaggedCount: number
  canSubmit: boolean
  onReviewAll: () => void
  onReviewIncomplete: () => void
  onReviewFlagged: () => void
  onEndReview: () => void
}

export function ItemReviewScreen({
  total,
  answeredCount,
  flaggedCount,
  canSubmit,
  onReviewAll,
  onReviewIncomplete,
  onReviewFlagged,
  onEndReview,
}: ItemReviewScreenProps) {
  const incomplete = total - answeredCount

  return (
    <div className="mx-auto flex min-h-dvh max-w-lg flex-col justify-center gap-6 px-4 py-8">
      <header className="flex flex-col gap-1 text-center">
        <h1 className="text-2xl font-semibold tracking-tight">Review</h1>
        <p className="text-sm text-muted-foreground">
          Check your answers before submitting
        </p>
      </header>

      <div className="grid gap-2 text-sm">
        <div className="flex justify-between rounded-md border border-border px-4 py-3">
          <span>Answered</span>
          <span className="font-medium">
            {answeredCount} / {total}
          </span>
        </div>
        <div className="flex justify-between rounded-md border border-border px-4 py-3">
          <span>Incomplete</span>
          <span className="font-medium">{incomplete}</span>
        </div>
        <div className="flex justify-between rounded-md border border-border px-4 py-3">
          <span>Flagged for review</span>
          <span className="font-medium">{flaggedCount}</span>
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <Button variant="secondary" onClick={onReviewAll}>
          Review all
        </Button>
        <Button
          variant="secondary"
          disabled={incomplete === 0}
          onClick={onReviewIncomplete}
        >
          Review incomplete ({incomplete})
        </Button>
        <Button
          variant="secondary"
          disabled={flaggedCount === 0}
          onClick={onReviewFlagged}
        >
          Review flagged ({flaggedCount})
        </Button>
        <Button
          size="lg"
          disabled={!canSubmit}
          onClick={onEndReview}
          className="mt-2"
        >
          {canSubmit ? "End review & submit" : "Waiting for questions…"}
        </Button>
      </div>
    </div>
  )
}
