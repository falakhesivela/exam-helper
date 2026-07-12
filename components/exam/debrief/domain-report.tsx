"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Crosshair, TrendingDown } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Spinner } from "@/components/ui/spinner"
import { useGenerationStore } from "@/lib/generation/session-generation"
import { useSessionStore } from "@/lib/store/use-session-store"
import { getExamBlueprint, scaledExamParams } from "@/lib/exams"
import { weakestDomains, type DomainScore } from "@/lib/session-utils"
import { cn } from "@/lib/utils"

interface DomainReportProps {
  exam: string
  examCode: string
  breakdown: DomainScore[]
  passMark: number
}

/**
 * Per-domain scorecard with the weakest domains called out and a one-tap
 * focused mock exam on exactly those domains — the fastest route from
 * "failed the mock" to "fixed the gap".
 */
export function DomainReport({
  exam,
  examCode,
  breakdown,
  passMark,
}: DomainReportProps) {
  const router = useRouter()
  const remaining = useSessionStore((s) => s.remainingFreeQuestions())
  const maxExamLength = useSessionStore((s) => s.profile.limits.maxExamLength)
  const [drilling, setDrilling] = useState(false)

  const weakest = weakestDomains(breakdown, passMark)
  // Only blueprint-mapped domains can seed a focused exam.
  const drillDomainIds = weakest
    .map((d) => d.domainId)
    .filter((id): id is string => Boolean(id))

  function startDrill() {
    if (drilling) return
    const examCap = Math.min(remaining, maxExamLength)
    if (examCap < 1) {
      toast.error("No questions left on your plan — upgrade to keep drilling.")
      return
    }
    const blueprint = getExamBlueprint(examCode)
    const questionCount = Math.max(1, Math.min(20, examCap))
    const durationMin = blueprint
      ? scaledExamParams(blueprint, questionCount).durationMin
      : Math.max(5, Math.round(questionCount * 1.5))

    setDrilling(true)
    useGenerationStore.getState().startExamGeneration(
      {
        questionCount,
        durationSec: durationMin * 60,
        exam,
        examCode,
        focusDomainIds: drillDomainIds,
      },
      {
        onReady: (session) => {
          toast.success("Focused drill ready")
          router.push(`/exam/${session.id}`)
        },
        onError: (err) => {
          toast.error(err.message)
          setDrilling(false)
        },
      },
    )
  }

  return (
    <Card>
      <CardContent className="flex flex-col gap-4 p-5">
        <p className="text-sm font-medium">Domain breakdown</p>
        {breakdown.map((t) => {
          const isWeak = weakest.some((w) => w.topic === t.topic)
          return (
            <div key={t.topic} className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between gap-2 text-sm">
                <span className={cn(isWeak && "font-medium text-destructive")}>
                  {isWeak && (
                    <TrendingDown className="mr-1 inline size-3.5 align-[-2px]" />
                  )}
                  {t.topic}
                </span>
                <span className="shrink-0 text-muted-foreground">
                  {t.correct}/{t.total} · {t.pct}%
                </span>
              </div>
              <Progress
                value={t.pct}
                className={cn(
                  "h-1.5",
                  isWeak &&
                    "**:data-[slot=progress-indicator]:bg-destructive",
                )}
              />
            </div>
          )
        })}

        {weakest.length > 0 && (
          <div className="mt-1 flex flex-col gap-3 rounded-lg border border-destructive/30 bg-destructive/5 p-4">
            <p className="text-sm">
              <span className="font-medium">
                {weakest.map((d) => d.topic).join(" and ")}
              </span>{" "}
              {weakest.length > 1 ? "are" : "is"} pulling your score below the
              pass mark. Fixing {weakest.length > 1 ? "these" : "this"} is your
              fastest path to passing.
            </p>
            {drillDomainIds.length > 0 && (
              <Button
                onClick={startDrill}
                disabled={drilling}
                className="self-start"
              >
                {drilling ? (
                  <>
                    <Spinner data-icon="inline-start" />
                    Preparing drill…
                  </>
                ) : (
                  <>
                    <Crosshair data-icon="inline-start" />
                    Drill weak domains
                  </>
                )}
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
