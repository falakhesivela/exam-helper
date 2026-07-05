"use client"

import { useState } from "react"
import { AnimatePresence, motion } from "motion/react"
import { ArrowRight, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { OptionCard } from "@/components/quiz/option-card"
import { ExplanationPanel } from "@/components/quiz/explanation-panel"
import { QuestionStem } from "@/components/exam/vue/question-stem"
import { isAnswerCorrect, isMcqQuestion } from "@/lib/session-utils"
import type { Bookmark as BookmarkType } from "@/types"

interface BookmarkQuizProps {
  items: BookmarkType[]
  onClose: () => void
}

/** Client-side quiz mode cycling through saved bookmark questions. */
export function BookmarkQuiz({ items, onClose }: BookmarkQuizProps) {
  const mcqItems = items.filter((b) => isMcqQuestion(b.question))
  const [index, setIndex] = useState(0)
  const [selected, setSelected] = useState<string[]>([])
  const [revealed, setRevealed] = useState(false)
  const [correctCount, setCorrectCount] = useState(0)
  const [finished, setFinished] = useState(false)

  const current = mcqItems[index]
  const question = current?.question
  const total = mcqItems.length

  if (mcqItems.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 py-8 text-center">
        <p className="text-sm text-muted-foreground">
          Quiz mode works with multiple-choice saved questions. None of your
          bookmarks are MCQs yet.
        </p>
        <Button variant="secondary" onClick={onClose}>
          Back to list
        </Button>
      </div>
    )
  }

  if (finished) {
    return (
      <div className="flex flex-col items-center gap-4 py-8 text-center">
        <h2 className="text-xl font-semibold">Quiz complete</h2>
        <p className="text-sm text-muted-foreground">
          {correctCount} of {total} correct
        </p>
        <Button onClick={onClose}>Back to saved questions</Button>
      </div>
    )
  }

  if (!question) return null

  const isCorrect = isAnswerCorrect(question, selected)

  function toggleOption(optionId: string) {
    if (revealed) return
    setSelected((prev) =>
      question!.multiSelect
        ? prev.includes(optionId)
          ? prev.filter((id) => id !== optionId)
          : [...prev, optionId]
        : [optionId],
    )
  }

  function check() {
    if (selected.length === 0) return
    setRevealed(true)
    if (isAnswerCorrect(question!, selected)) {
      setCorrectCount((c) => c + 1)
    }
  }

  function next() {
    if (index + 1 >= total) {
      setFinished(true)
      return
    }
    setIndex((i) => i + 1)
    setSelected([])
    setRevealed(false)
  }

  return (
    <div className="flex flex-col gap-4 rounded-xl border border-border bg-card/50 p-4">
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm font-medium">
          Quiz me · {index + 1} of {total}
        </p>
        <Button variant="ghost" size="icon-sm" onClick={onClose} aria-label="Close quiz">
          <X />
        </Button>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={question.id}
          initial={{ opacity: 0, x: 16 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -16 }}
          className="flex flex-col gap-4"
        >
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="secondary">{question.topic}</Badge>
            <span className="text-xs text-muted-foreground">
              {current.examCode}
            </span>
          </div>

          <QuestionStem question={question} />

          <div className="flex flex-col gap-2.5">
            {(question.options ?? []).map((option, i) => (
              <OptionCard
                key={option.id}
                option={option}
                index={i}
                selected={selected.includes(option.id)}
                revealed={revealed}
                isCorrect={(question.correctOptionIds ?? []).includes(option.id)}
                multiSelect={Boolean(question.multiSelect)}
                disabled={revealed}
                onToggle={() => toggleOption(option.id)}
              />
            ))}
          </div>

          {revealed && (
            <ExplanationPanel question={question} isCorrect={isCorrect} />
          )}
        </motion.div>
      </AnimatePresence>

      <div className="flex gap-2">
        {!revealed ? (
          <Button
            className="flex-1"
            disabled={selected.length === 0}
            onClick={check}
          >
            Check answer
          </Button>
        ) : (
          <Button className="flex-1" onClick={next}>
            {index + 1 >= total ? "Finish" : "Next"}
            <ArrowRight data-icon="inline-end" />
          </Button>
        )}
      </div>
    </div>
  )
}