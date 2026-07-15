"use client"

import { useState } from "react"
import { CircleCheck, CircleX, ListChecks, MessageSquarePlus } from "lucide-react"
import { motion } from "motion/react"
import { OptionCard } from "@/components/quiz/option-card"
import { Button } from "@/components/ui/button"
import { Markdown, MarkdownInline } from "@/components/ui/markdown"
import type { MentorQuiz } from "@/lib/mentor/quiz-block"
import { cn } from "@/lib/utils"

interface MentorQuizCardProps {
  quiz: MentorQuiz
  /** Pre-fills the composer (never auto-sends — sending spends quota). */
  onFollowUp?: (prompt: string) => void
}

const LETTERS = ["A", "B", "C", "D", "E", "F"]

function followUpPrompt(quiz: MentorQuiz, selected: string[]): string {
  const label = (id: string) => {
    const index = quiz.options.findIndex((o) => o.id === id)
    return `${LETTERS[index] ?? "?"} (${quiz.options[index]?.text ?? id})`
  }
  const picked = selected.map(label).join(", ")
  const correct = quiz.correctOptionIds.map(label).join(", ")
  return (
    `On your quick check "${quiz.question}" I picked ${picked} but the correct answer is ${correct}. ` +
    "Walk me through why my choice is wrong and how to spot the right one on the real exam."
  ).slice(0, 2000)
}

/**
 * Interactive quick-check rendered from a `quiz` block in a Mentor reply.
 * Graded locally — answering costs nothing; the "explain" follow-up only
 * pre-fills the composer so the learner decides whether to spend a message.
 */
export function MentorQuizCard({ quiz, onFollowUp }: MentorQuizCardProps) {
  const [selected, setSelected] = useState<string[]>([])
  const [revealed, setRevealed] = useState(false)

  const correctSet = new Set(quiz.correctOptionIds)
  const answeredCorrectly =
    revealed &&
    selected.length === correctSet.size &&
    selected.every((id) => correctSet.has(id))

  function toggle(id: string) {
    if (revealed) return
    setSelected((current) => {
      if (!quiz.multiSelect) return current.includes(id) ? [] : [id]
      return current.includes(id)
        ? current.filter((x) => x !== id)
        : [...current, id]
    })
  }

  return (
    <div className="my-3 flex flex-col gap-3 rounded-2xl border border-primary/25 bg-primary/[0.04] p-4">
      <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-primary">
        <ListChecks className="size-4" />
        Quick check
        {quiz.multiSelect && (
          <span className="font-normal normal-case tracking-normal text-muted-foreground">
            · choose {quiz.correctOptionIds.length}
          </span>
        )}
      </div>

      <MarkdownInline className="text-[15px] font-medium leading-relaxed">
        {quiz.question}
      </MarkdownInline>

      <div className="flex flex-col gap-2">
        {quiz.options.map((option, index) => (
          <OptionCard
            key={option.id}
            option={option}
            index={index}
            selected={selected.includes(option.id)}
            revealed={revealed}
            isCorrect={correctSet.has(option.id)}
            multiSelect={quiz.multiSelect}
            disabled={revealed}
            onToggle={() => toggle(option.id)}
          />
        ))}
      </div>

      {!revealed ? (
        <Button
          type="button"
          className="w-full sm:w-fit"
          disabled={selected.length === 0}
          onClick={() => setRevealed(true)}
        >
          Check answer
        </Button>
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25 }}
          className="flex flex-col gap-2"
        >
          <p
            className={cn(
              "flex items-center gap-1.5 text-sm font-semibold",
              answeredCorrectly ? "text-success" : "text-destructive",
            )}
          >
            {answeredCorrectly ? (
              <>
                <CircleCheck className="size-4" />
                Correct — locked in.
              </>
            ) : (
              <>
                <CircleX className="size-4" />
                Not quite.
              </>
            )}
          </p>
          {quiz.explanation && (
            <Markdown className="text-sm text-foreground/90">
              {quiz.explanation}
            </Markdown>
          )}
          {!answeredCorrectly && onFollowUp && (
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="w-fit rounded-full"
              onClick={() => onFollowUp(followUpPrompt(quiz, selected))}
            >
              <MessageSquarePlus />
              Explain why I got this wrong
            </Button>
          )}
        </motion.div>
      )}
    </div>
  )
}
