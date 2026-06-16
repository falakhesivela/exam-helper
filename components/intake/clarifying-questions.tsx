"use client"

import { useState } from "react"
import { Sparkles } from "lucide-react"
import { motion } from "motion/react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import type { ClarifyingQuestion } from "@/types"

interface ClarifyingQuestionsProps {
  questions: ClarifyingQuestion[]
}

/**
 * Displays the AI's clarifying questions as friendly chat-style bubbles with
 * single-select chip answers. Purely presentational for the prototype.
 */
export function ClarifyingQuestions({ questions }: ClarifyingQuestionsProps) {
  const [answers, setAnswers] = useState<Record<string, string>>({})

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
              type="single"
              value={answers[q.id]}
              onValueChange={(v) => v && setAnswers((a) => ({ ...a, [q.id]: v }))}
              className="flex-wrap justify-start gap-2"
            >
              {q.suggestions.map((s) => (
                <ToggleGroupItem
                  key={s}
                  value={s}
                  className="rounded-full border border-border data-[state=on]:border-primary data-[state=on]:bg-primary/15 data-[state=on]:text-primary"
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
