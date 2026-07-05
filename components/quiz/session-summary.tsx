"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { motion } from "motion/react"
import { toast } from "sonner"
import {
  BookOpen,
  Check,
  ChevronRight,
  Clock,
  Flame,
  Home,
  Minus,
  RotateCcw,
  Sparkles,
  Trophy,
  X,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"
import { useGenerationStore } from "@/lib/generation/session-generation"
import { useSessionStore } from "@/lib/store/use-session-store"
import { ApiClientError, USE_MOCKS } from "@/lib/api/client"
import { Card, CardContent } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { ProgressRing } from "@/components/ui/progress-ring"
import { Badge } from "@/components/ui/badge"
import { ConfettiBurst } from "@/components/quiz/confetti-burst"
import type { PracticeSession } from "@/types"
import {
  scoreOf,
  topicBreakdown,
  confidenceBreakdown,
} from "@/lib/session-utils"
import { resolveTopicName } from "@/lib/learning/topic-resolver"
import { questionStemText } from "@/lib/question-stem"
import { formatTime } from "@/hooks/use-stopwatch"
import { cn } from "@/lib/utils"

interface SessionSummaryProps {
  session: PracticeSession
  bestStreak?: number
}

function sessionDurationSec(session: PracticeSession): number {
  return Object.values(session.answers).reduce(
    (sum, a) => sum + (a.timeSpentSec ?? 0),
    0,
  )
}

/** End-of-session results screen with score ring and stat chips. */
export function SessionSummary({ session, bestStreak = 0 }: SessionSummaryProps) {
  const router = useRouter()
  const [repeating, setRepeating] = useState(false)
  const { correct, total, skipped, pct } = scoreOf(session)
  const breakdown = topicBreakdown(session)
  const confidence = confidenceBreakdown(session)
  const weakest = [...breakdown].sort((a, b) => a.pct - b.pct)[0]
  const flaggedCount = Object.values(session.answers).filter(
    (a) => a.markedForReview,
  ).length
  const learnSlug = weakest
    ? resolveTopicName(weakest.topic, session.examCode).slug
    : null

  const durationSec = sessionDurationSec(session)
  const answeredCount = total - skipped
  const avgSec =
    answeredCount > 0 ? Math.round(durationSec / answeredCount) : 0
  const showConfetti = pct >= 80

  /** Regenerate a fresh session with the same exam and setup, one tap. */
  async function handlePracticeAgain() {
    if (repeating) return
    setRepeating(true)
    const focusTopics = session.focusTopics.filter(
      (t) => t && t.toLowerCase() !== "mixed topics",
    )
    if (USE_MOCKS) {
      const id = await useSessionStore
        .getState()
        .startSession(session.exam, session.examCode, session.focusTopics)
      router.push(`/quiz/${id}`)
      return
    }
    const description =
      `I'm preparing for the ${session.exam} (${session.examCode}) exam.` +
      (focusTopics.length ? ` Focus on ${focusTopics.join(", ")}.` : "") +
      " Generate fresh exam-style questions — avoid repeating earlier ones."
    useGenerationStore.getState().startPracticeGeneration(
      {
        description,
        count: Math.max(session.questions.length, 5),
        exam: session.exam,
        examCode: session.examCode,
        focusTopics: focusTopics.length ? focusTopics : undefined,
        durationSec: session.durationSec,
      },
      {
        onReady: (s) => router.push(`/quiz/${s.id}`),
        onError: (err) => {
          setRepeating(false)
          toast.error(
            err instanceof ApiClientError && err.code === "FREEMIUM_LIMIT"
              ? "Daily question limit reached. Upgrade to Pro for unlimited practice."
              : err.message,
          )
        },
      },
    )
  }

  return (
    <div className="relative mx-auto flex w-full max-w-lg flex-col gap-5">
      <ConfettiBurst active={showConfetti} />

      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 200, damping: 18 }}
        className="flex flex-col items-center gap-3 pt-4 text-center"
      >
        <span className="flex size-16 items-center justify-center rounded-2xl bg-primary/15 text-primary">
          <Trophy className="size-8" />
        </span>
        <h1 className="text-2xl font-semibold tracking-tight">
          {showConfetti ? "Great work!" : "Session complete"}
        </h1>
        <p className="text-sm text-muted-foreground">
          {session.examCode} · {session.focusTopics.join(", ")}
        </p>
      </motion.div>

      <Card>
        <CardContent className="flex flex-col items-center gap-4 p-6">
          <ProgressRing value={pct} size={120} strokeWidth={12}>
            <span className="text-3xl font-semibold tabular-nums">{pct}%</span>
          </ProgressRing>
          <p className="text-sm text-muted-foreground">
            {correct} of {total} correct
            {skipped > 0 && ` · ${skipped} skipped`}
          </p>
          <div className="flex flex-wrap justify-center gap-2">
            <Badge variant="secondary" className="gap-1 tabular-nums">
              <Clock className="size-3" />
              {formatTime(durationSec)}
            </Badge>
            {avgSec > 0 && (
              <Badge variant="secondary" className="tabular-nums">
                ~{avgSec}s per Q
              </Badge>
            )}
            {bestStreak >= 2 && (
              <Badge variant="secondary" className="gap-1 tabular-nums">
                <Flame className="size-3 text-primary" />
                {bestStreak} streak
              </Badge>
            )}
          </div>
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
                <Button asChild variant="outline" size="lg" className="w-full">
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

      <Card>
        <CardContent className="flex flex-col gap-2 p-5">
          <p className="text-sm font-medium">Question recap</p>
          <div className="flex flex-col">
            {session.questions.map((q, i) => {
              const record = session.answers[q.id]
              const outcome = !record
                ? ("unanswered" as const)
                : record.skipped
                  ? ("skipped" as const)
                  : record.isCorrect
                    ? ("correct" as const)
                    : ("incorrect" as const)
              return (
                <Link
                  key={q.id}
                  href={`/history/${session.id}#q-${i}`}
                  className="group flex items-center gap-3 rounded-lg px-2 py-2 transition-colors hover:bg-secondary/50"
                >
                  <span
                    className={cn(
                      "flex size-6 shrink-0 items-center justify-center rounded-md text-[11px] font-semibold",
                      outcome === "correct" && "bg-success/15 text-success",
                      outcome === "incorrect" &&
                        "bg-destructive/15 text-destructive",
                      (outcome === "skipped" || outcome === "unanswered") &&
                        "bg-secondary text-muted-foreground",
                    )}
                  >
                    {outcome === "correct" ? (
                      <Check className="size-3.5" />
                    ) : outcome === "incorrect" ? (
                      <X className="size-3.5" />
                    ) : (
                      <Minus className="size-3.5" />
                    )}
                  </span>
                  <span className="flex min-w-0 flex-1 flex-col">
                    <span className="truncate text-sm">
                      {i + 1}. {questionStemText(q)}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {q.topic}
                      {outcome === "skipped" && " · Skipped"}
                      {outcome === "unanswered" && " · Not answered"}
                    </span>
                  </span>
                  <ChevronRight className="size-4 shrink-0 text-muted-foreground/50 transition-transform group-hover:translate-x-0.5" />
                </Link>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {confidence.rated > 0 && (
        <Card>
          <CardContent className="flex flex-col gap-3 p-5">
            <p className="text-sm font-medium">Confidence check</p>
            {confidence.overconfident > 0 ? (
              <div className="flex items-start gap-2 rounded-lg border border-warning/40 bg-warning/10 px-3 py-2.5 text-sm text-warning">
                <span>
                  You were <strong>sure but wrong</strong> on{" "}
                  {confidence.overconfident}{" "}
                  {confidence.overconfident === 1 ? "question" : "questions"} —
                  worth reviewing closely.
                </span>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                No over-confident misses — your self-assessment is well
                calibrated.
              </p>
            )}
            {confidence.lucky > 0 && (
              <p className="text-sm text-muted-foreground">
                Unsure but right on {confidence.lucky} — you know more than you
                think.
              </p>
            )}
          </CardContent>
        </Card>
      )}

      <div className="flex flex-col gap-2.5">
        <Button
          size="lg"
          className="w-full"
          onClick={() => void handlePracticeAgain()}
          disabled={repeating}
        >
          {repeating ? (
            <>
              <Spinner data-icon="inline-start" />
              Preparing a fresh session…
            </>
          ) : (
            <>
              <RotateCcw data-icon="inline-start" />
              Practice again
            </>
          )}
        </Button>
        <Button asChild size="lg" variant="secondary" className="w-full">
          <Link href={`/history/${session.id}`}>Review answers</Link>
        </Button>
        {flaggedCount > 0 && (
          <Button asChild size="lg" variant="outline" className="w-full">
            <Link href={`/history/${session.id}?filter=flagged`}>
              Flagged ({flaggedCount})
            </Link>
          </Button>
        )}
        <Button asChild size="lg" variant="outline" className="w-full">
          <Link href="/intake">
            <Sparkles data-icon="inline-start" />
            New session setup
          </Link>
        </Button>
        <Button asChild size="lg" variant="ghost" className="w-full">
          <Link href="/practice">
            <Home data-icon="inline-start" />
            Practice hub
          </Link>
        </Button>
      </div>
    </div>
  )
}
