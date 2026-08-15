"use client"

import { useState } from "react"
import { CircleCheck, CircleX, ListChecks, MessageSquarePlus } from "lucide-react"
import { motion } from "motion/react"
import { OptionCard } from "@/components/quiz/option-card"
import { Button } from "@/components/ui/button"
import { Markdown, MarkdownInline } from "@/components/ui/markdown"
import { Spinner } from "@/components/ui/spinner"
import { api } from "@/lib/api/client"
import type { MentorQuiz } from "@/lib/mentor/quiz-block"
import { cn } from "@/lib/utils"
import type { Confidence, MentorQuizAttempt } from "@/types"

export interface MentorQuizCardProps {
  quiz: MentorQuiz
  /** Pre-fills the composer (never auto-sends — sending spends quota). */
  onFollowUp?: (prompt: string) => void
  /**
   * Identity of this quick check. Absent while a reply is still streaming, or
   * if the insert didn't report a row back — the card then works exactly as
   * before, grading locally without saving.
   */
  messageId?: number
  quizIndex?: number
  /** A previously saved answer; rehydrates the card to how it was left. */
  attempt?: MentorQuizAttempt
  onAttempt?: (input: {
    messageId: number
    quizIndex: number
    selectedOptionIds: string[]
    isCorrect: boolean
    attempts: number
    confidence?: Confidence
  }) => void
}

const LETTERS = ["A", "B", "C", "D", "E", "F"]

/**
 * One free retry before the answer is revealed. Grading is local so a retry
 * costs nothing, but it does mean a determined learner could walk every option
 * — so anything that awards credit must key off the *first* attempt only.
 */
const MAX_ATTEMPTS = 2

function sameSelection(a: string[], b: string[]): boolean {
  return a.length === b.length && [...a].sort().join(",") === [...b].sort().join(",")
}

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
 *
 * Graded locally for instant feedback, then posted so the answer survives a
 * reload — the server regrades from the stored message and owns what gets
 * saved. Answering is free; the "explain" follow-up runs on the cheap tutor
 * tier rather than spending a Mentor message.
 */
export function MentorQuizCard({
  quiz,
  onFollowUp,
  messageId,
  quizIndex,
  attempt,
  onAttempt,
}: MentorQuizCardProps) {
  const saved = attempt ?? null
  const [selected, setSelected] = useState<string[]>(
    saved?.selectedOptionIds ?? [],
  )
  const [eliminated, setEliminated] = useState<string[]>([])
  const [attempts, setAttempts] = useState(saved?.attempts ?? 0)
  /** The selection that just failed, so a retry can't re-submit it unchanged. */
  const [lastWrong, setLastWrong] = useState<string[] | null>(null)
  const [revealed, setRevealed] = useState(saved != null)
  const [confidence, setConfidence] = useState<Confidence | undefined>(
    saved?.confidence ?? undefined,
  )
  const [explaining, setExplaining] = useState(false)
  const [explanation, setExplanation] = useState("")
  const [explainError, setExplainError] = useState(false)

  const correctSet = new Set(quiz.correctOptionIds)
  const selectionIsCorrect =
    selected.length === correctSet.size &&
    selected.every((id) => correctSet.has(id))
  const answeredCorrectly = revealed && selectionIsCorrect
  /** Wrong once, answer still hidden, one try left. */
  const retrying = attempts > 0 && !revealed
  const unchangedSinceMiss = lastWrong !== null && sameSelection(selected, lastWrong)

  function toggle(id: string) {
    if (revealed) return
    // Picking a struck-out option restores it (matches the practice runner).
    setEliminated((current) => current.filter((x) => x !== id))
    setSelected((current) => {
      if (!quiz.multiSelect) return current.includes(id) ? [] : [id]
      return current.includes(id)
        ? current.filter((x) => x !== id)
        : [...current, id]
    })
  }

  function toggleEliminated(id: string) {
    if (revealed) return
    setEliminated((current) =>
      current.includes(id)
        ? current.filter((x) => x !== id)
        : [...current, id],
    )
    // Ruling an option out also deselects it.
    setSelected((current) => current.filter((x) => x !== id))
  }

  function check() {
    if (revealed || selected.length === 0) return
    const attempt = attempts + 1
    setAttempts(attempt)
    // Recorded on every check, not just the last: a wrong first try is the
    // honest signal, and the retry simply upserts over it. Whether that earns
    // XP is the server's call — it only pays out on a first-attempt hit.
    if (messageId != null && quizIndex != null) {
      onAttempt?.({
        messageId,
        quizIndex,
        selectedOptionIds: selected,
        isCorrect: selectionIsCorrect,
        attempts: attempt,
        confidence,
      })
    }
    if (selectionIsCorrect || attempt >= MAX_ATTEMPTS) {
      setRevealed(true)
      return
    }
    setLastWrong(selected)
  }

  /**
   * "Why was I wrong?" — streamed inline from the per-question tutor. Falls
   * back to pre-filling the composer when this card has no persisted identity
   * (a still-streaming reply), which is what the button always used to do.
   */
  async function explain() {
    if (explaining || explanation) return
    if (messageId == null || quizIndex == null) {
      onFollowUp?.(followUpPrompt(quiz, selected))
      return
    }
    setExplaining(true)
    setExplainError(false)
    try {
      await api.mentorQuizExplain(
        { messageId, quizIndex, selectedOptionIds: selected },
        { onDelta: (text) => setExplanation((current) => current + text) },
      )
    } catch {
      setExplainError(true)
    } finally {
      setExplaining(false)
    }
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
            eliminated={eliminated.includes(option.id)}
            onToggleEliminated={
              revealed ? undefined : () => toggleEliminated(option.id)
            }
          />
        ))}
      </div>

      {!revealed ? (
        <div className="flex flex-col gap-2">
          {/*
            Asked before checking, not after: confident-and-wrong is the signal
            worth having, and it only means anything if it was recorded while
            the answer was still unknown. Optional — skipping it just leaves
            confidence null on the attempt.
          */}
          {selected.length > 0 && !retrying && (
            <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
              <span>How sure are you?</span>
              {(["sure", "unsure"] as const).map((level) => (
                <button
                  key={level}
                  type="button"
                  aria-pressed={confidence === level}
                  onClick={() =>
                    setConfidence((current) =>
                      current === level ? undefined : level,
                    )
                  }
                  className={cn(
                    "rounded-full border px-2.5 py-1 transition-colors",
                    confidence === level
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border hover:bg-secondary",
                  )}
                >
                  {level === "sure" ? "Confident" : "Guessing"}
                </button>
              ))}
            </div>
          )}
          {retrying && (
            <p className="flex items-center gap-1.5 text-sm font-medium text-destructive">
              <CircleX className="size-4" />
              Not quite — one more try.
            </p>
          )}
          <div className="flex flex-wrap items-center gap-2">
            <Button
              type="button"
              className="w-full sm:w-fit"
              disabled={selected.length === 0 || unchangedSinceMiss}
              onClick={check}
            >
              {retrying ? "Check again" : "Check answer"}
            </Button>
            {retrying && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setRevealed(true)}
              >
                Show answer
              </Button>
            )}
          </div>
          {unchangedSinceMiss && (
            <p className="text-xs text-muted-foreground">
              Change your selection to try again, or reveal the answer.
            </p>
          )}
        </div>
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
                {attempts > 1 ? "Correct on the second try." : "Correct — locked in."}
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
          {saved?.confidence === "sure" && !answeredCorrectly && (
            <p className="text-xs text-muted-foreground">
              You marked this one confident — worth a second look.
            </p>
          )}

          {!answeredCorrectly && (explanation || explaining) && (
            <div className="rounded-xl border bg-card/60 p-3">
              {explanation ? (
                <Markdown className="text-sm text-foreground/90">
                  {explanation}
                </Markdown>
              ) : (
                <p className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Spinner className="size-3.5" />
                  Working through it…
                </p>
              )}
            </div>
          )}

          {!answeredCorrectly && !explanation && (
            <div className="flex flex-col gap-1">
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="h-auto w-fit max-w-full rounded-full py-1.5 text-left whitespace-normal"
                disabled={explaining}
                onClick={() => void explain()}
              >
                <MessageSquarePlus />
                {explaining ? "Thinking…" : "Explain why I got this wrong"}
              </Button>
              {explainError && (
                <p className="text-xs text-destructive">
                  Couldn&apos;t load an explanation. Try again in a moment.
                </p>
              )}
            </div>
          )}
        </motion.div>
      )}
    </div>
  )
}
