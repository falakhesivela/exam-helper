"use client"

import Link from "next/link"
import { Calendar, ChevronRight, Clock, ListChecks } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { CardSkeleton } from "@/components/ui/card-skeleton"
import { Badge } from "@/components/ui/badge"
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from "@/components/ui/empty"
import { Button } from "@/components/ui/button"
import { useSessionStore } from "@/lib/store/use-session-store"
import { scoreOf } from "@/lib/session-utils"
import { examDeadlineMs } from "@/hooks/use-exam-state"
import { formatClock } from "@/hooks/use-countdown"

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  })
}

export function HistoryList() {
  const dataReady = useSessionStore((s) => s.dataReady)
  const sessions = useSessionStore((s) => s.sessions)
  const inProgress = sessions
    .filter((s) => s.status === "in-progress")
    .sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    )
  const completed = sessions
    .filter((s) => s.status === "completed")
    .sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    )

  // Session list still streaming in — don't flash the empty state.
  if (!dataReady && completed.length === 0 && inProgress.length === 0) {
    return (
      <div className="flex flex-col gap-3">
        <CardSkeleton rows={2} />
        <CardSkeleton rows={2} />
        <CardSkeleton rows={2} />
      </div>
    )
  }

  if (completed.length === 0 && inProgress.length === 0) {
    return (
      <Empty className="rounded-2xl border border-border py-12">
        <EmptyHeader>
          <EmptyTitle>No past sessions</EmptyTitle>
          <EmptyDescription>
            Complete a practice session to review your questions here.
          </EmptyDescription>
        </EmptyHeader>
        <Button asChild className="mt-2">
          <Link href="/intake">Start practicing</Link>
        </Button>
      </Empty>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      {inProgress.length > 0 && (
        <div className="flex flex-col gap-2">
          <h2 className="text-sm font-medium text-muted-foreground">
            In progress
          </h2>
          <div className="flex flex-col gap-3">
            {inProgress.map((s) => {
              const href =
                s.mode === "exam" ? `/exam/${s.id}` : `/quiz/${s.id}`
              const total = Math.max(
                s.expectedQuestionCount ?? 0,
                s.questions.length,
              )
              // Live exam clock: started mocks keep counting down while away.
              const deadline = s.mode === "exam" ? examDeadlineMs(s) : null
              const remainingSec =
                deadline != null
                  ? Math.max(0, Math.round((deadline - Date.now()) / 1000))
                  : null
              return (
                <Link key={s.id} href={href}>
                  <Card className="border-primary/30 transition-colors hover:border-primary/50">
                    <CardContent className="flex items-center gap-4 p-4">
                      <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                        <ListChecks className="size-5" />
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-medium">{s.examCode}</p>
                        <p className="truncate text-sm text-muted-foreground">
                          {s.focusTopics.join(", ")}
                        </p>
                        <p className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                          <span>
                            Continue · question {s.currentIndex + 1}
                            {total > 0 ? ` of ${total}` : ""}
                          </span>
                          {remainingSec != null && (
                            <span
                              className={
                                remainingSec <= 300
                                  ? "flex items-center gap-1 font-medium text-destructive"
                                  : "flex items-center gap-1"
                              }
                            >
                              <Clock className="size-3" />
                              {remainingSec > 0
                                ? `${formatClock(remainingSec)} left`
                                : "Time expired"}
                            </span>
                          )}
                        </p>
                      </div>
                      <Badge variant="outline">Resume</Badge>
                      <ChevronRight className="size-4 text-muted-foreground" />
                    </CardContent>
                  </Card>
                </Link>
              )
            })}
          </div>
        </div>
      )}

      {completed.length > 0 && (
        <div className="flex flex-col gap-2">
          {inProgress.length > 0 && (
            <h2 className="text-sm font-medium text-muted-foreground">
              Completed
            </h2>
          )}
          <div className="flex flex-col gap-3">
            {completed.map((s) => {
        const { correct, total, pct } = scoreOf(s)
        return (
          <Link key={s.id} href={`/history/${s.id}`}>
            <Card className="transition-colors hover:border-primary/40">
              <CardContent className="flex items-center gap-4 p-4">
                <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-secondary text-primary">
                  <ListChecks className="size-5" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium">{s.examCode}</p>
                  <p className="truncate text-sm text-muted-foreground">
                    {s.focusTopics.join(", ")}
                  </p>
                  <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                    <Calendar className="size-3" />
                    {/* Locale/timezone formatting differs between the SSR
                        pass and the browser — this text may legitimately
                        change on hydration. */}
                    <span suppressHydrationWarning>
                      {formatDate(s.createdAt)}
                    </span>
                  </p>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <Badge variant={pct >= 70 ? "default" : "secondary"}>{pct}%</Badge>
                  <span className="text-xs text-muted-foreground">
                    {correct}/{total}
                  </span>
                </div>
                <ChevronRight className="size-4 text-muted-foreground" />
              </CardContent>
            </Card>
          </Link>
        )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
