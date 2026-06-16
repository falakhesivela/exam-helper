"use client"

import { useMemo, useState } from "react"
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
import { useSessionStore } from "@/lib/store/use-session-store"
import { isAnswerCorrect } from "@/lib/session-utils"
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

  if (!session) {
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center gap-3 p-6 text-center">
        <p className="text-lg font-medium">Session not found</p>
        <Button onClick={() => router.push("/intake")}>Start a new session</Button>
      </div>
    )
  }

  return (
    <QuizRunnerInner
      key={session.id}
      session={session}
      onAnswer={answerQuestion}
      onMark={toggleMarkForReview}
      onSkip={skipQuestion}
      onGoTo={goToIndex}
      onComplete={completeSession}
      onExit={() => router.push("/dashboard")}
    />
  )
}

interface InnerProps {
  session: PracticeSession
  onAnswer: (
    sessionId: string,
    questionId: string,
    selected: string[],
    isCorrect: boolean,
    time: number,
  ) => void
  onMark: (sessionId: string, questionId: string) => void
  onSkip: (sessionId: string, questionId: string) => void
  onGoTo: (sessionId: string, index: number) => void
  onComplete: (sessionId: string) => void
  onExit: () => void
}

function QuizRunnerInner({
  session,
  onAnswer,
  onMark,
  onSkip,
  onGoTo,
  onComplete,
  onExit,
}: InnerProps) {
  const [index, setIndex] = useState(session.currentIndex ?? 0)
  const [selected, setSelected] = useState<string[]>([])
  const [revealed, setRevealed] = useState(false)
  const [finished, setFinished] = useState(false)
  const { seconds, reset } = useStopwatch(!finished)

  const question = session.questions[index]
  const total = session.questions.length
  const progress = ((index + (revealed ? 1 : 0)) / total) * 100
  const marked = session.answers[question?.id]?.markedForReview ?? false

  const correct = useMemo(
    () => (question ? isAnswerCorrect(question, selected) : false),
    [question, selected],
  )

  if (finished) {
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

  function handleSubmit() {
    if (selected.length === 0) return
    setRevealed(true)
    onAnswer(session.id, question.id, selected, correct, seconds)
  }

  function advance() {
    if (index + 1 >= total) {
      onComplete(session.id)
      setFinished(true)
      return
    }
    const next = index + 1
    setIndex(next)
    onGoTo(session.id, next)
    setSelected([])
    setRevealed(false)
    reset()
  }

  function handleSkip() {
    onSkip(session.id, question.id)
    advance()
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
            onClick={() => onMark(session.id, question.id)}
            className={cn(marked && "text-primary")}
          >
            {marked ? <BookmarkCheck /> : <Bookmark />}
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
                  key={option.id}
                  option={option}
                  index={i}
                  selected={selected.includes(option.id)}
                  revealed={revealed}
                  isCorrect={question.correctOptionIds.includes(option.id)}
                  multiSelect={question.multiSelect}
                  disabled={revealed}
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
                className="text-muted-foreground"
              >
                <SkipForward data-icon="inline-start" />
                Skip
              </Button>
              <Button
                size="lg"
                className="flex-1"
                disabled={selected.length === 0}
                onClick={handleSubmit}
              >
                Check answer
              </Button>
            </>
          ) : (
            <Button size="lg" className="flex-1" onClick={advance} autoFocus>
              {index + 1 >= total ? "Finish session" : "Next question"}
              <ArrowRight data-icon="inline-end" />
            </Button>
          )}
        </div>
      </footer>
    </div>
  )
}
