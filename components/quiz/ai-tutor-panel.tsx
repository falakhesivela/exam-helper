"use client"

import { useEffect, useState } from "react"
import { motion } from "motion/react"
import { MessageCircle, Sparkles } from "lucide-react"
import { Spinner } from "@/components/ui/spinner"
import { api } from "@/lib/api/client"
import type { DragAnswer, Question } from "@/types"

interface AiTutorPanelProps {
  question: Question
  selectedOptionIds: string[]
  dragAnswer?: DragAnswer
}

/** Optional AI follow-up when the learner misses a question. */
export function AiTutorPanel({
  question,
  selectedOptionIds,
}: AiTutorPanelProps) {
  const [reply, setReply] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(null)
    void api
      .practiceTutor(question.id, selectedOptionIds)
      .then((res) => {
        if (!cancelled) setReply(res.reply)
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Could not load tutor tip")
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [question.id, selectedOptionIds])

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: "auto" }}
      className="overflow-hidden"
    >
      <div className="rounded-2xl border border-primary/20 bg-primary/5 p-4">
        <p className="mb-2 flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-primary">
          <Sparkles className="size-3.5" />
          AI tutor
        </p>
        {loading ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Spinner className="size-4" />
            Thinking about your answer…
          </div>
        ) : error ? (
          <p className="text-sm text-muted-foreground">{error}</p>
        ) : (
          <p className="flex gap-2 text-sm leading-relaxed text-foreground/90">
            <MessageCircle className="mt-0.5 size-4 shrink-0 text-primary" />
            {reply}
          </p>
        )}
      </div>
    </motion.div>
  )
}
