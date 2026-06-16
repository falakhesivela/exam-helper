"use client"

import Link from "next/link"
import { Calendar, ChevronRight, ListChecks } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from "@/components/ui/empty"
import { Button } from "@/components/ui/button"
import { useSessionStore } from "@/lib/store/use-session-store"
import { scoreOf } from "@/lib/session-utils"

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  })
}

export function HistoryList() {
  const sessions = useSessionStore((s) => s.sessions)
  const completed = sessions.filter((s) => s.status === "completed")

  if (completed.length === 0) {
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
                    {formatDate(s.createdAt)}
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
  )
}
