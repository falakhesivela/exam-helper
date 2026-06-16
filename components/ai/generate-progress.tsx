"use client"

import { CheckCircle2, Circle, Loader2, Sparkles } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

interface GenerateProgressProps {
  status: string
  exam?: string
  examCode?: string
  focusTopics?: string[]
  /** Topics currently being written (from streaming previews). */
  previews: string[]
  /** Number of fully generated questions so far. */
  completedCount: number
  total: number
}

/** Live progress while questions stream in from the AI. */
export function GenerateProgress({
  status,
  exam,
  examCode,
  focusTopics,
  previews,
  completedCount,
  total,
}: GenerateProgressProps) {
  const slots = Array.from({ length: total }, (_, i) => {
    if (i < completedCount) return "done" as const
    if (previews[i]) return "preview" as const
    if (i === completedCount && completedCount < total) return "active" as const
    return "pending" as const
  })

  return (
    <Card className="border-primary/20">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <span className="flex size-6 items-center justify-center rounded-full bg-primary/15 text-primary">
            <Loader2 className="size-3.5 animate-spin" />
          </span>
          Generating your practice session
        </CardTitle>
        <CardDescription>{status}</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {(exam || examCode) && (
          <div className="rounded-lg border border-border bg-secondary/40 px-3 py-2 text-sm">
            <span className="font-medium">{exam ?? "Certification exam"}</span>
            {examCode && (
              <span className="text-muted-foreground"> · {examCode}</span>
            )}
          </div>
        )}

        {focusTopics && focusTopics.length > 0 && (
          <p className="text-xs text-muted-foreground">
            Focus: {focusTopics.join(", ")}
          </p>
        )}

        <ul className="flex flex-col gap-2">
          {slots.map((state, i) => (
            <li key={i} className="flex items-center gap-2.5 text-sm">
              {state === "done" ? (
                <CheckCircle2 className="size-4 shrink-0 text-primary" />
              ) : state === "active" ? (
                <Loader2 className="size-4 shrink-0 animate-spin text-primary" />
              ) : (
                <Circle className="size-4 shrink-0 text-muted-foreground/40" />
              )}
              <span
                className={
                  state === "pending"
                    ? "text-muted-foreground/60"
                    : "text-foreground"
                }
              >
                {state === "done"
                  ? `Question ${i + 1} ready`
                  : previews[i]
                    ? `Writing: ${previews[i]}`
                    : `Question ${i + 1}`}
              </span>
            </li>
          ))}
        </ul>

        {completedCount === 0 && previews.length === 0 && (
          <div className="flex flex-col gap-2 pt-1">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
          </div>
        )}
      </CardContent>
    </Card>
  )
}

interface AnalyzeProgressProps {
  status: string
  /** Clarifying questions received so far (may be partial during stream). */
  questionCount: number
}

/** Live progress while clarify questions stream in. */
export function AnalyzeProgress({ status, questionCount }: AnalyzeProgressProps) {
  return (
    <Card className="border-primary/20">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <span className="flex size-6 items-center justify-center rounded-full bg-primary/15 text-primary">
            {questionCount > 0 ? (
              <Sparkles className="size-3.5" />
            ) : (
              <Loader2 className="size-3.5 animate-spin" />
            )}
          </span>
          {questionCount > 0 ? "A few quick questions" : "Reading your description"}
        </CardTitle>
        <CardDescription>{status}</CardDescription>
      </CardHeader>
      {questionCount === 0 && (
        <CardContent className="flex flex-col gap-4">
          <Skeleton className="h-10 w-full rounded-2xl" />
          <div className="flex flex-wrap gap-2">
            <Skeleton className="h-8 w-24 rounded-md" />
            <Skeleton className="h-8 w-28 rounded-md" />
          </div>
        </CardContent>
      )}
    </Card>
  )
}
