"use client"

import { motion } from "motion/react"
import { BookOpen, CheckCircle2, ExternalLink, XCircle } from "lucide-react"
import type { Question } from "@/types"
import { cn } from "@/lib/utils"

interface ExplanationPanelProps {
  question: Question
  isCorrect: boolean
}

/** Animated reveal of the answer explanation and references. */
export function ExplanationPanel({ question, isCorrect }: ExplanationPanelProps) {
  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: "auto" }}
      transition={{ duration: 0.3 }}
      className="overflow-hidden"
    >
      <div className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-4">
        <div
          className={cn(
            "flex items-center gap-2 text-sm font-semibold",
            isCorrect ? "text-success" : "text-destructive",
          )}
        >
          {isCorrect ? (
            <CheckCircle2 className="size-4.5" />
          ) : (
            <XCircle className="size-4.5" />
          )}
          {isCorrect ? "Correct" : "Not quite"}
        </div>

        <div className="flex flex-col gap-1.5">
          <p className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-muted-foreground">
            <BookOpen className="size-3.5" />
            Explanation
          </p>
          <p className="text-sm leading-relaxed text-foreground/90">
            {question.explanation}
          </p>
        </div>

        {question.references.length > 0 && (
          <div className="flex flex-col gap-1.5 border-t border-border pt-3">
            {question.references.map((ref) => (
              <a
                key={ref.url}
                href={ref.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 text-xs font-medium text-primary hover:underline"
              >
                <ExternalLink className="size-3.5" />
                {ref.label}
              </a>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  )
}
