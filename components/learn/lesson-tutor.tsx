"use client"

import { useEffect, useRef, useState } from "react"
import { Send, Sparkles } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"
import { api } from "@/lib/api/client"
import { useSessionStore } from "@/lib/store/use-session-store"
import { cn } from "@/lib/utils"

interface LessonTutorProps {
  topicSlug: string
  topicName: string
}

type ChatMessage = { role: "user" | "assistant"; content: string }

const SUGGESTIONS = [
  "Explain this more simply",
  "Give me a mnemonic",
  "How does this show up on the exam?",
  "Quiz me with a quick scenario",
]

/** Lesson-context tutor thread: free-form questions about the current topic. */
export function LessonTutor({ topicSlug, topicName }: LessonTutorProps) {
  const activeExamCode = useSessionStore((s) => s.activeExamCode)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  /** Partial assistant reply while tokens stream in. */
  const [streamingReply, setStreamingReply] = useState("")
  const [input, setInput] = useState("")
  const [sending, setSending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const threadRef = useRef<HTMLDivElement>(null)

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
      const res = await api.lessonTutor(topicSlug, next, {
        onDelta: (t) => setStreamingReply((prev) => prev + t),
        exam: activeExamCode,
      })
      setMessages([...next, { role: "assistant", content: res.reply }])
    } catch (err) {
      setError(err instanceof Error ? err.message : "Tutor unavailable")
      setMessages(messages)
    } finally {
      setStreamingReply("")
      setSending(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Sparkles className="size-4 text-primary" />
          Ask the tutor
        </CardTitle>
        <CardDescription>
          Questions about {topicName}? Get an answer without leaving the lesson.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        {(messages.length > 0 || sending) && (
          <div ref={threadRef} className="flex max-h-72 flex-col gap-2 overflow-y-auto">
            {messages.map((m, i) => (
              <div
                key={i}
                className={cn(
                  "max-w-[85%] rounded-xl px-3 py-2 text-sm leading-relaxed",
                  m.role === "assistant"
                    ? "self-start bg-muted text-foreground/90"
                    : "self-end bg-primary text-primary-foreground",
                )}
              >
                {m.content}
              </div>
            ))}
            {streamingReply && (
              <div className="max-w-[85%] self-start rounded-xl bg-muted px-3 py-2 text-sm leading-relaxed text-foreground/90">
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
        )}

        {error && <p className="text-xs text-destructive">{error}</p>}

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
            placeholder={`Ask anything about ${topicName}…`}
            aria-label="Ask the AI tutor about this topic"
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
      </CardContent>
    </Card>
  )
}
