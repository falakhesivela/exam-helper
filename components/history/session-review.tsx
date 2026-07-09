"use client"

import Link from "next/link"
import { useMemo } from "react"
import { ArrowLeft, Check, Flag, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from "@/components/ui/empty"
import { MarkdownInline } from "@/components/ui/markdown"
import { useSessionStore } from "@/lib/store/use-session-store"
import { scoreOf } from "@/lib/session-utils"
import { QuestionStem } from "@/components/exam/vue/question-stem"
import { cn } from "@/lib/utils"

const LETTERS = ["A", "B", "C", "D", "E", "F"]

interface SessionReviewProps {
  sessionId: string
  filter?: "all" | "flagged"
}

export function SessionReview({ sessionId, filter = "all" }: SessionReviewProps) {
  const session = useSessionStore((s) => s.getSession(sessionId))

  const questions = useMemo(() => {
    if (!session) return []
    if (filter !== "flagged") return session.questions
    return session.questions.filter((q) => session.answers[q.id]?.markedForReview)
  }, [session, filter])

  if (!session) {
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
  const flaggedTotal = session.questions.filter(
    (q) => session.answers[q.id]?.markedForReview,
  ).length

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
            {filter === "flagged"
              ? `Flagged questions (${questions.length})`
              : session.focusTopics.join(", ")}
          </p>
        </div>
      </div>

      {flaggedTotal > 0 && (
        <div className="flex gap-2">
          <Button
            asChild
            size="sm"
            variant={filter === "all" ? "default" : "outline"}
          >
            <Link href={`/history/${sessionId}`}>All questions</Link>
          </Button>
          <Button
            asChild
            size="sm"
            variant={filter === "flagged" ? "default" : "outline"}
          >
            <Link href={`/history/${sessionId}?filter=flagged`}>
              <Flag data-icon="inline-start" />
              Flagged ({flaggedTotal})
            </Link>
          </Button>
        </div>
      )}

      {filter === "flagged" && questions.length === 0 && (
        <Empty className="rounded-xl border border-border py-10">
          <EmptyHeader>
            <EmptyTitle>No flagged questions</EmptyTitle>
            <EmptyDescription>
              You did not flag any questions in this session.
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
                  <div className="flex items-center gap-2">
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
                  <p className="text-sm text-muted-foreground">
                    Drag-and-drop question — review your assigned matches in the exam summary.
                  </p>
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
