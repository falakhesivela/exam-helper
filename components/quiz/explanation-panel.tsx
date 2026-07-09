"use client"

import { useState } from "react"
import { motion } from "motion/react"
import { toast } from "sonner"
import {
  Bookmark,
  BookmarkCheck,
  BookOpen,
  CheckCircle2,
  ExternalLink,
  Flag,
  XCircle,
} from "lucide-react"
import type { Question } from "@/types"
import { Markdown } from "@/components/ui/markdown"
import { api } from "@/lib/api/client"
import { useSessionStore } from "@/lib/store/use-session-store"
import { cn } from "@/lib/utils"

interface ExplanationPanelProps {
  question: Question
  isCorrect: boolean
}

const REPORT_REASONS = [
  { value: "wrong_answer", label: "Wrong answer" },
  { value: "unclear", label: "Unclear" },
  { value: "typo", label: "Typo" },
  { value: "other", label: "Other" },
] as const

/** Collapsed-by-default flag control for bad AI-generated questions. */
function ReportQuestion({ questionId }: { questionId: string }) {
  const [open, setOpen] = useState(false)
  const [sending, setSending] = useState(false)
  const [reported, setReported] = useState(false)

  async function report(reason: (typeof REPORT_REASONS)[number]["value"]) {
    if (sending) return
    setSending(true)
    try {
      await api.reportQuestion(questionId, reason)
      setReported(true)
      setOpen(false)
      toast.success("Thanks — we'll review this question.")
    } catch {
      toast.error("Couldn't send the report. Please try again.")
    } finally {
      setSending(false)
    }
  }

  if (reported) {
    return (
      <p className="flex items-center gap-1.5 border-t border-border pt-3 text-xs text-muted-foreground">
        <Flag className="size-3.5" />
        Reported — thanks for the heads-up.
      </p>
    )
  }

  return (
    <div className="flex flex-col gap-2 border-t border-border pt-3">
      {open ? (
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-xs text-muted-foreground">What's wrong?</span>
          {REPORT_REASONS.map((r) => (
            <button
              key={r.value}
              type="button"
              disabled={sending}
              onClick={() => void report(r.value)}
              className="rounded-full border border-border px-2.5 py-1 text-xs font-medium text-muted-foreground transition-colors hover:border-destructive/50 hover:text-destructive disabled:opacity-50"
            >
              {r.label}
            </button>
          ))}
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="px-1.5 text-xs text-muted-foreground hover:text-foreground"
          >
            Cancel
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="flex w-fit items-center gap-1.5 text-xs text-muted-foreground/70 transition-colors hover:text-foreground"
        >
          <Flag className="size-3.5" />
          Something wrong with this question?
        </button>
      )}
    </div>
  )
}

/** Animated reveal of the answer explanation and references. */
export function ExplanationPanel({ question, isCorrect }: ExplanationPanelProps) {
  const bookmarked = useSessionStore((s) => s.bookmarkedIds.includes(question.id))
  const toggleBookmark = useSessionStore((s) => s.toggleBookmark)

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: "auto" }}
      transition={{ duration: 0.3 }}
      className="overflow-hidden"
    >
      <div className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-4">
        <div className="flex items-center justify-between gap-2">
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
          <button
            type="button"
            onClick={() => void toggleBookmark(question.id)}
            aria-pressed={bookmarked}
            className={cn(
              "flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium transition-colors",
              bookmarked
                ? "border-primary bg-primary/10 text-primary"
                : "border-border text-muted-foreground hover:border-foreground/40",
            )}
          >
            {bookmarked ? (
              <BookmarkCheck className="size-3.5" />
            ) : (
              <Bookmark className="size-3.5" />
            )}
            {bookmarked ? "Saved" : "Save"}
          </button>
        </div>

        <div className="flex flex-col gap-1.5">
          <p className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-muted-foreground">
            <BookOpen className="size-3.5" />
            Explanation
          </p>
          <Markdown className="text-sm leading-relaxed text-foreground/90">
            {question.explanation}
          </Markdown>
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

        <ReportQuestion questionId={question.id} />
      </div>
    </motion.div>
  )
}
