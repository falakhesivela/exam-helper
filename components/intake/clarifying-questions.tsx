"use client"

import { Sparkles } from "lucide-react"
import { motion } from "motion/react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import type { ClarifyingQuestion } from "@/types"

interface ClarifyingQuestionsProps {
  questions: ClarifyingQuestion[]
  /** Controlled answers keyed by question id. */
  answers: Record<string, string>
  onAnswerChange: (questionId: string, value: string | undefined) => void
}

/**
 * Displays the AI's clarifying questions as friendly chat-style bubbles with
 * single-select chip answers. Controlled by the intake form so answers survive
 * step navigation.
 */
export function ClarifyingQuestions({
  questions,
  answers,
  onAnswerChange,
}: ClarifyingQuestionsProps) {
  return (
    <Card className="border-primary/20">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <span className="flex size-6 items-center justify-center rounded-full bg-primary/15 text-primary">
            <Sparkles className="size-3.5" />
          </span>
          A few quick questions
        </CardTitle>
        <CardDescription>
          This helps us tailor the difficulty and topic mix for you.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-5">
        {questions.map((q, i) => (
          <motion.div
            key={q.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08 }}
            className="flex flex-col gap-2.5"
          >
            <p className="rounded-2xl rounded-bl-sm bg-secondary px-3.5 py-2.5 text-sm">
              {q.question}
            </p>
            <ToggleGroup
              multiple={false}
              value={answers[q.id] ? [answers[q.id]] : []}
              onValueChange={(value: string[]) =>
                onAnswerChange(q.id, value[value.length - 1])
              }
              className="flex-wrap justify-start gap-2"
            >
              {q.suggestions.map((s) => (
                <ToggleGroupItem
                  key={s}
                  value={s}
                  className="rounded-md border border-border aria-pressed:border-primary aria-pressed:bg-primary/15 aria-pressed:text-primary"
                >
                  {s}
                </ToggleGroupItem>
              ))}
            </ToggleGroup>
          </motion.div>
        ))}
      </CardContent>
    </Card>
  )
}
