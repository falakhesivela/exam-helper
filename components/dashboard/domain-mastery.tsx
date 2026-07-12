"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { ArrowRight, BarChart3, Target } from "lucide-react"
import { toast } from "sonner"
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
import { Spinner } from "@/components/ui/spinner"
import {
  getExamBlueprint,
  scaledExamParams,
  WEAK_FOCUS_EXAM_MINUTES,
  WEAK_FOCUS_EXAM_QUESTIONS,
  WEAK_FOCUS_PRACTICE_QUESTIONS,
} from "@/lib/exams"
import { inferExamFromSessions } from "@/lib/learning/topic-resolver"
import { resolveTopicName } from "@/lib/learning/topic-resolver"
import {
  computeExamReadiness,
  type DomainReadiness,
} from "@/lib/progress/readiness"
import { useGenerationStore } from "@/lib/generation/session-generation"
import { useSessionStore } from "@/lib/store/use-session-store"
import { ApiClientError } from "@/lib/api/client"
import { cn } from "@/lib/utils"

/**
 * Per-domain mastery against the exam blueprint: a bar per domain with the
 * pass mark as a reference line, weight labels, and a one-tap focused drill.
 * Falls back to a weakest-topics list for custom exams without a blueprint.
 */
export function DomainMastery() {
  const router = useRouter()
  const dataReady = useSessionStore((s) => s.dataReady)
  const sessions = useSessionStore((s) => s.sessions)
  const topicMastery = useSessionStore((s) => s.topicMastery)
  const examAccuracy = useSessionStore((s) => s.examAccuracy)
  const remaining = useSessionStore((s) => s.remainingFreeQuestions())
  const hydrate = useSessionStore((s) => s.hydrate)
  const [drillingId, setDrillingId] = useState<string | null>(null)
  const [startingExam, setStartingExam] = useState(false)

  const activeExamCode = useSessionStore((s) => s.activeExamCode)
  const examCode = useMemo(
    () => activeExamCode ?? inferExamFromSessions(sessions).examCode,
    [activeExamCode, sessions],
  )
  const blueprint = getExamBlueprint(examCode)

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

  function drill(domain: DomainReadiness) {
    if (!blueprint || drillingId || startingExam || drillCount < 1) return
    setDrillingId(domain.id)
    useGenerationStore.getState().startPracticeGeneration(
      {
        description: `Focused practice for ${blueprint.exam} (${blueprint.examCode}). Target this domain: ${domain.name}. Generate exam-style multiple-choice questions on it only.`,
        count: drillCount,
        focusTopics: [domain.name],
        exam: blueprint.exam,
        examCode: blueprint.examCode,
      },
      {
        onReady: (session) => {
          toast.success(`${domain.name} drill ready!`)
          router.push(`/quiz/${session.id}`)
          setDrillingId(null)
        },
        onDone: async () => {
          await hydrate()
        },
        onError: (err) => {
          toast.error(
            err instanceof ApiClientError && err.code === "FREEMIUM_LIMIT"
              ? "Question limit reached on your plan."
              : err.message,
          )
          setDrillingId(null)
        },
      },
    )
  }

  function startWeakExam() {
    if (!blueprint || !readiness || startingExam || drillingId) return
    const questionCount =
      remaining === Infinity
        ? WEAK_FOCUS_EXAM_QUESTIONS
        : Math.min(WEAK_FOCUS_EXAM_QUESTIONS, remaining)
    if (questionCount < 1) return
    const scaled = scaledExamParams(blueprint, questionCount)
    setStartingExam(true)
    useGenerationStore.getState().startExamGeneration(
      {
        questionCount: scaled.questionCount,
        durationSec:
          (remaining === Infinity ? WEAK_FOCUS_EXAM_MINUTES : scaled.durationMin) * 60,
        exam: blueprint.exam,
        examCode: blueprint.examCode,
        focusDomainIds: readiness.weakestDomains.slice(0, 2).map((d) => d.id),
      },
      {
        onReady: (session) => {
          toast.success("Focused mock exam ready!")
          router.push(`/exam/${session.id}`)
          setStartingExam(false)
        },
        onDone: async () => {
          await hydrate()
        },
        onError: (err) => {
          toast.error(
            err instanceof ApiClientError && err.code === "FREEMIUM_LIMIT"
              ? "Question limit reached on your plan."
              : err.message,
          )
          setStartingExam(false)
        },
      },
    )
  }

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
                  href={`/study/${resolved.slug}`}
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
            <Link href="/study">
              Open Study
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
                    href={`/study/${slug}`}
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
                      size="sm"
                      variant="ghost"
                      className="h-6 shrink-0 px-2 text-xs font-semibold text-primary"
                      disabled={drillingId != null || startingExam}
                      onClick={() => drill(d)}
                    >
                      {drillingId === d.id ? (
                        <Spinner className="size-3.5" />
                      ) : (
                        "Drill"
                      )}
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

        <Button
          className="w-full"
          variant="secondary"
          disabled={startingExam || drillingId != null}
          onClick={startWeakExam}
        >
          {startingExam ? (
            <>
              <Spinner data-icon="inline-start" />
              Starting exam…
            </>
          ) : (
            <>
              <Target data-icon="inline-start" />
              Mock exam on weak areas
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  )
}
