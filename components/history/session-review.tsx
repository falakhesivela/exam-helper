"use client"

import Link from "next/link"
import { useEffect, useMemo, useState } from "react"
import { ArrowLeft, Check, CircleHelp, Clock, Flag, X, XCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from "@/components/ui/empty"
import { LoadingScreen } from "@/components/ui/loading-screen"
import { MarkdownInline } from "@/components/ui/markdown"
import { useSessionStore } from "@/lib/store/use-session-store"
import { isSessionSummary, questionTypeOf, scoreOf } from "@/lib/session-utils"
import { formatClock } from "@/hooks/use-countdown"
import { QuestionStem } from "@/components/exam/vue/question-stem"
import { DragMatchPane } from "@/components/exam/vue/drag-match-pane"
import { DragOrderPane } from "@/components/exam/vue/drag-order-pane"
import { DragCategorizePane } from "@/components/exam/vue/drag-categorize-pane"
import { SelectGridPane } from "@/components/exam/vue/select-grid-pane"
import { CommandInputPane } from "@/components/exam/vue/command-input-pane"
import type { AnswerRecord, Question } from "@/types"
import { cn } from "@/lib/utils"

const LETTERS = ["A", "B", "C", "D", "E", "F"]

export type ReviewFilter = "all" | "flagged" | "incorrect" | "unsure"

interface SessionReviewProps {
  sessionId: string
  filter?: ReviewFilter
}

const FILTER_LABELS: Record<Exclude<ReviewFilter, "all">, string> = {
  flagged: "flagged",
  incorrect: "incorrect",
  unsure: "unsure",
}

function matchesFilter(record: AnswerRecord | undefined, filter: ReviewFilter) {
  switch (filter) {
    case "all":
      return true
    case "flagged":
      return record?.markedForReview ?? false
    case "incorrect":
      return !record?.isCorrect
    case "unsure":
      return record?.confidence === "unsure"
  }
}

/** Read-only replay of a non-MCQ answer using the exam panes in reveal mode. */
function DragAnswerReplay({
  question,
  record,
}: {
  question: Question
  record?: AnswerRecord
}) {
  const noop = () => undefined
  const shared = {
    question,
    answer: record?.dragAnswer,
    onChange: noop,
    revealed: true,
  }
  switch (questionTypeOf(question)) {
    case "drag_match":
      return <DragMatchPane {...shared} />
    case "drag_order":
      return <DragOrderPane {...shared} />
    case "select_grid":
      return <SelectGridPane {...shared} />
    case "command_input":
      return <CommandInputPane {...shared} />
    default:
      return <DragCategorizePane {...shared} />
  }
}

export function SessionReview({ sessionId, filter = "all" }: SessionReviewProps) {
  const session = useSessionStore((s) => s.getSession(sessionId))
  const ensureFullSession = useSessionStore((s) => s.ensureFullSession)
  const needsFetch = !session || isSessionSummary(session)
  const [loading, setLoading] = useState(needsFetch)

  // The store holds summary stubs after hydrate; question payloads load here.
  useEffect(() => {
    if (!needsFetch) return
    let cancelled = false
    void ensureFullSession(sessionId).finally(() => {
      if (!cancelled) setLoading(false)
    })
    return () => {
      cancelled = true
    }
  }, [needsFetch, sessionId, ensureFullSession])

  const questions = useMemo(() => {
    if (!session) return []
    return session.questions.filter((q) =>
      matchesFilter(session.answers[q.id], filter),
    )
  }, [session, filter])

  if (needsFetch && loading) {
    return <LoadingScreen message="Loading session…" />
  }

  if (!session || isSessionSummary(session)) {
    return (
      <Empty className="py-16">
        <EmptyHeader>
          <EmptyTitle>Session not found</EmptyTitle>
          <EmptyDescription>This session may have expired.</EmptyDescription>
        </EmptyHeader>
        <Button asChild className="mt-2">
          <Link href="/history">Back to history</Link>
        </Button>
      </Empty>
    )
  }

  const { correct, total, pct } = scoreOf(session)
  const counts = {
    flagged: session.questions.filter(
      (q) => session.answers[q.id]?.markedForReview,
    ).length,
    incorrect: session.questions.filter((q) => !session.answers[q.id]?.isCorrect)
      .length,
    unsure: session.questions.filter(
      (q) => session.answers[q.id]?.confidence === "unsure",
    ).length,
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center gap-2">
        <Button asChild variant="ghost" size="icon" aria-label="Back to history">
          <Link href="/history">
            <ArrowLeft />
          </Link>
        </Button>
        <div className="min-w-0 flex-1">
          <h1 className="text-xl font-semibold tracking-tight">{session.examCode}</h1>
          <p className="text-sm text-muted-foreground">
            {filter !== "all"
              ? `${questions.length} ${FILTER_LABELS[filter]} ${questions.length === 1 ? "question" : "questions"}`
              : session.focusTopics.join(", ")}
          </p>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <Button
          asChild
          size="sm"
          variant={filter === "all" ? "default" : "outline"}
        >
          <Link href={`/history/${sessionId}`}>All questions</Link>
        </Button>
        {counts.incorrect > 0 && (
          <Button
            asChild
            size="sm"
            variant={filter === "incorrect" ? "default" : "outline"}
          >
            <Link href={`/history/${sessionId}?filter=incorrect`}>
              <XCircle data-icon="inline-start" />
              Incorrect ({counts.incorrect})
            </Link>
          </Button>
        )}
        {counts.flagged > 0 && (
          <Button
            asChild
            size="sm"
            variant={filter === "flagged" ? "default" : "outline"}
          >
            <Link href={`/history/${sessionId}?filter=flagged`}>
              <Flag data-icon="inline-start" />
              Flagged ({counts.flagged})
            </Link>
          </Button>
        )}
        {counts.unsure > 0 && (
          <Button
            asChild
            size="sm"
            variant={filter === "unsure" ? "default" : "outline"}
          >
            <Link href={`/history/${sessionId}?filter=unsure`}>
              <CircleHelp data-icon="inline-start" />
              Unsure ({counts.unsure})
            </Link>
          </Button>
        )}
      </div>

      {filter !== "all" && questions.length === 0 && (
        <Empty className="rounded-xl border border-border py-10">
          <EmptyHeader>
            <EmptyTitle>Nothing here</EmptyTitle>
            <EmptyDescription>
              No {FILTER_LABELS[filter]} questions in this session.
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      )}

      {filter === "all" && (
      <Card>
        <CardContent className="flex items-center justify-between gap-4 p-5">
          <div>
            <p className="text-3xl font-semibold tracking-tight">{pct}%</p>
            <p className="text-sm text-muted-foreground">
              {correct} of {total} correct
            </p>
          </div>
          <div className="w-32">
            <Progress value={pct} className="h-2" />
          </div>
        </CardContent>
      </Card>
      )}

      <div className="flex flex-col gap-4">
        {questions.map((q, qi) => {
          const record = session.answers[q.id]
          const userCorrect = record?.isCorrect
          // Anchor target for deep links from the session summary recap.
          const anchorIndex = session.questions.indexOf(q)
          return (
            <Card key={q.id} id={`q-${anchorIndex}`} className="scroll-mt-20">
              <CardContent className="flex flex-col gap-3 p-5">
                <div className="flex items-center justify-between gap-2">
                  <Badge variant="secondary">
                    {qi + 1}. {q.topic}
                  </Badge>
                  <div className="flex flex-wrap items-center justify-end gap-2">
                    {record?.timeSpentSec ? (
                      <Badge variant="outline">
                        <Clock className="size-3" />
                        {formatClock(record.timeSpentSec)}
                      </Badge>
                    ) : null}
                    {record?.confidence && (
                      <Badge
                        variant="outline"
                        className={cn(
                          record.confidence === "unsure" && "text-chart-3",
                        )}
                      >
                        <CircleHelp className="size-3" />
                        {record.confidence === "sure" ? "Sure" : "Unsure"}
                      </Badge>
                    )}
                    {record?.markedForReview && (
                      <Badge variant="outline">
                        <Flag className="size-3" />
                        Flagged
                      </Badge>
                    )}
                    <Badge variant={userCorrect ? "default" : "destructive"}>
                    {record?.skipped ? "Skipped" : userCorrect ? "Correct" : "Incorrect"}
                    </Badge>
                  </div>
                </div>
                <QuestionStem question={q} />

                {(q.options ?? []).length > 0 ? (
                <div className="flex flex-col gap-2">
                  {(q.options ?? []).map((opt, oi) => {
                    const isAnswer = (q.correctOptionIds ?? []).includes(opt.id)
                    const wasSelected = record?.selectedOptionIds.includes(opt.id)
                    return (
                      <div
                        key={opt.id}
                        className={cn(
                          "flex items-center gap-3 rounded-xl border px-3 py-2.5 text-sm",
                          isAnswer && "border-success/50 bg-success/10",
                          wasSelected && !isAnswer && "border-destructive/50 bg-destructive/10",
                          !isAnswer && !wasSelected && "border-border",
                        )}
                      >
                        <span
                          className={cn(
                            "flex size-6 shrink-0 items-center justify-center rounded-md text-xs font-semibold",
                            isAnswer && "bg-success text-success-foreground",
                            wasSelected && !isAnswer && "bg-destructive text-destructive-foreground",
                            !isAnswer && !wasSelected && "bg-secondary text-muted-foreground",
                          )}
                        >
                          {isAnswer ? (
                            <Check className="size-3.5" />
                          ) : wasSelected ? (
                            <X className="size-3.5" />
                          ) : (
                            LETTERS[oi]
                          )}
                        </span>
                        <MarkdownInline className="flex-1">{opt.text}</MarkdownInline>
                      </div>
                    )
                  })}
                </div>
                ) : (
                  <DragAnswerReplay question={q} record={record} />
                )}

                <div className="rounded-xl bg-secondary/40 p-3 text-sm leading-relaxed text-foreground/90">
                  <span className="font-medium text-foreground">Explanation: </span>
                  <MarkdownInline>{q.explanation}</MarkdownInline>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
