"use client"

import { useMemo } from "react"
import Link from "next/link"
import { ArrowRight, BarChart3, Target } from "lucide-react"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { CardSkeleton } from "@/components/ui/card-skeleton"
import { Progress } from "@/components/ui/progress"
import { useActiveExam } from "@/hooks/use-active-exam"
import { WEAK_FOCUS_PRACTICE_QUESTIONS } from "@/lib/exams"
import { resolveTopicName } from "@/lib/learning/topic-resolver"
import { computeExamReadiness } from "@/lib/progress/readiness"
import { useSessionStore } from "@/lib/store/use-session-store"
import { cn } from "@/lib/utils"

/**
 * Per-domain mastery against the exam blueprint: a bar per domain with the
 * pass mark as a reference line, weight labels, and a one-tap focused drill.
 * Falls back to a weakest-topics list for custom exams without a blueprint.
 */
export function DomainMastery() {
  const dataReady = useSessionStore((s) => s.dataReady)
  const topicMastery = useSessionStore((s) => s.topicMastery)
  const examAccuracy = useSessionStore((s) => s.examAccuracy)
  const remaining = useSessionStore((s) => s.remainingFreeQuestions())

  const { activeExam } = useActiveExam()
  const blueprint = activeExam?.blueprint ?? null
  const examCode = activeExam?.examCode ?? "CUSTOM"

  const readiness = useMemo(
    () =>
      blueprint
        ? computeExamReadiness(
            blueprint,
            topicMastery,
            examAccuracy[blueprint.examCode],
          )
        : null,
    [blueprint, topicMastery, examAccuracy],
  )

  const drillCount =
    remaining === Infinity
      ? WEAK_FOCUS_PRACTICE_QUESTIONS
      : Math.min(WEAK_FOCUS_PRACTICE_QUESTIONS, remaining)

  // Mastery data still streaming in — don't flash the fallback list.
  if (!dataReady && (!readiness || readiness.totalAnswered === 0)) {
    return <CardSkeleton rows={5} />
  }

  // Custom exam (no blueprint) or nothing answered yet → weakest-topics list.
  if (!blueprint || !readiness || readiness.totalAnswered === 0) {
    const weakest = [...topicMastery]
      .sort((a, b) => a.mastery - b.mastery)
      .slice(0, 4)
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="size-4 text-primary" />
            Focus areas
          </CardTitle>
          <CardDescription>
            Recommended topics to strengthen next
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          {weakest.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Answer more questions to see personalized focus areas.
            </p>
          ) : (
            weakest.map((t) => {
              const label = t.displayTopic ?? t.topic
              const resolved = resolveTopicName(label, examCode)
              return (
                <Link
                  key={`${t.topic}:${label}`}
                  href={`/learn/${resolved.slug}`}
                  className="-mx-2 flex flex-col gap-1.5 rounded-lg px-2 py-1 transition-colors hover:bg-muted/50"
                >
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium">{label}</span>
                    <span className="text-muted-foreground">{t.mastery}%</span>
                  </div>
                  <Progress value={t.mastery} className="h-1.5" />
                </Link>
              )
            })
          )}
          <Button asChild variant="outline" className="w-full">
            <Link href="/learn">
              Open Learn
              <ArrowRight data-icon="inline-end" />
            </Link>
          </Button>
        </CardContent>
      </Card>
    )
  }

  const domains = [...readiness.domains].sort(
    (a, b) => b.weightPercent - a.weightPercent,
  )

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BarChart3 className="size-4 text-primary" />
          Domain mastery
        </CardTitle>
        <CardDescription>
          Against the {readiness.examCode} blueprint — drill a domain to lift it
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-5">
        <div className="flex flex-col gap-4">
          {domains.map((d) => {
            const below = d.mastery < readiness.passMark
            const slug = resolveTopicName(d.name, readiness.examCode).slug
            return (
              <div key={d.id} className="flex flex-col gap-1.5">
                <div className="flex items-baseline justify-between gap-3 text-sm">
                  <Link
                    href={`/learn/${slug}`}
                    className="min-w-0 truncate font-medium transition-colors hover:text-primary"
                  >
                    {d.name}{" "}
                    <span className="text-[11px] font-normal text-muted-foreground">
                      {d.weightPercent}% of exam
                    </span>
                  </Link>
                  <span
                    className={cn(
                      "shrink-0 font-semibold tabular-nums",
                      below && "text-warning",
                    )}
                  >
                    {d.mastery}%
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="relative h-2 flex-1 overflow-visible rounded-full bg-muted">
                    <div
                      className={cn(
                        "h-full rounded-full",
                        below ? "bg-warning" : "bg-primary",
                      )}
                      style={{ width: `${d.mastery}%` }}
                    />
                    <span
                      className="absolute -inset-y-0.5 w-0.5 rounded-full bg-foreground/50"
                      style={{ left: `${readiness.passMark}%` }}
                      aria-hidden="true"
                    />
                  </div>
                  {drillCount >= 1 && (
                    <Button
                      asChild
                      size="sm"
                      variant="ghost"
                      className="h-6 shrink-0 px-2 text-xs font-semibold text-primary"
                    >
                      <Link
                        href={`/practice?topic=${encodeURIComponent(d.name)}`}
                      >
                        Drill
                      </Link>
                    </Button>
                  )}
                </div>
              </div>
            )
          })}
        </div>

        <p className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
          <span className="inline-block h-2.5 w-0.5 rounded-full bg-foreground/50" />
          pass mark {readiness.passMark}% · amber = below pass mark
        </p>

        <Button asChild className="w-full" variant="secondary">
          <Link href="/exam">
            <Target data-icon="inline-start" />
            Mock exam on weak areas
          </Link>
        </Button>
      </CardContent>
    </Card>
  )
}
