"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import { BookOpen, BookmarkCheck, CheckCircle2, Circle, CircleDot } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import type { LearnTopic } from "@/types"
import { cn } from "@/lib/utils"

interface LearnHubProps {
  topics: LearnTopic[]
}

type TopicFilter = "all" | "in-progress" | "bookmarked" | "completed"

const FILTERS: { value: TopicFilter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "in-progress", label: "In progress" },
  { value: "bookmarked", label: "Bookmarked" },
  { value: "completed", label: "Completed" },
]

function matchesFilter(topic: LearnTopic, filter: TopicFilter): boolean {
  switch (filter) {
    case "in-progress":
      return topic.lessonStatus === "started"
    case "bookmarked":
      return topic.bookmarked
    case "completed":
      return topic.lessonStatus === "completed"
    default:
      return true
  }
}

function statusLabel(status: LearnTopic["lessonStatus"]) {
  switch (status) {
    case "completed":
      return "Completed"
    case "started":
      return "In progress"
    default:
      return "Not started"
  }
}

function StatusIcon({ status }: { status: LearnTopic["lessonStatus"] }) {
  if (status === "completed") {
    return <CheckCircle2 className="size-4 text-success" />
  }
  if (status === "started") {
    return <CircleDot className="size-4 text-primary" />
  }
  return <Circle className="size-4 text-muted-foreground" />
}

/** Lists weak topics with mastery and lesson progress. */
export function LearnHub({ topics }: LearnHubProps) {
  const [filter, setFilter] = useState<TopicFilter>("all")

  const filtered = useMemo(
    () => topics.filter((t) => matchesFilter(t, filter)),
    [topics, filter],
  )

  if (topics.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center gap-4 py-12 text-center">
          <BookOpen className="size-10 text-muted-foreground" />
          <div className="flex flex-col gap-1">
            <p className="font-medium">No topics yet</p>
            <p className="text-sm text-muted-foreground text-pretty">
              Complete a practice session to unlock personalized lessons for
              your weak areas.
            </p>
          </div>
          <Link
            href="/intake"
            className="text-sm font-medium text-primary hover:underline"
          >
            Start practicing
          </Link>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap gap-2" role="group" aria-label="Filter topics">
        {FILTERS.map((f) => (
          <button
            key={f.value}
            type="button"
            onClick={() => setFilter(f.value)}
            aria-pressed={filter === f.value}
            className={cn(
              "rounded-full border px-3 py-1 text-xs font-medium transition-colors",
              filter === f.value
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border bg-card text-muted-foreground hover:text-foreground",
            )}
          >
            {f.label}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center text-sm text-muted-foreground">
            {filter === "bookmarked"
              ? "No bookmarked lessons yet. Bookmark a lesson to find it here."
              : filter === "completed"
                ? "No completed lessons yet."
                : "No lessons in progress."}
          </CardContent>
        </Card>
      ) : (
        <div className="flex flex-col gap-3">
          {filtered.map((t) => (
            <Link key={t.slug} href={`/learn/${t.slug}`}>
              <Card
                className={cn(
                  "transition-colors hover:border-primary/40",
                  t.mastery < 60 && "border-primary/20",
                )}
              >
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex flex-col gap-1">
                      <CardTitle className="text-base">{t.topic}</CardTitle>
                      <CardDescription className="flex flex-wrap items-center gap-2">
                        <StatusIcon status={t.lessonStatus} />
                        {statusLabel(t.lessonStatus)}
                        {t.domainName && (
                          <Badge variant="outline" className="text-xs">
                            {t.domainName}
                            {t.domainWeight ? ` · ${t.domainWeight}` : ""}
                          </Badge>
                        )}
                        {t.hasAiContent && (
                          <Badge variant="secondary" className="text-xs">
                            AI lesson
                          </Badge>
                        )}
                      </CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                      {t.bookmarked && (
                        <BookmarkCheck
                          className="size-4 text-primary"
                          aria-label="Bookmarked"
                        />
                      )}
                      <span className="text-sm font-medium text-muted-foreground">
                        {t.mastery}%
                      </span>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="flex flex-col gap-2">
                  <Progress value={t.mastery} className="h-1.5" />
                  <p className="text-xs text-muted-foreground">
                    {t.questionsAnswered} questions answered
                  </p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
