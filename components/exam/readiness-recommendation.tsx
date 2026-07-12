"use client"

import { Crosshair, ShieldCheck, TrendingDown } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { useSessionStore } from "@/lib/store/use-session-store"
import { getExamBlueprint } from "@/lib/exams"

interface ReadinessRecommendationProps {
  examCode: string
  passMark: number
  /** Largest exam launchable on the user's plan right now. */
  examCap: number
  starting: boolean
  onDrill: (
    questionCount: number,
    durationMin: number,
    focusDomainIds: string[],
  ) => void
}

/**
 * Data-driven nudge on the config screen: below the pass mark on recent
 * mocks → drill the weakest domains first; at or above → take the
 * full-length simulation with confidence.
 */
export function ReadinessRecommendation({
  examCode,
  passMark,
  examCap,
  starting,
  onDrill,
}: ReadinessRecommendationProps) {
  const examAccuracy = useSessionStore((s) => s.examAccuracy)
  const topicMastery = useSessionStore((s) => s.topicMastery)

  const recent = examAccuracy[examCode]
  // Need a real signal before advising — at least one scored mock.
  if (!recent || recent.questions < 5) return null

  const blueprint = getExamBlueprint(examCode)
  const weakest = topicMastery
    .filter(
      (t) => t.examCode === examCode && t.domainId && t.questionsAnswered >= 3,
    )
    .sort((a, b) => a.mastery - b.mastery)
    .slice(0, 2)
    .map((t) => ({
      domainId: t.domainId as string,
      name:
        blueprint?.domains.find((d) => d.id === t.domainId)?.name ??
        t.displayTopic ??
        t.topic,
      mastery: Math.round(t.mastery),
    }))

  const ready = recent.accuracy >= passMark

  if (ready) {
    return (
      <Card className="border-success/30">
        <CardContent className="flex items-start gap-3 p-4">
          <ShieldCheck className="mt-0.5 size-5 shrink-0 text-success" />
          <p className="text-sm">
            <span className="font-medium">
              You&apos;re averaging {Math.round(recent.accuracy)}% on recent
              mocks
            </span>{" "}
            <span className="text-muted-foreground">
              — above the {passMark}% pass mark. A full-length simulation is
              the right next step.
            </span>
          </p>
        </CardContent>
      </Card>
    )
  }

  const drillCount = Math.max(1, Math.min(20, examCap))
  const drillMinutes = Math.max(5, Math.round(drillCount * 1.5))

  return (
    <Card className="border-chart-3/40">
      <CardContent className="flex flex-col gap-3 p-4">
        <p className="flex items-start gap-3 text-sm">
          <TrendingDown className="mt-0.5 size-5 shrink-0 text-chart-3" />
          <span>
            <span className="font-medium">
              You&apos;re averaging {Math.round(recent.accuracy)}% on recent
              mocks
            </span>{" "}
            <span className="text-muted-foreground">
              — under the {passMark}% pass mark.
              {weakest.length > 0 ? (
                <>
                  {" "}
                  Drilling{" "}
                  <span className="font-medium text-foreground">
                    {weakest.map((w) => w.name).join(" and ")}
                  </span>{" "}
                  first beats another full mock.
                </>
              ) : (
                " A short focused session beats another full mock."
              )}
            </span>
          </span>
        </p>
        {weakest.length > 0 && examCap >= 1 && (
          <Button
            size="sm"
            variant="secondary"
            className="self-start"
            disabled={starting}
            onClick={() =>
              onDrill(
                drillCount,
                drillMinutes,
                weakest.map((w) => w.domainId),
              )
            }
          >
            <Crosshair data-icon="inline-start" />
            Drill {weakest.map((w) => w.name).join(" + ")}
          </Button>
        )}
      </CardContent>
    </Card>
  )
}
