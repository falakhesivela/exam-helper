"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { AnimatePresence, motion } from "motion/react"
import {
  ArrowRight,
  Bookmark,
  BookmarkCheck,
  Clock,
  SkipForward,
  X,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { OptionCard } from "@/components/quiz/option-card"
import { ExplanationPanel } from "@/components/quiz/explanation-panel"
import { SessionSummary } from "@/components/quiz/session-summary"
import { LoadingScreen } from "@/components/ui/loading-screen"
import { Spinner } from "@/components/ui/spinner"
import { GenerationStatusBanner } from "@/components/generation/generation-tracker"
import { useSessionStore } from "@/lib/store/use-session-store"
import { api, USE_MOCKS } from "@/lib/api/client"
import { useSessionSync } from "@/hooks/use-session-sync"
import { formatTime, useStopwatch } from "@/hooks/use-stopwatch"
import type { PracticeSession } from "@/types"
import { cn } from "@/lib/utils"

interface QuizRunnerProps {
  sessionId: string
}

export function QuizRunner({ sessionId }: QuizRunnerProps) {
  const router = useRouter()
  const session = useSessionStore((s) => s.getSession(sessionId))
  const answerQuestion = useSessionStore((s) => s.answerQuestion)
  const toggleMarkForReview = useSessionStore((s) => s.toggleMarkForReview)
  const skipQuestion = useSessionStore((s) => s.skipQuestion)
  const goToIndex = useSessionStore((s) => s.goToIndex)
  const completeSession = useSessionStore((s) => s.completeSession)
  const [loading, setLoading] = useState(!session && !USE_MOCKS)

  const { pollNow, expectedTotal, availableCount, generationFailed } =
    useSessionSync(sessionId, session)

  useEffect(() => {
    if (session || USE_MOCKS) return
    void api
      .getSession(sessionId)
      .then((s) => {
        useSessionStore.setState((state) => ({
          sessions: state.sessions.some((x) => x.id === s.id)
            ? state.sessions.map((x) => (x.id === s.id ? s : x))
            : [s, ...state.sessions],
        }))
      })
      .catch(() => undefined)
      .finally(() => setLoading(false))
  }, [session, sessionId])

  if (loading) {
    return <LoadingScreen message="Loading session…" />
  }

  if (!session) {
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center gap-3 p-6 text-center">
        <p className="text-lg font-medium">Session not found</p>
        <Button onClick={() => router.push("/intake")}>Start a new session</Button>
      </div>
    )
  }

  if (generationFailed) {
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center gap-3 p-6 text-center">
        <p className="text-lg font-medium">Question generation failed</p>
        <p className="text-sm text-muted-foreground">
          Something went wrong while creating your session.
        </p>
        <Button onClick={() => router.push("/intake")}>Start a new session</Button>
      </div>
    )
  }

  if (session.questions.length === 0 && session.generationStatus === "generating") {
    return <LoadingScreen message="Preparing first question…" />
  }

  return (
    <>
      <GenerationStatusBanner sessionId={sessionId} />
      <QuizRunnerInner
        key={session.id}
        session={session}
        expectedTotal={expectedTotal}
        availableCount={availableCount}
        pollNow={pollNow}
        onAnswer={answerQuestion}
        onMark={toggleMarkForReview}
        onSkip={skipQuestion}
        onGoTo={goToIndex}
        onComplete={completeSession}
        onExit={() => router.push("/dashboard")}
      />
    </>
  )
}

interface InnerProps {
  session: PracticeSession
  expectedTotal: number
  availableCount: number
  pollNow: () => Promise<PracticeSession | undefined>
  onAnswer: (
    sessionId: string,
    questionId: string,
    selected: string[],
    time: number,
  ) => Promise<{ isCorrect: boolean }>
  onMark: (sessionId: string, questionId: string) => Promise<void>
  onSkip: (sessionId: string, questionId: string) => Promise<void>
  onGoTo: (sessionId: string, index: number) => Promise<void>
  onComplete: (sessionId: string) => Promise<void>
  onExit: () => void
}

function QuizRunnerInner({
  session,
  expectedTotal,
  availableCount,
  pollNow,
  onAnswer,
  onMark,
  onSkip,
  onGoTo,
  onComplete,
  onExit,
}: InnerProps) {
  const [index, setIndex] = useState(() => {
    const start = session.currentIndex ?? 0
    // Clamp to a valid question index — a session whose `currentIndex` has
    // reached the end (e.g. an already-completed session) would otherwise
    // index past the array and crash.
    return Math.min(Math.max(start, 0), Math.max(session.questions.length - 1, 0))
  })
  const [selected, setSelected] = useState<string[]>([])
  const [revealed, setRevealed] = useState(false)
  const [answerCorrect, setAnswerCorrect] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [skipping, setSkipping] = useState(false)
  const [marking, setMarking] = useState(false)
  const [advancing, setAdvancing] = useState(false)
  const [waitingForNext, setWaitingForNext] = useState(false)
  const [finished, setFinished] = useState(false)
  const { seconds, reset } = useStopwatch(!finished)

  const busy = submitting || skipping || marking || advancing || waitingForNext

  const question = session.questions[index]
  const total = Math.max(expectedTotal, availableCount, session.questions.length)
  const progress = ((index + (revealed ? 1 : 0)) / total) * 100
  const marked = session.answers[question?.id]?.markedForReview ?? false

  const correct = answerCorrect

  if (!question && session.generationStatus === "generating") {
    return <LoadingScreen message="Preparing next question…" />
  }

  if (finished || (!question && session.generationStatus === "complete")) {
    return (
      <div className="min-h-dvh px-4 py-8">
        <SessionSummary session={session} />
      </div>
    )
  }

  function toggleOption(optionId: string) {
    if (revealed) return
    setSelected((prev) => {
      if (question.multiSelect) {
        return prev.includes(optionId)
          ? prev.filter((id) => id !== optionId)
          : [...prev, optionId]
      }
      return [optionId]
    })
  }

  async function handleSubmit() {
    if (selected.length === 0 || submitting) return
    setSubmitting(true)
    try {
      const result = await onAnswer(session.id, question.id, selected, seconds)
      setAnswerCorrect(result.isCorrect)
      setRevealed(true)
    } finally {
      setSubmitting(false)
    }
  }

  async function advance() {
    setAdvancing(true)
    try {
      if (index + 1 >= total) {
        await onComplete(session.id)
        setFinished(true)
        return
      }

      if (index + 1 >= availableCount) {
        setWaitingForNext(true)
        try {
          let fresh = await pollNow()
          let attempts = 0
          while (
            fresh &&
            fresh.questions.length <= index + 1 &&
            fresh.generationStatus === "generating" &&
            attempts < 12
          ) {
            await new Promise((r) => setTimeout(r, 2000))
            fresh = await pollNow()
            attempts += 1
          }
          if (!fresh || fresh.questions.length <= index + 1) {
            return
          }
        } finally {
          setWaitingForNext(false)
        }
      }

      const next = index + 1
      const latest = useSessionStore.getState().getSession(session.id)
      if (!latest || latest.questions.length <= next) {
        return
      }

      // Clear feedback state before switching questions — option ids (a–d) repeat
      // across questions, and awaiting onGoTo would otherwise flash stale styling.
      setSelected([])
      setRevealed(false)
      setAnswerCorrect(false)
      setIndex(next)
      reset()
      await onGoTo(session.id, next)
    } finally {
      setAdvancing(false)
    }
  }

  async function handleSkip() {
    if (skipping || busy) return
    setSkipping(true)
    try {
      await onSkip(session.id, question.id)
      await advance()
    } finally {
      setSkipping(false)
    }
  }

  async function handleMark() {
    if (marking || busy) return
    setMarking(true)
    try {
      await onMark(session.id, question.id)
    } finally {
      setMarking(false)
    }
  }

  return (
    <div className="flex min-h-dvh flex-col">
      {/* Focus-mode header */}
      <header className="sticky top-0 z-10 border-b border-border bg-background/85 backdrop-blur-lg">
        <div className="mx-auto flex max-w-2xl items-center gap-3 px-4 py-3">
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="ghost" size="icon" aria-label="Exit session">
                <X />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Leave this session?</AlertDialogTitle>
                <AlertDialogDescription>
                  Your progress so far is saved, but the session will be left
                  incomplete.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Keep going</AlertDialogCancel>
                <AlertDialogAction onClick={onExit}>Leave</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

          <div className="flex flex-1 flex-col gap-1.5">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>
                Question {index + 1} of {total}
              </span>
              <span className="flex items-center gap-1 tabular-nums">
                <Clock className="size-3.5" />
                {formatTime(seconds)}
              </span>
            </div>
            <Progress value={progress} className="h-1.5" />
          </div>

          <Button
            variant="ghost"
            size="icon"
            aria-label={marked ? "Unmark for review" : "Mark for review"}
            aria-pressed={marked}
            onClick={handleMark}
            disabled={marking || busy}
            className={cn(marked && "text-primary")}
          >
            {marking ? <Spinner /> : marked ? <BookmarkCheck /> : <Bookmark />}
          </Button>
        </div>
      </header>

      {/* Question body */}
      <div className="relative mx-auto flex w-full max-w-2xl flex-1 flex-col gap-5 px-4 py-6">
        {submitting && (
          <div
            className="absolute inset-0 z-10 flex items-center justify-center rounded-xl bg-background/60 backdrop-blur-[1px]"
            aria-live="polite"
            aria-busy="true"
          >
            <div className="flex items-center gap-2 rounded-lg border border-border bg-card px-4 py-2.5 text-sm font-medium shadow-sm">
              <Spinner />
              Checking your answer…
            </div>
          </div>
        )}
        <AnimatePresence mode="wait">
          <motion.div
            key={question.id}
            initial={{ opacity: 0, x: 24 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -24 }}
            transition={{ duration: 0.25 }}
            className="flex flex-col gap-5"
          >
            <div className="flex flex-col gap-3">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="secondary">{question.topic}</Badge>
                <Badge variant="outline" className="capitalize">
                  {question.difficulty}
                </Badge>
                {question.multiSelect && (
                  <Badge variant="outline">Select all that apply</Badge>
                )}
              </div>
              <h1 className="text-balance text-xl font-medium leading-relaxed sm:text-2xl">
                {question.prompt}
              </h1>
            </div>

            <div className="flex flex-col gap-2.5">
              {question.options.map((option, i) => (
                <OptionCard
                  key={`${question.id}-${option.id}`}
                  option={option}
                  index={i}
                  selected={selected.includes(option.id)}
                  revealed={revealed}
                  isCorrect={question.correctOptionIds.includes(option.id)}
                  multiSelect={question.multiSelect}
                  disabled={revealed || busy}
                  onToggle={() => toggleOption(option.id)}
                />
              ))}
            </div>

            {revealed && (
              <ExplanationPanel question={question} isCorrect={correct} />
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Sticky action footer */}
      <footer className="sticky bottom-0 border-t border-border bg-background/90 pb-[env(safe-area-inset-bottom)] backdrop-blur-lg">
        <div className="mx-auto flex max-w-2xl items-center gap-3 px-4 py-3">
          {!revealed ? (
            <>
              <Button
                variant="ghost"
                size="lg"
                onClick={handleSkip}
                disabled={busy}
                className="text-muted-foreground"
              >
                {skipping ? (
                  <Spinner data-icon="inline-start" />
                ) : (
                  <SkipForward data-icon="inline-start" />
                )}
                {skipping ? "Skipping…" : "Skip"}
              </Button>
              <Button
                size="lg"
                className="flex-1"
                disabled={selected.length === 0 || busy}
                onClick={handleSubmit}
              >
                {submitting ? (
                  <>
                    <Spinner data-icon="inline-start" />
                    Checking…
                  </>
                ) : (
                  "Check answer"
                )}
              </Button>
            </>
          ) : (
            <Button
              size="lg"
              className="flex-1"
              onClick={() => void advance()}
              disabled={advancing}
              autoFocus
            >
              {advancing || waitingForNext ? (
                <>
                  <Spinner data-icon="inline-start" />
                  {waitingForNext
                    ? "Preparing next question…"
                    : index + 1 >= total
                      ? "Finishing…"
                      : "Loading…"}
                </>
              ) : (
                <>
                  {index + 1 >= total ? "Finish session" : "Next question"}
                  <ArrowRight data-icon="inline-end" />
                </>
              )}
            </Button>
          )}
        </div>
      </footer>
    </div>
  )
}
