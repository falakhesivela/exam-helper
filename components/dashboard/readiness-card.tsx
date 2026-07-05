"use client"

import { useMemo } from "react"
import Link from "next/link"
import { Area, AreaChart, ResponsiveContainer } from "recharts"
import { ArrowRight, Gauge, Sparkles } from "lucide-react"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ProgressRing } from "@/components/ui/progress-ring"
import { getExamBlueprint } from "@/lib/exams"
import { inferExamFromSessions } from "@/lib/learning/topic-resolver"
import {
  computeExamReadiness,
  type ReadinessVerdict,
} from "@/lib/progress/readiness"
import { projectReadiness } from "@/lib/progress/projection"
import { useSessionStore } from "@/lib/store/use-session-store"

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]

/** "2026-07-24" → "Jul 24", locale-free so server and client agree. */
function formatDay(isoDate: string): string {
  const [, m, d] = isoDate.split("-")
  return `${MONTHS[Number(m) - 1] ?? ""} ${Number(d)}`.trim()
}

function daysBetween(fromIso: string, toIso: string): number {
  return Math.round(
    (new Date(`${toIso}T00:00:00Z`).getTime() -
      new Date(`${fromIso}T00:00:00Z`).getTime()) / 86_400_000,
  )
}

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
  const topicMastery = useSessionStore((s) => s.topicMastery)
  const sessions = useSessionStore((s) => s.sessions)
  const examAccuracy = useSessionStore((s) => s.examAccuracy)
  const readinessTrend = useSessionStore((s) => s.readinessTrend)
  const plan = useSessionStore((s) => s.plan)

  const { examCode } = useMemo(
    () => inferExamFromSessions(sessions),
    [sessions],
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
  const todayIso = new Date().toISOString().slice(0, 10)
  const projection = projectReadiness(
    readinessTrend,
    readiness.score,
    readiness.passMark,
    todayIso,
  )
  // Compare the projected ready date to the exam date when a plan exists.
  const examDelta =
    projection && plan && plan.examCode === readiness.examCode
      ? daysBetween(projection.readyDate, plan.targetDate)
      : null

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
            {projection && (
              <>
                {" "}
                At this pace you&apos;ll reach it around{" "}
                <strong>{formatDay(projection.readyDate)}</strong>
                {examDelta == null && "."}
                {examDelta != null &&
                  (examDelta >= 0 ? (
                    <span className="text-muted-foreground">
                      {" "}
                      — {examDelta === 0
                        ? "right on exam day"
                        : `${examDelta} day${examDelta === 1 ? "" : "s"} before your exam`}
                      .
                    </span>
                  ) : (
                    <span className="font-medium text-warning">
                      {" "}
                      — {-examDelta} day{examDelta === -1 ? "" : "s"} after your
                      exam date. Pick up the pace.
                    </span>
                  ))}
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
                <ResponsiveContainer
                  width="100%"
                  height="100%"
                  minWidth={0}
                  initialDimension={{ width: 320, height: 64 }}
                >
                  <AreaChart
                    data={readinessTrend}
                    margin={{ top: 4, right: 0, bottom: 0, left: 0 }}
                  >
                    <defs>
                      <linearGradient
                        id="readinessFill"
                        x1="0"
                        y1="0"
                        x2="0"
                        y2="1"
                      >
                        <stop
                          offset="0%"
                          stopColor="var(--primary)"
                          stopOpacity={0.4}
                        />
                        <stop
                          offset="100%"
                          stopColor="var(--primary)"
                          stopOpacity={0}
                        />
                      </linearGradient>
                    </defs>
                    <Area
                      type="monotone"
                      dataKey="score"
                      stroke="var(--primary)"
                      strokeWidth={2}
                      fill="url(#readinessFill)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
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
