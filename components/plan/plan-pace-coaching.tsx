"use client"

import { useState } from "react"
import { Lightbulb, Sparkles, TrendingUp } from "lucide-react"
import { toast } from "sonner"
import type { StudyPlan } from "@/types"
import { computePlanPace, type PlanPaceStatus } from "@/lib/plan/pace"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"
import { useSessionStore } from "@/lib/store/use-session-store"
import { todayIso } from "@/components/plan/task-meta"
import { cn } from "@/lib/utils"

type Pace = ReturnType<typeof computePlanPace>

const PACE_COPY: Record<
  PlanPaceStatus,
  { label: string; tone: string; detail: (p: Pace) => string }
> = {
  behind: {
    label: "Behind pace",
    tone: "text-warning",
    detail: (p) =>
      `${p.behindBy} task${p.behindBy === 1 ? "" : "s"} behind — about ${p.requiredPerDay}/day finishes on time. Overdue work rolls forward automatically.`,
  },
  "on-track": {
    label: "On track",
    tone: "text-primary",
    detail: (p) =>
      `${p.tasksRemaining} task${p.tasksRemaining === 1 ? "" : "s"} left over ${p.daysRemaining} day${p.daysRemaining === 1 ? "" : "s"}. Keep it up.`,
  },
  ahead: {
    label: "Ahead of schedule",
    tone: "text-primary",
    detail: (p) =>
      `Nicely ahead — ${p.tasksRemaining} task${p.tasksRemaining === 1 ? "" : "s"} left with ${p.daysRemaining} day${p.daysRemaining === 1 ? "" : "s"} to spare.`,
  },
  complete: {
    label: "Plan complete",
    tone: "text-primary",
    detail: () => "Every task done. Book that exam! 🎉",
  },
}

/** Pace line (always visible) with the AI coaching note beneath it. */
export function PlanPaceCoaching({ plan }: { plan: StudyPlan }) {
  const coaching = useSessionStore((s) => s.coaching)
  const requestCoaching = useSessionStore((s) => s.requestCoaching)
  const [loading, setLoading] = useState(false)

  const pace = computePlanPace(plan, todayIso())
  const copy = PACE_COPY[pace.status]

  async function getCoaching() {
    if (loading) return
    setLoading(true)
    try {
      await requestCoaching()
    } catch {
      toast.error("Couldn't get coaching right now.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card>
      <CardContent className="flex flex-col gap-4">
        <div className="flex items-start gap-3">
          <TrendingUp className={cn("mt-0.5 size-4 shrink-0", copy.tone)} />
          <div className="min-w-0">
            <p className={cn("text-sm font-semibold", copy.tone)}>{copy.label}</p>
            <p className="text-xs text-muted-foreground">{copy.detail(pace)}</p>
          </div>
        </div>

        {coaching ? (
          <div className="flex flex-col gap-2 border-t pt-4">
            <p className="flex items-center gap-2 text-sm font-semibold">
              <Lightbulb className="size-4 shrink-0 text-primary" />
              {coaching.headline}
            </p>
            <p className="text-sm text-muted-foreground">{coaching.message}</p>
            {coaching.domainTips.length > 0 && (
              <ul className="flex flex-col gap-2">
                {coaching.domainTips.map((t) => (
                  <li key={t.domain} className="text-sm">
                    <span className="font-medium text-primary">{t.domain}:</span>{" "}
                    <span className="text-muted-foreground">{t.tip}</span>
                  </li>
                ))}
              </ul>
            )}
            <Button
              variant="outline"
              size="sm"
              className="w-fit"
              onClick={() => void getCoaching()}
              disabled={loading}
            >
              {loading ? <Spinner data-icon="inline-start" /> : <Sparkles data-icon="inline-start" />}
              Refresh coaching
            </Button>
          </div>
        ) : (
          <div className="flex items-center justify-between gap-3 border-t pt-4">
            <p className="text-xs text-muted-foreground">
              Get a personalized strategy note for your pace and weakest domains.
            </p>
            <Button
              variant="outline"
              size="sm"
              className="shrink-0"
              onClick={() => void getCoaching()}
              disabled={loading}
            >
              {loading ? (
                <>
                  <Spinner data-icon="inline-start" />
                  Thinking…
                </>
              ) : (
                <>
                  <Sparkles data-icon="inline-start" />
                  Get AI coaching
                </>
              )}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
