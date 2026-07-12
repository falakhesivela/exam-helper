"use client"

import { useState } from "react"
import { CheckCircle2, ClipboardCheck, RotateCcw, XCircle } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Markdown, MarkdownInline } from "@/components/ui/markdown"
import { Spinner } from "@/components/ui/spinner"
import type { CheckQuestion } from "@/types"
import { cn } from "@/lib/utils"

export const CHECK_PASS_RATIO = 0.7

interface LessonCheckProps {
  questions: CheckQuestion[]
  /** Best previous result, if the check was already taken. */
  savedScore?: number | null
  savedTotal?: number | null
  onSubmit: (score: number, total: number) => Promise<void>
  submitting: boolean
}

/** End-of-lesson knowledge check: pass it (>=70%) to complete the lesson. */
export function LessonCheck({
  questions,
  savedScore,
  savedTotal,
  onSubmit,
  submitting,
}: LessonCheckProps) {
  const [answers, setAnswers] = useState<Record<number, number>>({})
  const [submitted, setSubmitted] = useState(false)
  const [retaking, setRetaking] = useState(false)

  const answered = Object.keys(answers).length
  const score = questions.reduce(
    (acc, q, i) => acc + (answers[i] === q.correctIndex ? 1 : 0),
    0,
  )
  const passed = score >= questions.length * CHECK_PASS_RATIO
  const hasSavedPass =
    savedScore != null &&
    savedTotal != null &&
    savedScore >= savedTotal * CHECK_PASS_RATIO

  if (hasSavedPass && !retaking) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <ClipboardCheck className="size-4 text-success" />
            Knowledge check passed
          </CardTitle>
          <CardDescription>
            You scored {savedScore}/{savedTotal} on this lesson&apos;s check.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setAnswers({})
              setSubmitted(false)
              setRetaking(true)
            }}
          >
            <RotateCcw data-icon="inline-start" />
            Retake check
          </Button>
        </CardContent>
      </Card>
    )
  }

  async function handleSubmit() {
    setSubmitted(true)
    await onSubmit(score, questions.length)
  }

  function handleRetry() {
    setAnswers({})
    setSubmitted(false)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <ClipboardCheck className="size-4 text-primary" />
          Check your understanding
        </CardTitle>
        <CardDescription>
          Answer {questions.length} quick questions — score{" "}
          {Math.ceil(questions.length * CHECK_PASS_RATIO)}+ to complete the
          lesson.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-5">
        {questions.map((q, qi) => {
          const selected = answers[qi]
          return (
            <div key={qi} className="flex flex-col gap-2">
              <p className="text-sm font-medium leading-relaxed">
                {qi + 1}. <MarkdownInline>{q.prompt}</MarkdownInline>
              </p>
              <div className="flex flex-col gap-1.5" role="radiogroup">
                {q.options.map((option, oi) => {
                  const isSelected = selected === oi
                  const isCorrect = oi === q.correctIndex
                  return (
                    <button
                      key={oi}
                      type="button"
                      role="radio"
                      aria-checked={isSelected}
                      disabled={submitted}
                      onClick={() =>
                        setAnswers((prev) => ({ ...prev, [qi]: oi }))
                      }
                      className={cn(
                        "flex items-start gap-2 rounded-lg border px-3 py-2 text-left text-sm leading-relaxed transition-colors",
                        !submitted &&
                          (isSelected
                            ? "border-primary bg-primary/5"
                            : "border-border hover:border-primary/40"),
                        submitted &&
                          isCorrect &&
                          "border-success bg-success/5",
                        submitted &&
                          isSelected &&
                          !isCorrect &&
                          "border-destructive bg-destructive/5",
                        submitted && !isSelected && !isCorrect && "border-border opacity-60",
                      )}
                    >
                      {submitted && isCorrect && (
                        <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-success" />
                      )}
                      {submitted && isSelected && !isCorrect && (
                        <XCircle className="mt-0.5 size-4 shrink-0 text-destructive" />
                      )}
                      <MarkdownInline className="flex-1">{option}</MarkdownInline>
                    </button>
                  )
                })}
              </div>
              {submitted && selected !== q.correctIndex && (
                <Markdown className="text-xs leading-relaxed text-muted-foreground">
                  {q.explanation}
                </Markdown>
              )}
            </div>
          )
        })}

        {!submitted ? (
          <Button
            onClick={handleSubmit}
            disabled={answered < questions.length || submitting}
            className="w-full sm:w-fit"
          >
            {submitting && <Spinner data-icon="inline-start" />}
            {answered < questions.length
              ? `Answer all ${questions.length} questions`
              : "Check answers"}
          </Button>
        ) : (
          <div className="flex flex-col gap-3 rounded-lg border border-border bg-muted/30 p-4">
            <p className="text-sm font-medium">
              {passed
                ? `You scored ${score}/${questions.length} — lesson complete! 🎉`
                : `You scored ${score}/${questions.length}. Review the sections above and try again.`}
            </p>
            {!passed && (
              <Button variant="outline" size="sm" onClick={handleRetry} className="w-fit">
                <RotateCcw data-icon="inline-start" />
                Try again
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
