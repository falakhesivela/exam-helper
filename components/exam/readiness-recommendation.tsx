"use client"

import { ShieldCheck, TrendingDown } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { useSessionStore } from "@/lib/store/use-session-store"
import { getExamBlueprint } from "@/lib/exams"

export interface WeakDomain {
  domainId: string
  name: string
  mastery: number
}

export interface ExamReadiness {
  accuracy: number
  /** At or above the pass mark on recent mocks. */
  ready: boolean
  weakest: WeakDomain[]
}

/**
 * Recent-mock signal for one exam, or null until there is enough of it to
 * advise on. Drives which launch option the exam page recommends.
 */
export function useExamReadiness(
  examCode: string,
  passMark: number,
): ExamReadiness | null {
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

  return { accuracy: recent.accuracy, ready: recent.accuracy >= passMark, weakest }
}

/**
 * States where the user stands, and why the recommended launch option is the
 * one it is. The launch options themselves carry the buttons.
 */
export function ReadinessBanner({
  readiness,
  passMark,
}: {
  readiness: ExamReadiness
  passMark: number
}) {
  const accuracy = Math.round(readiness.accuracy)

  if (readiness.ready) {
    return (
      <Card className="border-success/30">
        <CardContent className="flex items-start gap-3 p-4">
          <ShieldCheck className="mt-0.5 size-5 shrink-0 text-success" />
          <p className="text-sm">
            <span className="font-medium">
              You&apos;re averaging {accuracy}% on recent mocks
            </span>{" "}
            <span className="text-muted-foreground">
              — above the {passMark}% pass mark. A full-length simulation is the
              right next step.
            </span>
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="border-chart-3/40">
      <CardContent className="flex items-start gap-3 p-4">
        <TrendingDown className="mt-0.5 size-5 shrink-0 text-chart-3" />
        <p className="text-sm">
          <span className="font-medium">
            You&apos;re averaging {accuracy}% on recent mocks
          </span>{" "}
          <span className="text-muted-foreground">
            — under the {passMark}% pass mark.
            {readiness.weakest.length > 0 ? (
              <>
                {" "}
                Drilling{" "}
                <span className="font-medium text-foreground">
                  {readiness.weakest.map((w) => w.name).join(" and ")}
                </span>{" "}
                first beats another full mock.
              </>
            ) : (
              " A short focused session beats another full mock."
            )}
          </span>
        </p>
      </CardContent>
    </Card>
  )
}
