"use client"

import Link from "next/link"
import { BookOpen, CheckCircle2, Circle, Loader2 } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import type { LearnTopic } from "@/types"
import { cn } from "@/lib/utils"

interface LearnHubProps {
  topics: LearnTopic[]
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
    return <Loader2 className="size-4 text-primary" />
  }
  return <Circle className="size-4 text-muted-foreground" />
}

/** Lists weak topics with mastery and lesson progress. */
export function LearnHub({ topics }: LearnHubProps) {
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
    <div className="flex flex-col gap-3">
      {topics.map((t) => (
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
                  <CardDescription className="flex items-center gap-2">
                    <StatusIcon status={t.lessonStatus} />
                    {statusLabel(t.lessonStatus)}
                    {t.hasAiContent && (
                      <Badge variant="secondary" className="text-xs">
                        AI lesson
                      </Badge>
                    )}
                  </CardDescription>
                </div>
                <span className="text-sm font-medium text-muted-foreground">
                  {t.mastery}%
                </span>
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
  )
}
