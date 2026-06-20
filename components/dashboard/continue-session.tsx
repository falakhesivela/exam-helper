"use client"

import Link from "next/link"
import { AlarmClock, ChevronRight, PlayCircle } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import type { PracticeSession } from "@/types"

interface ContinueSessionProps {
  sessions: PracticeSession[]
}

function sessionHref(session: PracticeSession) {
  return session.mode === "exam" ? `/exam/${session.id}` : `/quiz/${session.id}`
}

function progressLabel(session: PracticeSession) {
  const total = Math.max(
    session.expectedQuestionCount ?? 0,
    session.questions.length,
  )
  const answered = Object.values(session.answers).filter(
    (a) =>
      a.selectedOptionIds.length > 0 ||
      a.dragAnswer != null ||
      a.skipped,
  ).length
  const position = Math.min(session.currentIndex + 1, total || session.questions.length)
  return { answered, total, position }
}

/** Surfaces in-progress practice and exam sessions with a continue CTA. */
export function ContinueSession({ sessions }: ContinueSessionProps) {
  const active = sessions
    .filter((s) => s.status === "in-progress")
    .sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    )
    .slice(0, 3)

  if (active.length === 0) return null

  return (
    <Card className="border-primary/25 bg-primary/5">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <PlayCircle className="size-4 text-primary" />
          Continue where you left off
        </CardTitle>
        <CardDescription>
          Pick up an in-progress session — your answers are saved.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-2 p-0 pb-2">
        {active.map((s) => {
          const { answered, total, position } = progressLabel(s)
          const pct = total > 0 ? Math.round((answered / total) * 100) : 0
          const isExam = s.mode === "exam"
          const stillGenerating = s.generationStatus === "generating"

          return (
            <Link
              key={s.id}
              href={sessionHref(s)}
              className="flex items-center gap-3 border-t border-border/60 px-6 py-3.5 transition-colors first:border-t-0 hover:bg-background/60"
            >
              <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-background text-primary">
                {isExam ? (
                  <AlarmClock className="size-4.5" />
                ) : (
                  <PlayCircle className="size-4.5" />
                )}
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="truncate text-sm font-medium">
                    {s.examCode} · {s.focusTopics.slice(0, 2).join(", ")}
                  </p>
                  <Badge variant="outline" className="text-[10px]">
                    {isExam ? "Exam" : "Practice"}
                  </Badge>
                  {stillGenerating && (
                    <Badge variant="secondary" className="text-[10px]">
                      Generating…
                    </Badge>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  Question {position}
                  {total > 0 ? ` of ${total}` : ""}
                  {answered > 0 ? ` · ${answered} answered` : ""}
                </p>
                {total > 0 && (
                  <Progress value={pct} className="mt-2 h-1" />
                )}
              </div>
              <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
            </Link>
          )
        })}
      </CardContent>
    </Card>
  )
}
