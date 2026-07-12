"use client"

import { Rabbit, Timer, Turtle } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { formatClock } from "@/hooks/use-countdown"
import type { PaceReport } from "@/lib/session-utils"
import { cn } from "@/lib/utils"

interface TimeReportProps {
  report: PaceReport
}

/**
 * Where the clock went: one thin bar per question (height = time), status
 * color for correctness, with the target pace as a reference line. Identity
 * is never color-alone — every bar carries a text tooltip and the flags are
 * summarized as labeled counts.
 */
export function TimeReport({ report }: TimeReportProps) {
  const { entries, targetPerQuestion, avgPerAnswered, rushedWrong, overtime } =
    report
  if (entries.length === 0) return null

  // Scale so the target line sits at a stable 55% height; cap outliers.
  const maxSec = Math.max(
    targetPerQuestion * 1.8,
    ...entries.map((e) => e.timeSpentSec),
  )
  const targetPctFromBottom = (targetPerQuestion / maxSec) * 100

  return (
    <Card>
      <CardContent className="flex flex-col gap-4 p-5">
        <div className="flex items-center justify-between gap-2">
          <p className="text-sm font-medium">Time per question</p>
          <p className="text-xs text-muted-foreground">
            avg {formatClock(avgPerAnswered)} · target{" "}
            {formatClock(targetPerQuestion)}
          </p>
        </div>

        <div className="relative h-28 overflow-x-auto">
          <div
            className="pointer-events-none absolute inset-x-0 border-t border-dashed border-muted-foreground/50"
            style={{ bottom: `${targetPctFromBottom}%` }}
            aria-hidden
          />
          <div className="flex h-full min-w-full items-end gap-0.5">
            {entries.map((e) => (
              <div
                key={e.questionId}
                className={cn(
                  "min-w-1 flex-1 rounded-t-[3px]",
                  e.isCorrect ? "bg-success/80" : "bg-destructive/80",
                )}
                style={{
                  height: `${Math.max(4, (e.timeSpentSec / maxSec) * 100)}%`,
                }}
                title={`Q${e.position} · ${formatClock(e.timeSpentSec)} · ${
                  e.isCorrect ? "correct" : "incorrect"
                }${e.flag ? ` · ${e.flag}` : ""}`}
              />
            ))}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <span className="size-2 rounded-full bg-success/80" aria-hidden />
            Correct
          </span>
          <span className="flex items-center gap-1.5">
            <span className="size-2 rounded-full bg-destructive/80" aria-hidden />
            Incorrect
          </span>
          <span className="flex items-center gap-1.5">
            <span
              className="w-4 border-t border-dashed border-muted-foreground/70"
              aria-hidden
            />
            Target pace
          </span>
        </div>

        {(rushedWrong > 0 || overtime > 0) && (
          <div className="flex flex-col gap-2 text-sm">
            {rushedWrong > 0 && (
              <p className="flex items-start gap-2">
                <Rabbit className="mt-0.5 size-4 shrink-0 text-chart-3" />
                <span>
                  <span className="font-medium">{rushedWrong} rushed</span>{" "}
                  <span className="text-muted-foreground">
                    — answered wrong in under half the target time. Slow down
                    and re-read these question types.
                  </span>
                </span>
              </p>
            )}
            {overtime > 0 && (
              <p className="flex items-start gap-2">
                <Turtle className="mt-0.5 size-4 shrink-0 text-chart-3" />
                <span>
                  <span className="font-medium">{overtime} overtime</span>{" "}
                  <span className="text-muted-foreground">
                    — took over 1.6× the target. On exam day, flag these and
                    move on rather than burning the clock.
                  </span>
                </span>
              </p>
            )}
          </div>
        )}

        {rushedWrong === 0 && overtime === 0 && (
          <p className="flex items-center gap-2 text-sm text-muted-foreground">
            <Timer className="size-4" />
            Steady pacing — no rushed misses or big overruns.
          </p>
        )}
      </CardContent>
    </Card>
  )
}
