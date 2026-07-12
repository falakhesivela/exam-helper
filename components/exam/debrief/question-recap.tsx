"use client"

import Link from "next/link"
import { Card, CardContent } from "@/components/ui/card"
import { formatClock } from "@/hooks/use-countdown"
import type { PracticeSession } from "@/types"
import { cn } from "@/lib/utils"

interface QuestionRecapProps {
  session: PracticeSession
}

/**
 * One-glance strip of every question — result, time, confidence — each
 * jumping straight to that question in the full review.
 */
export function QuestionRecap({ session }: QuestionRecapProps) {
  if (session.questions.length === 0) return null

  return (
    <Card>
      <CardContent className="flex flex-col gap-3 p-5">
        <p className="text-sm font-medium">Question recap</p>
        <div className="grid grid-cols-5 gap-1.5 sm:grid-cols-10">
          {session.questions.map((q, i) => {
            const a = session.answers[q.id]
            const skipped = !a || a.skipped
            const correct = a?.isCorrect ?? false
            const parts = [
              skipped ? "skipped" : correct ? "correct" : "incorrect",
            ]
            if (a?.timeSpentSec) parts.push(formatClock(a.timeSpentSec))
            if (a?.confidence) parts.push(a.confidence)
            return (
              <Link
                key={q.id}
                href={`/history/${session.id}#q-${i}`}
                title={`Q${i + 1} · ${parts.join(" · ")}`}
                className={cn(
                  "flex h-8 items-center justify-center rounded-md border text-xs font-medium tabular-nums transition-colors hover:border-primary/50",
                  skipped
                    ? "border-border bg-secondary/40 text-muted-foreground"
                    : correct
                      ? "border-success/30 bg-success/10 text-success"
                      : "border-destructive/30 bg-destructive/10 text-destructive",
                )}
              >
                {i + 1}
                {a?.confidence === "unsure" && (
                  <span className="ml-0.5 text-[10px]" aria-label="unsure">
                    ?
                  </span>
                )}
              </Link>
            )
          })}
        </div>
        <p className="text-xs text-muted-foreground">
          Tap a question to see the full explanation. “?” marks answers you
          rated unsure.
        </p>
      </CardContent>
    </Card>
  )
}
