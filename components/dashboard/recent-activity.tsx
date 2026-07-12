"use client"

import Link from "next/link"
import { CheckCircle2, ChevronRight } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from "@/components/ui/empty"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import type { PracticeSession } from "@/types"
import { scoreOf } from "@/lib/session-utils"
import { useSessionStore } from "@/lib/store/use-session-store"

interface RecentActivityProps {
  sessions: PracticeSession[]
}

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime()
  const days = Math.floor(diff / (24 * 60 * 60 * 1000))
  if (days <= 0) return "Today"
  if (days === 1) return "Yesterday"
  return `${days} days ago`
}

/** Recent completed sessions with their scores. */
export function RecentActivity({ sessions }: RecentActivityProps) {
  const dataReady = useSessionStore((s) => s.dataReady)
  const recent = sessions.filter((s) => s.status === "completed").slice(0, 4)

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent activity</CardTitle>
        <CardDescription>Your latest practice sessions</CardDescription>
      </CardHeader>
      <CardContent className="p-0">
        {recent.length === 0 && !dataReady ? (
          <div className="flex flex-col gap-3 px-6 pb-6">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        ) : recent.length === 0 ? (
          <Empty className="py-8">
            <EmptyHeader>
              <EmptyTitle>No sessions yet</EmptyTitle>
              <EmptyDescription>Start practicing to see your history here.</EmptyDescription>
            </EmptyHeader>
          </Empty>
        ) : (
          <ul className="flex flex-col">
            {recent.map((s) => {
              const { correct, total, pct } = scoreOf(s)
              return (
                <li key={s.id}>
                  <Link
                    href={`/history/${s.id}`}
                    className="flex items-center gap-3 border-t border-border px-6 py-3.5 transition-colors first:border-t-0 hover:bg-secondary/50"
                  >
                    <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-secondary text-primary">
                      <CheckCircle2 className="size-4.5" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">
                        {s.examCode} · {s.focusTopics.join(", ")}
                      </p>
                      <p className="text-xs text-muted-foreground">{timeAgo(s.createdAt)}</p>
                    </div>
                    <Badge variant={pct >= 70 ? "default" : "secondary"}>
                      {correct}/{total}
                    </Badge>
                    <ChevronRight className="size-4 text-muted-foreground" />
                  </Link>
                </li>
              )
            })}
          </ul>
        )}
      </CardContent>
    </Card>
  )
}
