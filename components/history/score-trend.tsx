"use client"

import { useMemo } from "react"
import dynamic from "next/dynamic"
import { TrendingUp } from "lucide-react"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { useSessionStore } from "@/lib/store/use-session-store"
import { getExamBlueprint } from "@/lib/exams"
import { scoreOf } from "@/lib/session-utils"

// Lazy-load recharts (~100KB gz) so it doesn't ship in the history route's
// initial bundle just for this chart.
const ScoreTrendChart = dynamic(
  () =>
    import("@/components/history/score-trend-chart").then(
      (m) => m.ScoreTrendChart,
    ),
  { ssr: false, loading: () => <div className="h-full w-full" /> },
)

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]

function formatDay(iso: string): string {
  const d = new Date(iso)
  return `${MONTHS[d.getMonth()]} ${d.getDate()}`
}

/**
 * Mock-exam score trend for the exam the learner sits most. Rendered on the
 * history page once there are two scored mocks to connect.
 */
export function ScoreTrend() {
  const sessions = useSessionStore((s) => s.sessions)
  const activeExamCode = useSessionStore((s) => s.activeExamCode)

  const trend = useMemo(() => {
    const mocks = sessions.filter(
      (s) => s.mode === "exam" && s.status === "completed",
    )
    if (mocks.length === 0) return null

    const byCode = new Map<string, typeof mocks>()
    for (const s of mocks) {
      byCode.set(s.examCode, [...(byCode.get(s.examCode) ?? []), s])
    }
    // Prefer the active exam when it has enough attempts; otherwise the
    // most-mocked exam.
    const candidates = [...byCode.entries()].sort(
      (a, b) => b[1].length - a[1].length,
    )
    const chosen =
      activeExamCode && (byCode.get(activeExamCode)?.length ?? 0) >= 2
        ? ([activeExamCode, byCode.get(activeExamCode)!] as const)
        : candidates[0]
    if (!chosen || chosen[1].length < 2) return null

    const [examCode, examSessions] = chosen
    const points = examSessions
      .slice()
      .sort(
        (a, b) =>
          new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
      )
      .map((s) => ({
        date: formatDay(s.createdAt),
        score: scoreOf(s).pct,
      }))
    const passMark =
      examSessions[0].passMark ?? getExamBlueprint(examCode)?.passMark ?? 72
    return { examCode, points, passMark }
  }, [sessions, activeExamCode])

  if (!trend) return null

  const latest = trend.points[trend.points.length - 1].score
  const first = trend.points[0].score
  const delta = latest - first

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="size-4 text-primary" />
          Mock exam trend · {trend.examCode}
        </CardTitle>
        <CardDescription>
          {trend.points.length} attempts · latest {latest}%
          {delta !== 0 && (
            <span className={delta > 0 ? " text-success" : " text-destructive"}>
              {" "}
              ({delta > 0 ? "+" : ""}
              {delta} since your first)
            </span>
          )}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-32 w-full">
          <ScoreTrendChart points={trend.points} passMark={trend.passMark} />
        </div>
        <p className="mt-1 text-xs text-muted-foreground">
          Dashed line marks the {trend.passMark}% pass mark.
        </p>
      </CardContent>
    </Card>
  )
}
