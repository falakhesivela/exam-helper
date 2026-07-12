"use client"

import { useEffect, useRef, useState } from "react"
import Link from "next/link"
import { GraduationCap, Lightbulb, Lock } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { api } from "@/lib/api/client"
import { useSessionStore } from "@/lib/store/use-session-store"
import type { ExamDebrief } from "@/types"

interface AiDebriefProps {
  sessionId: string
}

/**
 * Examiner's debrief: a short AI verdict with the top study priorities.
 * Paid tiers only — free users see what they're missing with an upgrade path.
 */
export function AiDebrief({ sessionId }: AiDebriefProps) {
  const plan = useSessionStore((s) => s.profile.plan)
  const isPaid = plan === "pro" || plan === "exam_pass"
  const [debrief, setDebrief] = useState<ExamDebrief | null>(null)
  const [failed, setFailed] = useState(false)
  const requested = useRef(false)

  useEffect(() => {
    if (!isPaid || requested.current) return
    requested.current = true
    api
      .examDebrief(sessionId)
      .then((res) => setDebrief(res.debrief))
      .catch(() => setFailed(true))
  }, [isPaid, sessionId])

  if (!isPaid) {
    return (
      <Card className="border-primary/30">
        <CardContent className="flex flex-col gap-3 p-5">
          <p className="flex items-center gap-2 text-sm font-medium">
            <GraduationCap className="size-4 text-primary" />
            Examiner&apos;s debrief
            <Lock className="size-3.5 text-muted-foreground" />
          </p>
          <p className="text-sm text-muted-foreground">
            Pro members get a personalized examiner&apos;s verdict after every
            mock: what sank this attempt, the three highest-impact things to
            study next, and an exam-day tactic based on your pacing.
          </p>
          <Button asChild size="sm" className="self-start">
            <Link href="/upgrade">Unlock with Pro</Link>
          </Button>
        </CardContent>
      </Card>
    )
  }

  if (failed) return null

  return (
    <Card className="border-primary/30">
      <CardContent className="flex flex-col gap-3 p-5">
        <p className="flex items-center gap-2 text-sm font-medium">
          <GraduationCap className="size-4 text-primary" />
          Examiner&apos;s debrief
        </p>
        {!debrief ? (
          <div className="flex flex-col gap-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-5/6" />
            <Skeleton className="h-4 w-2/3" />
          </div>
        ) : (
          <>
            <p className="text-sm leading-relaxed">{debrief.summary}</p>
            {debrief.topPriorities.length > 0 && (
              <ol className="flex list-decimal flex-col gap-1.5 pl-5 text-sm">
                {debrief.topPriorities.map((priority) => (
                  <li key={priority}>{priority}</li>
                ))}
              </ol>
            )}
            <p className="flex items-start gap-2 rounded-lg bg-secondary/40 p-3 text-sm">
              <Lightbulb className="mt-0.5 size-4 shrink-0 text-chart-3" />
              <span>{debrief.examDayTip}</span>
            </p>
          </>
        )}
      </CardContent>
    </Card>
  )
}
