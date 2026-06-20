"use client"

import Link from "next/link"
import { motion } from "motion/react"
import { BookOpen, Home, RotateCcw, Trophy } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import type { PracticeSession } from "@/types"
import { scoreOf, topicBreakdown } from "@/lib/session-utils"
import { resolveTopicName } from "@/lib/learning/topic-resolver"

interface SessionSummaryProps {
  session: PracticeSession
}

/** End-of-session results screen with score and per-topic breakdown. */
export function SessionSummary({ session }: SessionSummaryProps) {
  const { correct, total, pct } = scoreOf(session)
  const breakdown = topicBreakdown(session)
  const weakest = [...breakdown].sort((a, b) => a.pct - b.pct)[0]
  const flaggedCount = Object.values(session.answers).filter(
    (a) => a.markedForReview,
  ).length
  const learnSlug = weakest
    ? resolveTopicName(weakest.topic, session.examCode).slug
    : null

  return (
    <div className="mx-auto flex w-full max-w-lg flex-col gap-5">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 200, damping: 18 }}
        className="flex flex-col items-center gap-3 pt-4 text-center"
      >
        <span className="flex size-16 items-center justify-center rounded-2xl bg-primary/15 text-primary">
          <Trophy className="size-8" />
        </span>
        <h1 className="text-2xl font-semibold tracking-tight">Session complete</h1>
        <p className="text-sm text-muted-foreground">
          {session.examCode} · {session.focusTopics.join(", ")}
        </p>
      </motion.div>

      <Card>
        <CardContent className="flex flex-col items-center gap-2 p-6">
          <p className="text-5xl font-semibold tracking-tight">{pct}%</p>
          <p className="text-sm text-muted-foreground">
            {correct} of {total} correct
          </p>
          <Progress value={pct} className="mt-2 h-2" />
        </CardContent>
      </Card>

      <Card>
        <CardContent className="flex flex-col gap-4 p-5">
          <p className="text-sm font-medium">Topic breakdown</p>
          {breakdown.map((t) => (
            <div key={t.topic} className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between text-sm">
                <span>{t.topic}</span>
                <span className="text-muted-foreground">
                  {t.correct}/{t.total}
                </span>
              </div>
              <Progress value={t.pct} className="h-1.5" />
            </div>
          ))}
          {weakest && weakest.pct < 100 && (
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-2 rounded-lg bg-secondary/50 px-3 py-2.5 text-sm">
                <Badge variant="secondary">Focus next</Badge>
                <span className="text-muted-foreground">
                  Revisit <span className="text-foreground">{weakest.topic}</span>
                </span>
              </div>
              {learnSlug && (
                <Button asChild variant="outline" size="sm" className="w-full">
                  <Link href={`/learn/${learnSlug}`}>
                    <BookOpen data-icon="inline-start" />
                    Study {weakest.topic}
                  </Link>
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <div className="flex flex-col gap-2.5 sm:flex-row">
        <Button asChild size="lg" className="flex-1">
          <Link href="/intake">
            <RotateCcw data-icon="inline-start" />
            New session
          </Link>
        </Button>
        <Button asChild size="lg" variant="secondary" className="flex-1">
          <Link href={`/history/${session.id}`}>Review answers</Link>
        </Button>
        {flaggedCount > 0 && (
          <Button asChild size="lg" variant="outline" className="flex-1">
            <Link href={`/history/${session.id}?filter=flagged`}>
              Flagged ({flaggedCount})
            </Link>
          </Button>
        )}
        <Button asChild size="lg" variant="ghost" className="flex-1">
          <Link href="/dashboard">
            <Home data-icon="inline-start" />
            Dashboard
          </Link>
        </Button>
      </div>
    </div>
  )
}
