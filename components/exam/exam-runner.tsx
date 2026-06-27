"use client"

import { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import {
  ArrowLeft,
  ArrowRight,
  Clock,
  Flag,
  LayoutGrid,
  Timer,
  X,
} from "lucide-react"
import { Button } from "@/components/ui/button"
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
import { ExamSummary } from "@/components/exam/exam-summary"
import { ExamQuestionPane } from "@/components/exam/vue/exam-question-pane"
import { AwsServiceHelp } from "@/components/exam/vue/aws-service-help"
import { ExamRules } from "@/components/exam/vue/exam-rules"
import {
  ExamNavigator,
  ItemReviewScreen,
} from "@/components/exam/vue/item-review-screen"
import { LoadingScreen } from "@/components/ui/loading-screen"
import { Spinner } from "@/components/ui/spinner"
import { GenerationStatusBanner } from "@/components/generation/generation-tracker"
import { getExamBlueprint } from "@/lib/exams"
import { examShowsAwsServiceHelp } from "@/lib/exams/aws-service-abbreviations"
import { useSessionStore } from "@/lib/store/use-session-store"
import { api, USE_MOCKS } from "@/lib/api/client"
import { useSessionSync } from "@/hooks/use-session-sync"
import { useCountdown, formatClock } from "@/hooks/use-countdown"
import type { DragAnswer, PracticeSession } from "@/types"
import { isExamQuestionAnswered } from "@/lib/exam-answer-state"
import { cn } from "@/lib/utils"

type ExamPhase = "rules" | "exam" | "review" | "done"

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
    flagged: string[],
    timeUsedSec: number,
    dragAnswers: Record<string, DragAnswer>,
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
  const blueprint = getExamBlueprint(session.examCode)
  const total = Math.max(expectedTotal, availableCount, session.questions.length)
  const durationSec = session.durationSec ?? 30 * 60
  const canSubmit = !isGenerating && availableCount >= expectedTotal
  const passMark = session.passMark ?? blueprint?.passMark ?? 72
  const durationMin = Math.round(durationSec / 60)

  const [phase, setPhase] = useState<ExamPhase>("rules")
  const [timerActive, setTimerActive] = useState(false)
  const [index, setIndex] = useState(0)
  const [answers, setAnswers] = useState<Record<string, string[]>>({})
  const [dragAnswers, setDragAnswers] = useState<Record<string, DragAnswer>>({})
  const [flagged, setFlagged] = useState<Set<string>>(new Set())
  const [submitting, setSubmitting] = useState(false)
  const [navOpen, setNavOpen] = useState(false)

  const remaining = useCountdown(durationSec, timerActive && !submitting, () => {
    void handleSubmit()
  })

  // Per-question pace: time spent on the current question vs the exam's average
  // allowance, so the learner feels real exam-day time pressure.
  const targetPerQuestion = total > 0 ? Math.round(durationSec / total) : 60
  const [qElapsed, setQElapsed] = useState(0)
  useEffect(() => {
    setQElapsed(0)
  }, [index])
  useEffect(() => {
    if (!timerActive || submitting || phase !== "exam") return
    const id = setInterval(() => setQElapsed((e) => e + 1), 1000)
    return () => clearInterval(id)
  }, [timerActive, submitting, phase])
  const qOver = qElapsed > targetPerQuestion
  const qWayOver = qElapsed > targetPerQuestion * 1.6

  const question = session.questions[index]
  const selected = answers[question?.id] ?? []
  const dragAnswer = question ? dragAnswers[question.id] : undefined
  const answeredCount = useMemo(
    () =>
      session.questions.filter((q) =>
        isExamQuestionAnswered(q, answers, dragAnswers),
      ).length,
    [answers, dragAnswers, session.questions],
  )

  async function handleSubmit() {
    if (phase === "done" || submitting || !canSubmit) return
    setSubmitting(true)
    try {
      const timeUsed = Math.min(durationSec, durationSec - remaining)
      await onSubmit(
        session.id,
        answers,
        [...flagged],
        Math.max(0, timeUsed),
        dragAnswers,
      )
      setPhase("done")
      setNavOpen(false)
    } finally {
      setSubmitting(false)
    }
  }

  function startExam() {
    setPhase("exam")
    setTimerActive(true)
  }

  function goTo(i: number) {
    const maxIndex = Math.max(availableCount - 1, 0)
    setIndex(Math.min(Math.max(i, 0), maxIndex))
    setNavOpen(false)
    if (phase === "review") setPhase("exam")
  }

  function toggleOption(optionId: string) {
    if (!question) return
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
    if (!question) return
    setFlagged((prev) => {
      const next = new Set(prev)
      if (next.has(question.id)) next.delete(question.id)
      else next.add(question.id)
      return next
    })
  }

  useEffect(() => {
    if (phase !== "exam" || submitting) return

    function onKeyDown(event: KeyboardEvent) {
      if (!event.altKey) return
      const target = event.target
      if (
        target instanceof HTMLInputElement ||
        target instanceof HTMLTextAreaElement ||
        target instanceof HTMLSelectElement
      ) {
        return
      }

      const key = event.key.toLowerCase()
      if (key === "n" || event.key === "ArrowRight") {
        event.preventDefault()
        if (index + 1 < availableCount) goTo(index + 1)
        else if (canSubmit) setPhase("review")
      } else if (key === "p" || event.key === "ArrowLeft") {
        event.preventDefault()
        if (index > 0) goTo(index - 1)
      } else if (key === "f") {
        event.preventDefault()
        if (!question) return
        setFlagged((prev) => {
          const next = new Set(prev)
          if (next.has(question.id)) next.delete(question.id)
          else next.add(question.id)
          return next
        })
      }
    }

    window.addEventListener("keydown", onKeyDown)
    return () => window.removeEventListener("keydown", onKeyDown)
  }, [
    phase,
    submitting,
    index,
    availableCount,
    canSubmit,
    question?.id,
  ])

  function beginReviewFilter(mode: "all" | "incomplete" | "flagged") {
    const ids = session.questions.map((q) => q.id)
    let target = 0
    if (mode === "incomplete") {
      target = session.questions.findIndex(
        (q) => !isExamQuestionAnswered(q, answers, dragAnswers),
      )
    } else if (mode === "flagged") {
      target = ids.findIndex((id) => flagged.has(id))
    }
    setIndex(target >= 0 ? target : 0)
    setPhase("exam")
  }

  if (submitting) {
    return <LoadingScreen message="Scoring your exam…" />
  }

  if (phase === "done") {
    return (
      <div className="min-h-dvh px-4 py-8">
        <ExamSummary session={session} timeUsedSec={durationSec - remaining} />
      </div>
    )
  }

  if (phase === "rules") {
    return (
      <ExamRules
        examCode={session.examCode}
        examName={session.exam}
        questionCount={total}
        durationMin={durationMin}
        passMark={passMark}
        questionsReady={session.questions.length > 0}
        isGenerating={isGenerating}
        onStart={startExam}
      />
    )
  }

  if (phase === "review") {
    return (
      <ItemReviewScreen
        total={total}
        answeredCount={answeredCount}
        flaggedCount={flagged.size}
        canSubmit={canSubmit}
        onReviewAll={() => beginReviewFilter("all")}
        onReviewIncomplete={() => beginReviewFilter("incomplete")}
        onReviewFlagged={() => beginReviewFilter("flagged")}
        onEndReview={() => void handleSubmit()}
      />
    )
  }

  if (!question) {
    return <LoadingScreen message="Preparing question…" />
  }

  const isFlagged = flagged.has(question.id)
  const lowTime = remaining <= 60
  const warnTime = remaining <= 300 && !lowTime

  return (
    <div className="flex min-h-dvh flex-col bg-muted/20">
      <header className="sticky top-0 z-10 border-b border-border bg-background/95 backdrop-blur-sm">
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
                  Your exam won&apos;t be scored and progress will be lost.
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
              "hidden items-center gap-1 rounded-md px-2 py-1.5 text-xs font-medium tabular-nums sm:flex",
              qWayOver
                ? "bg-destructive/15 text-destructive"
                : qOver
                  ? "bg-chart-3/15 text-chart-3"
                  : "bg-secondary/60 text-muted-foreground",
            )}
            title={`Target ~${formatClock(targetPerQuestion)} per question`}
            aria-label="Time on this question"
          >
            <Timer className="size-3.5" />
            {formatClock(qElapsed)}
          </div>

          <div
            className={cn(
              "flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-sm font-semibold tabular-nums",
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

      <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-4 px-4 py-6">
        {examShowsAwsServiceHelp(session.examCode) && <AwsServiceHelp />}
        <div className="rounded-lg border border-border bg-card p-5 shadow-sm">
          <ExamQuestionPane
            question={question}
            selected={selected}
            dragAnswer={dragAnswer}
            isFlagged={isFlagged}
            onToggleOption={toggleOption}
            onDragAnswerChange={(next) =>
              setDragAnswers((prev) => ({ ...prev, [question.id]: next }))
            }
          />
        </div>
      </div>

      <footer className="sticky bottom-0 border-t border-border bg-background/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-sm">
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
            variant={isFlagged ? "secondary" : "outline"}
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
            <Button
              size="lg"
              className="flex-1"
              disabled={!canSubmit}
              onClick={() => setPhase("review")}
            >
              {canSubmit ? "Review & submit" : "Waiting for questions…"}
            </Button>
          )}
        </div>
      </footer>

      <Sheet open={navOpen} onOpenChange={setNavOpen}>
        <SheetContent side="right" className="flex w-full flex-col sm:max-w-md">
          <SheetHeader>
            <SheetTitle>Question navigator</SheetTitle>
            <SheetDescription>
              {answeredCount} of {total} answered · {flagged.size} flagged
            </SheetDescription>
          </SheetHeader>

          <div className="flex-1 overflow-y-auto px-4">
            <ExamNavigator
              total={total}
              currentIndex={index}
              answers={answers}
              dragAnswers={dragAnswers}
              questions={session.questions}
              flagged={flagged}
              questionIds={session.questions.map((q) => q.id)}
              onGoTo={goTo}
            />
          </div>

          <div className="mt-auto flex flex-col gap-2 border-t border-border p-4">
            <Button
              disabled={!canSubmit}
              onClick={() => {
                setNavOpen(false)
                setPhase("review")
              }}
            >
              Review & submit
            </Button>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  )
}
