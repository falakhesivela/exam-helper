"use client"

import { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { AnimatePresence, motion } from "motion/react"
import {
  ArrowLeft,
  ArrowRight,
  Clock,
  Flag,
  LayoutGrid,
  X,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
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
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { OptionCard } from "@/components/quiz/option-card"
import { ExamSummary } from "@/components/exam/exam-summary"
import { LoadingScreen } from "@/components/ui/loading-screen"
import { Spinner } from "@/components/ui/spinner"
import { GenerationStatusBanner } from "@/components/generation/generation-tracker"
import { useSessionStore } from "@/lib/store/use-session-store"
import { api, USE_MOCKS } from "@/lib/api/client"
import { useSessionSync } from "@/hooks/use-session-sync"
import { useCountdown, formatClock } from "@/hooks/use-countdown"
import type { PracticeSession } from "@/types"
import { cn } from "@/lib/utils"

interface ExamRunnerProps {
  sessionId: string
}

export function ExamRunner({ sessionId }: ExamRunnerProps) {
  const router = useRouter()
  const session = useSessionStore((s) => s.getSession(sessionId))
  const submitExam = useSessionStore((s) => s.submitExam)
  const [loading, setLoading] = useState(!session && !USE_MOCKS)

  const { expectedTotal, availableCount, generationFailed, isGenerating } =
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
    return <LoadingScreen message="Loading exam…" />
  }

  if (!session) {
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center gap-3 p-6 text-center">
        <p className="text-lg font-medium">Exam not found</p>
        <Button onClick={() => router.push("/exam")}>Set up a new exam</Button>
      </div>
    )
  }

  if (generationFailed) {
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center gap-3 p-6 text-center">
        <p className="text-lg font-medium">Exam generation failed</p>
        <Button onClick={() => router.push("/exam")}>Set up a new exam</Button>
      </div>
    )
  }

  if (session.questions.length === 0 && isGenerating) {
    return <LoadingScreen message="Preparing first question…" />
  }

  return (
    <>
      <GenerationStatusBanner sessionId={sessionId} />
      <ExamRunnerInner
        key={session.id}
        session={session}
        expectedTotal={expectedTotal}
        availableCount={availableCount}
        isGenerating={isGenerating}
        onSubmit={submitExam}
        onExit={() => router.push("/dashboard")}
      />
    </>
  )
}

interface InnerProps {
  session: PracticeSession
  expectedTotal: number
  availableCount: number
  isGenerating: boolean
  onSubmit: (
    sessionId: string,
    answers: Record<string, string[]>,
    timeUsedSec: number,
  ) => Promise<void>
  onExit: () => void
}

function ExamRunnerInner({
  session,
  expectedTotal,
  availableCount,
  isGenerating,
  onSubmit,
  onExit,
}: InnerProps) {
  const total = Math.max(expectedTotal, availableCount, session.questions.length)
  const durationSec = session.durationSec ?? 30 * 60
  const canSubmit = !isGenerating && availableCount >= expectedTotal

  const [index, setIndex] = useState(0)
  const [answers, setAnswers] = useState<Record<string, string[]>>({})
  const [flagged, setFlagged] = useState<Set<string>>(new Set())
  const [submitted, setSubmitted] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [navOpen, setNavOpen] = useState(false)

  const remaining = useCountdown(durationSec, !submitted && !submitting, () => {
    void handleSubmit()
  })

  const question = session.questions[index]
  const selected = answers[question?.id] ?? []
  const answeredCount = useMemo(
    () => session.questions.filter((q) => (answers[q.id] ?? []).length > 0).length,
    [answers, session.questions],
  )

  async function handleSubmit() {
    if (submitted || submitting || !canSubmit) return
    setSubmitting(true)
    try {
      const timeUsed = Math.min(durationSec, durationSec - remaining)
      await onSubmit(session.id, answers, Math.max(0, timeUsed))
      setSubmitted(true)
      setNavOpen(false)
    } finally {
      setSubmitting(false)
    }
  }

  if (submitting) {
    return <LoadingScreen message="Scoring your exam…" />
  }

  if (!question) {
    return <LoadingScreen message="Preparing question…" />
  }

  if (submitted) {
    return (
      <div className="min-h-dvh px-4 py-8">
        <ExamSummary session={session} timeUsedSec={durationSec - remaining} />
      </div>
    )
  }

  function toggleOption(optionId: string) {
    setAnswers((prev) => {
      const current = prev[question.id] ?? []
      let next: string[]
      if (question.multiSelect) {
        next = current.includes(optionId)
          ? current.filter((id) => id !== optionId)
          : [...current, optionId]
      } else {
        next = [optionId]
      }
      return { ...prev, [question.id]: next }
    })
  }

  function toggleFlag() {
    setFlagged((prev) => {
      const next = new Set(prev)
      if (next.has(question.id)) next.delete(question.id)
      else next.add(question.id)
      return next
    })
  }

  function goTo(i: number) {
    const maxIndex = Math.max(availableCount - 1, 0)
    setIndex(Math.min(Math.max(i, 0), maxIndex))
    setNavOpen(false)
  }

  const isFlagged = flagged.has(question.id)
  const lowTime = remaining <= 60
  const warnTime = remaining <= 300 && !lowTime

  return (
    <div className="flex min-h-dvh flex-col">
      {/* Focus-mode header with countdown */}
      <header className="sticky top-0 z-10 border-b border-border bg-background/85 backdrop-blur-lg">
        <div className="mx-auto flex max-w-2xl items-center gap-3 px-4 py-3">
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="ghost" size="icon" aria-label="Exit exam">
                <X />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Leave the exam?</AlertDialogTitle>
                <AlertDialogDescription>
                  Your exam won&apos;t be scored and progress will be lost. The
                  timer stops when you leave.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Keep going</AlertDialogCancel>
                <AlertDialogAction onClick={onExit}>Leave exam</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

          <div className="flex flex-1 flex-col gap-1.5">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>
                Question {index + 1} of {total}
              </span>
              <span>{answeredCount} answered</span>
            </div>
            <Progress value={(answeredCount / total) * 100} className="h-1.5" />
            {isGenerating && (
              <p className="text-[11px] text-primary">
                {availableCount} of {expectedTotal} questions ready
              </p>
            )}
          </div>

          <div
            className={cn(
              "flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-sm font-semibold tabular-nums",
              lowTime
                ? "bg-destructive/15 text-destructive"
                : warnTime
                  ? "bg-chart-3/15 text-chart-3"
                  : "bg-secondary text-foreground",
            )}
            role="timer"
            aria-label="Time remaining"
          >
            <Clock className="size-4" />
            {formatClock(remaining)}
          </div>

          <Button
            variant="ghost"
            size="icon"
            aria-label="Question navigator"
            onClick={() => setNavOpen(true)}
          >
            <LayoutGrid />
          </Button>
        </div>
      </header>

      {/* Question body */}
      <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-5 px-4 py-6">
        <AnimatePresence mode="wait">
          <motion.div
            key={question.id}
            initial={{ opacity: 0, x: 24 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -24 }}
            transition={{ duration: 0.2 }}
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
                {isFlagged && (
                  <Badge variant="outline" className="gap-1 text-chart-3">
                    <Flag className="size-3" />
                    Flagged
                  </Badge>
                )}
              </div>
              <h1 className="text-balance text-xl font-medium leading-relaxed sm:text-2xl">
                {question.prompt}
              </h1>
            </div>

            <div className="flex flex-col gap-2.5">
              {question.options.map((option, i) => (
                <OptionCard
                  key={option.id}
                  option={option}
                  index={i}
                  selected={selected.includes(option.id)}
                  revealed={false}
                  isCorrect={false}
                  multiSelect={question.multiSelect}
                  disabled={false}
                  onToggle={() => toggleOption(option.id)}
                />
              ))}
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Sticky action footer */}
      <footer className="sticky bottom-0 border-t border-border bg-background/90 pb-[env(safe-area-inset-bottom)] backdrop-blur-lg">
        <div className="mx-auto flex max-w-2xl items-center gap-2 px-4 py-3">
          <Button
            variant="ghost"
            size="icon-lg"
            aria-label="Previous question"
            disabled={index === 0}
            onClick={() => goTo(index - 1)}
          >
            <ArrowLeft />
          </Button>
          <Button
            variant={isFlagged ? "secondary" : "ghost"}
            size="lg"
            onClick={toggleFlag}
            className={cn(isFlagged && "text-chart-3")}
          >
            <Flag data-icon="inline-start" />
            {isFlagged ? "Flagged" : "Flag"}
          </Button>

          {index + 1 < availableCount ? (
            <Button size="lg" className="flex-1" onClick={() => goTo(index + 1)}>
              Next
              <ArrowRight data-icon="inline-end" />
            </Button>
          ) : (
            <SubmitButton
              answeredCount={answeredCount}
              total={total}
              submitting={submitting}
              disabled={!canSubmit}
              onSubmit={() => void handleSubmit()}
              className="flex-1"
            />
          )}
        </div>
      </footer>

      {/* Question navigator */}
      <Sheet open={navOpen} onOpenChange={setNavOpen}>
        <SheetContent side="right" className="w-full sm:max-w-md">
          <SheetHeader>
            <SheetTitle>Question navigator</SheetTitle>
            <SheetDescription>
              {answeredCount} of {total} answered · {flagged.size} flagged
            </SheetDescription>
          </SheetHeader>

          <div className="flex flex-wrap gap-2 overflow-y-auto px-4">
            {session.questions.map((q, i) => {
              const isAnswered = (answers[q.id] ?? []).length > 0
              const qFlagged = flagged.has(q.id)
              const isCurrent = i === index
              return (
                <button
                  key={q.id}
                  type="button"
                  onClick={() => goTo(i)}
                  aria-label={`Go to question ${i + 1}`}
                  aria-current={isCurrent ? "true" : undefined}
                  className={cn(
                    "relative flex size-10 items-center justify-center rounded-lg border text-sm font-medium transition-colors",
                    isCurrent && "ring-2 ring-ring ring-offset-2 ring-offset-popover",
                    isAnswered
                      ? "border-primary bg-primary/15 text-primary"
                      : "border-border text-muted-foreground hover:border-primary/40",
                  )}
                >
                  {i + 1}
                  {qFlagged && (
                    <span className="absolute -right-1 -top-1 flex size-3 items-center justify-center rounded-full bg-chart-3 text-[8px] text-background">
                      <Flag className="size-2" />
                    </span>
                  )}
                </button>
              )
            })}
          </div>

          <div className="mt-auto flex flex-col gap-3 border-t border-border p-4">
            <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <span className="size-3 rounded border border-primary bg-primary/15" />
                Answered
              </span>
              <span className="flex items-center gap-1.5">
                <span className="size-3 rounded border border-border" />
                Unanswered
              </span>
              <span className="flex items-center gap-1.5">
                <Flag className="size-3 text-chart-3" />
                Flagged
              </span>
            </div>
            <SubmitButton
              answeredCount={answeredCount}
              total={total}
              submitting={submitting}
              disabled={!canSubmit}
              onSubmit={() => void handleSubmit()}
            />
          </div>
        </SheetContent>
      </Sheet>
    </div>
  )
}

function SubmitButton({
  answeredCount,
  total,
  submitting,
  disabled,
  onSubmit,
  className,
}: {
  answeredCount: number
  total: number
  submitting: boolean
  disabled?: boolean
  onSubmit: () => void
  className?: string
}) {
  const unanswered = total - answeredCount
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button size="lg" className={className} disabled={submitting || disabled}>
          {submitting ? (
            <>
              <Spinner data-icon="inline-start" />
              Submitting…
            </>
          ) : disabled ? (
            "Waiting for questions…"
          ) : (
            "Submit exam"
          )}
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Submit your exam?</AlertDialogTitle>
          <AlertDialogDescription>
            {unanswered > 0
              ? `You have ${unanswered} unanswered question${unanswered === 1 ? "" : "s"}. They'll be marked incorrect.`
              : "You've answered every question. Ready to see your score?"}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Keep working</AlertDialogCancel>
          <AlertDialogAction onClick={onSubmit} disabled={submitting}>
            {submitting ? (
              <>
                <Spinner data-icon="inline-start" />
                Scoring…
              </>
            ) : (
              "Submit & score"
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
