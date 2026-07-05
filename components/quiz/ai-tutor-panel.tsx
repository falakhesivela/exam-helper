"use client"

import { useEffect, useRef, useState } from "react"
import { motion } from "motion/react"
import { Send, Sparkles } from "lucide-react"
import { Spinner } from "@/components/ui/spinner"
import { Button } from "@/components/ui/button"
import { api } from "@/lib/api/client"
import type { DragAnswer, Question } from "@/types"
import { cn } from "@/lib/utils"

interface AiTutorPanelProps {
  question: Question
  selectedOptionIds: string[]
  dragAnswer?: DragAnswer
}

type ChatMessage = { role: "user" | "assistant"; content: string }

const SUGGESTIONS = [
  "Why is the correct answer right?",
  "Give me a mnemonic",
  "Explain like I'm new",
]

/** AI tutor thread: an opening tip on a missed item, then free-form follow-ups. */
export function AiTutorPanel({
  question,
  selectedOptionIds,
  dragAnswer,
}: AiTutorPanelProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  /** Partial assistant reply while tokens stream in. */
  const [streamingReply, setStreamingReply] = useState("")
  const [input, setInput] = useState("")
  const [initialLoading, setInitialLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const threadRef = useRef<HTMLDivElement>(null)

  // Load the opening explanation when the panel mounts for a question.
  useEffect(() => {
    let cancelled = false
    setMessages([])
    setStreamingReply("")
    setInitialLoading(true)
    setError(null)
    void api
      .practiceTutor(question.id, selectedOptionIds, [], dragAnswer, {
        onDelta: (text) => {
          if (cancelled) return
          setInitialLoading(false)
          setStreamingReply((prev) => prev + text)
        },
      })
      .then((res) => {
        if (cancelled) return
        setStreamingReply("")
        setMessages([{ role: "assistant", content: res.reply }])
      })
      .catch((err) => {
        if (!cancelled)
          setError(err instanceof Error ? err.message : "Tutor unavailable")
      })
      .finally(() => {
        if (!cancelled) {
          setInitialLoading(false)
          setStreamingReply("")
        }
      })
    return () => {
      cancelled = true
    }
  }, [question.id, selectedOptionIds, dragAnswer])

  useEffect(() => {
    threadRef.current?.scrollTo({ top: threadRef.current.scrollHeight })
  }, [messages, sending, streamingReply])

  async function send(text: string) {
    const trimmed = text.trim()
    if (!trimmed || sending) return
    const next: ChatMessage[] = [...messages, { role: "user", content: trimmed }]
    setMessages(next)
    setInput("")
    setSending(true)
    setError(null)
    try {
      const res = await api.practiceTutor(
        question.id,
        selectedOptionIds,
        next,
        dragAnswer,
        { onDelta: (t) => setStreamingReply((prev) => prev + t) },
      )
      setMessages([...next, { role: "assistant", content: res.reply }])
    } catch (err) {
      setError(err instanceof Error ? err.message : "Tutor unavailable")
    } finally {
      setStreamingReply("")
      setSending(false)
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: "auto" }}
      className="overflow-hidden"
    >
      <div className="flex flex-col gap-3 rounded-2xl border border-primary/20 bg-primary/5 p-4">
        <p className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-primary">
          <Sparkles className="size-3.5" />
          AI tutor
        </p>

        <div ref={threadRef} className="flex max-h-72 flex-col gap-2 overflow-y-auto">
          {initialLoading ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Spinner className="size-4" />
              Thinking about your answer…
            </div>
          ) : (
            messages.map((m, i) => (
              <div
                key={i}
                className={cn(
                  "max-w-[85%] rounded-xl px-3 py-2 text-sm leading-relaxed",
                  m.role === "assistant"
                    ? "self-start bg-card text-foreground/90"
                    : "self-end bg-primary text-primary-foreground",
                )}
              >
                {m.content}
              </div>
            ))
          )}
          {streamingReply && (
            <div className="max-w-[85%] self-start rounded-xl bg-card px-3 py-2 text-sm leading-relaxed text-foreground/90">
              {streamingReply}
              <span className="ml-0.5 inline-block h-3.5 w-0.5 animate-pulse bg-primary align-middle" />
            </div>
          )}
          {sending && !streamingReply && (
            <div className="flex items-center gap-2 self-start text-sm text-muted-foreground">
              <Spinner className="size-4" />
              Typing…
            </div>
          )}
        </div>

        {error && <p className="text-xs text-destructive">{error}</p>}

        {!initialLoading && (
          <>
            <div className="flex flex-wrap gap-1.5">
              {SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  type="button"
                  disabled={sending}
                  onClick={() => void send(s)}
                  className="rounded-full border border-primary/30 px-2.5 py-1 text-xs text-primary transition-colors hover:bg-primary/10 disabled:opacity-50"
                >
                  {s}
                </button>
              ))}
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault()
                void send(input)
              }}
              className="flex items-center gap-2"
            >
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask a follow-up…"
                aria-label="Ask the AI tutor a follow-up question"
                disabled={sending}
                className="flex-1 rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring disabled:opacity-50"
              />
              <Button
                type="submit"
                size="icon"
                disabled={sending || !input.trim()}
                aria-label="Send"
              >
                <Send className="size-4" />
              </Button>
            </form>
          </>
        )}
      </div>
    </motion.div>
  )
}
