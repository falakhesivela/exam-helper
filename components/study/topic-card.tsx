"use client"

import Link from "next/link"
import {
  BookmarkCheck,
  CheckCircle2,
  Circle,
  CircleDot,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import type { LearnTopic } from "@/types"
import { cn } from "@/lib/utils"

/** Mastery is only meaningful once the topic has actually been practiced. */
export function isAssessed(t: LearnTopic): boolean {
  return t.assessed !== false && t.questionsAnswered > 0
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

export function TopicCard({
  topic: t,
  showDomain,
}: {
  topic: LearnTopic
  showDomain: boolean
}) {
  const assessed = isAssessed(t)
  return (
    <Link href={`/study/${t.slug}`} className="block h-full">
      <Card
        className={cn(
          "h-full transition-colors hover:border-primary/40",
          assessed && t.mastery < 60 && "border-primary/20",
        )}
      >
        <CardHeader className="pb-2">
          <div className="flex items-start justify-between gap-3">
            <div className="flex flex-col gap-1">
              <CardTitle className="text-base">{t.topic}</CardTitle>
              <CardDescription className="flex flex-wrap items-center gap-2">
                <StatusIcon status={t.lessonStatus} />
                {statusLabel(t.lessonStatus)}
                {showDomain && t.domainName && (
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
                {t.hasLab && (
                  <Badge variant="outline" className="text-xs text-primary">
                    Hands-on
                  </Badge>
                )}
              </CardDescription>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              {t.bookmarked && (
                <BookmarkCheck className="size-4 text-primary" aria-label="Bookmarked" />
              )}
              {assessed ? (
                <span className="text-sm font-medium text-muted-foreground">
                  {t.mastery}%
                </span>
              ) : (
                <Badge variant="outline" className="text-xs font-normal">
                  New
                </Badge>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="flex flex-col gap-2">
          {assessed ? (
            <>
              <Progress value={t.mastery} className="h-1.5" />
              <p className="text-xs text-muted-foreground">
                {t.questionsAnswered} questions answered
              </p>
            </>
          ) : (
            <p className="text-xs text-muted-foreground">
              Not practiced yet — start with the lesson
            </p>
          )}
        </CardContent>
      </Card>
    </Link>
  )
}
