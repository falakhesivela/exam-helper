"use client"

import { useCallback, useEffect, useState } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { AnimatePresence, motion } from "motion/react"
import { ArrowLeft, ArrowRight, RotateCcw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { LoadingScreen } from "@/components/ui/loading-screen"
import { Spinner } from "@/components/ui/spinner"
import { OptionCard } from "@/components/quiz/option-card"
import { ExplanationPanel } from "@/components/quiz/explanation-panel"
import { AiTutorPanel } from "@/components/quiz/ai-tutor-panel"
import { ExamQuestionPane } from "@/components/exam/vue/exam-question-pane"
import { QuestionStem } from "@/components/exam/vue/question-stem"
import { api } from "@/lib/api/client"
import { useSessionStore } from "@/lib/store/use-session-store"
import type { DragAnswer, Question } from "@/types"
import { isMcqQuestion, isQuestionAnswered } from "@/lib/session-utils"

interface MissedItem {
  questionId: string
  sessionId: string
  examCode: string
  exam: string
  answeredAt: string
  question: Question
}

/**
 * Full-question review: the stem, the options, the explanation and the AI tutor.
 * The heavier of the two review modes — {@link FlashcardRound} is the quick one.
 */
export function MissedQuiz({ domainId }: { domainId?: string } = {}) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const dueOnly = searchParams.get("due") === "true"
  // Set when this review was opened from a study-plan task; finishing the
  // run (or having nothing to review) completes that task.
  const planTaskId = searchParams.get("planTask")
  const updatePlanTask = useSessionStore((s) => s.updatePlanTask)

  const [items, setItems] = useState<MissedItem[]>([])
  const [loading, setLoading] = useState(true)
  const [index, setIndex] = useState(0)
  const [selected, setSelected] = useState<string[]>([])
  const [dragAnswer, setDragAnswer] = useState<DragAnswer | undefined>()
  const [revealed, setRevealed] = useState(false)
  const [isCorrect, setIsCorrect] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [finished, setFinished] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const data = await api.reviewQueue({
        dueOnly,
        source: "questions",
        domainId,
      })
      setItems(data.questions)
      setIndex(0)
      setFinished(data.questions.length === 0)
      // Empty queue: there was nothing to review, the plan task is fulfilled.
      if (planTaskId && data.questions.length === 0) {
        void updatePlanTask(planTaskId, { status: "done" })
      }
    } finally {
      setLoading(false)
    }
  }, [dueOnly, domainId, planTaskId, updatePlanTask])

  useEffect(() => {
    void load()
  }, [load])

  const current = items[index]
  const question = current?.question
  const total = items.length
  const progress = total > 0 ? ((index + (revealed ? 1 : 0)) / total) * 100 : 0

  function resetQuestionState() {
    setSelected([])
    setDragAnswer(undefined)
    setRevealed(false)
    setIsCorrect(false)
  }

  async function handleCheck() {
    if (!current || !question || submitting) return
    setSubmitting(true)
    try {
      const result = await api.retryMissedQuestion(current.questionId, {
        selectedOptionIds: selected,
        dragAnswer,
      })
      setIsCorrect(result.isCorrect)
      setRevealed(true)
      // A correct retry does NOT leave the backlog: the queue is derived from
      // answers.is_correct = false, which the retry never rewrites. It only
      // pushes the card's next review further out, and once it reaches the
      // maximum interval it is flagged retired ("Mastered"). Keep the local
      // list stable for this run regardless — dropping the current item would
      // shift the array and make "Next" skip the following question.
    } finally {
      setSubmitting(false)
    }
  }

  function handleNext() {
    resetQuestionState()
    if (index + 1 >= items.length) {
      setFinished(true)
      if (planTaskId) void updatePlanTask(planTaskId, { status: "done" })
    } else {
      setIndex((i) => i + 1)
    }
  }

  if (loading) {
    return <LoadingScreen message="Loading missed questions…" />
  }

  if (finished || total === 0) {
    return (
      <div className="mx-auto flex max-w-lg flex-col items-center gap-4 py-16 text-center">
        <h1 className="text-2xl font-semibold">
          {dueOnly ? "Nothing due today" : "No misses to review"}
        </h1>
        <p className="text-sm text-muted-foreground">
          {dueOnly
            ? "Check back tomorrow or review all missed questions."
            : "Answer more practice questions — misses will appear here."}
        </p>
        <div className="flex flex-wrap justify-center gap-2">
          {dueOnly && (
            <Button asChild variant="secondary">
              <Link href="/practice/review?mode=quiz">All misses</Link>
            </Button>
          )}
          <Button asChild>
            <Link href="/practice">Back to Practice</Link>
          </Button>
        </div>
      </div>
    )
  }

  if (!question) {
    return <LoadingScreen message="Loading question…" />
  }

  const canCheck = isQuestionAnswered(question, selected, dragAnswer)

  return (
    <div className="flex min-h-[60vh] flex-col gap-4">
      {/* The deck owns the title and mode switcher; this is just the run. */}
      <div className="flex items-center gap-3">
        <Progress value={progress} className="h-1.5 flex-1" />
        <span className="shrink-0 text-xs tabular-nums text-muted-foreground">
          {current.examCode} · {index + 1} / {total}
        </span>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={question.id}
          initial={{ opacity: 0, x: 16 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -16 }}
          className="flex flex-col gap-5 rounded-xl border border-border bg-card p-5"
        >
          <div className="flex flex-wrap gap-2">
            <Badge variant="secondary">{question.topic}</Badge>
            <Badge variant="outline" className="capitalize">
              {question.difficulty}
            </Badge>
          </div>

          {isMcqQuestion(question) ? (
            <>
              <QuestionStem question={question} />
              <div className="flex flex-col gap-2.5">
                {(question.options ?? []).map((option, i) => (
                  <OptionCard
                    key={option.id}
                    option={option}
                    index={i}
                    selected={selected.includes(option.id)}
                    revealed={revealed}
                    isCorrect={(question.correctOptionIds ?? []).includes(
                      option.id,
                    )}
                    multiSelect={Boolean(question.multiSelect)}
                    disabled={revealed || submitting}
                    onToggle={() => {
                      if (revealed) return
                      setSelected((prev) =>
                        question.multiSelect
                          ? prev.includes(option.id)
                            ? prev.filter((id) => id !== option.id)
                            : [...prev, option.id]
                          : [option.id],
                      )
                    }}
                  />
                ))}
              </div>
            </>
          ) : (
            <ExamQuestionPane
              question={question}
              selected={selected}
              dragAnswer={dragAnswer}
              isFlagged={false}
              onToggleOption={(id) => {
                if (revealed) return
                setSelected((prev) =>
                  question.multiSelect
                    ? prev.includes(id)
                      ? prev.filter((x) => x !== id)
                      : [...prev, id]
                    : [id],
                )
              }}
              onDragAnswerChange={setDragAnswer}
            />
          )}

          {revealed && (
            <>
              <ExplanationPanel question={question} isCorrect={isCorrect} />
              {!isCorrect && (
                <AiTutorPanel
                  question={question}
                  selectedOptionIds={selected}
                  dragAnswer={dragAnswer}
                />
              )}
            </>
          )}
        </motion.div>
      </AnimatePresence>

      <div className="flex gap-2">
        {!revealed ? (
          <Button
            size="lg"
            className="flex-1"
            disabled={!canCheck || submitting}
            onClick={() => void handleCheck()}
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
        ) : (
          <Button size="lg" className="flex-1" onClick={handleNext}>
            {index + 1 >= items.length ? "Done" : "Next"}
            <ArrowRight data-icon="inline-end" />
          </Button>
        )}
        <Button variant="outline" size="lg" onClick={() => void load()}>
          <RotateCcw />
        </Button>
      </div>
    </div>
  )
}
