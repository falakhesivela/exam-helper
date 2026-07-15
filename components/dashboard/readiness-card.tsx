"use client"

import { useMemo } from "react"
import Link from "next/link"
import dynamic from "next/dynamic"
import { ArrowRight, Gauge, Sparkles } from "lucide-react"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { CardSkeleton } from "@/components/ui/card-skeleton"
import { ProgressRing } from "@/components/ui/progress-ring"
import { useActiveExam } from "@/hooks/use-active-exam"
import {
  computeExamReadiness,
  type ReadinessVerdict,
} from "@/lib/progress/readiness"
import { useSessionStore } from "@/lib/store/use-session-store"

// Lazy-load recharts (~100KB gz) so it doesn't ship in the dashboard's
// initial bundle just for this sparkline.
const ReadinessSparkline = dynamic(
  () =>
    import("@/components/dashboard/readiness-sparkline").then(
      (m) => m.ReadinessSparkline,
    ),
  { ssr: false, loading: () => <div className="h-full w-full" /> },
)

const VERDICT: Record<
  ReadinessVerdict,
  { label: string; color: string; tint: string }
> = {
  "not-ready": {
    label: "Not ready yet",
    color: "var(--destructive)",
    tint: "text-destructive",
  },
  almost: { label: "Almost there", color: "var(--warning)", tint: "text-warning" },
  ready: {
    label: "On track to pass",
    color: "var(--primary)",
    tint: "text-primary",
  },
}

const CONFIDENCE_LABEL = {
  low: "Low confidence — answer more to sharpen this",
  medium: "Medium confidence",
  high: "High confidence",
} as const

/** Hero card: a single "are you ready to pass?" score for the target exam. */
export function ReadinessCard() {
  const dataReady = useSessionStore((s) => s.dataReady)
  const topicMastery = useSessionStore((s) => s.topicMastery)
  const examAccuracy = useSessionStore((s) => s.examAccuracy)
  const readinessTrend = useSessionStore((s) => s.readinessTrend)

  const { activeExam } = useActiveExam()
  const blueprint = activeExam?.blueprint ?? null

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

  // Mastery/accuracy data still streaming in — don't flash the invite state.
  if (!dataReady && (!readiness || readiness.totalAnswered === 0)) {
    return <CardSkeleton rows={4} className="overflow-hidden" />
  }

  // No blueprint (custom exam) or no answered questions yet → invite to start.
  if (!readiness || readiness.totalAnswered === 0) {
    return (
      <Card className="overflow-hidden">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Gauge className="size-4 text-primary" />
            Exam readiness
          </CardTitle>
          <CardDescription>
            Answer a few questions to unlock your readiness score.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button asChild>
            <Link href="/intake">
              <Sparkles data-icon="inline-start" />
              Start a practice session
            </Link>
          </Button>
        </CardContent>
      </Card>
    )
  }

  const v = VERDICT[readiness.verdict]
  const gap = readiness.passMark - readiness.score

  return (
    <Card className="overflow-hidden">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Gauge className="size-4 text-primary" />
          Exam readiness · {readiness.examCode}
        </CardTitle>
        <CardDescription>
          {readiness.exam} — pass mark {readiness.passMark}%
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col items-center gap-6 sm:flex-row sm:items-start sm:justify-between">
        <ProgressRing
          value={readiness.score}
          size={144}
          color={v.color}
          tickAt={readiness.passMark}
        >
          <span className="text-3xl font-semibold tracking-tight">
            {readiness.score}%
          </span>
          <span className={`text-xs font-medium ${v.tint}`}>{v.label}</span>
        </ProgressRing>

        <div className="flex w-full flex-1 flex-col gap-3">
          <p className="text-sm">
            {gap > 0 ? (
              <>
                You&apos;re <strong>{gap} point{gap === 1 ? "" : "s"}</strong> from
                the pass mark.
              </>
            ) : (
              <>
                You&apos;re <strong>{-gap} point{gap === -1 ? "" : "s"}</strong>{" "}
                above the pass mark — keep it there.
              </>
            )}
          </p>
          <p className="text-xs text-muted-foreground">
            Based on {readiness.totalAnswered} questions across{" "}
            {readiness.domainsCovered}/{readiness.totalDomains} domains
            {readiness.mockExamQuestions > 0
              ? `, incl. your last mock exam`
              : ""}{" "}
            · {CONFIDENCE_LABEL[readiness.confidence]}.
          </p>

          {readinessTrend.length >= 2 && (
            <div>
              <p className="mb-1 text-sm font-medium">Readiness trend</p>
              <div className="h-16 w-full">
                <ReadinessSparkline data={readinessTrend} />
              </div>
            </div>
          )}

          <Button asChild variant="secondary" className="mt-1 w-full sm:w-fit">
            <Link href="/exam">
              Take a mock exam
              <ArrowRight data-icon="inline-end" />
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
