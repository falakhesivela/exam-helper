"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  ArrowDown,
  BookOpen,
  Bot,
  Check,
  Copy,
  ListPlus,
  MessageSquarePlus,
  RotateCcw,
  Send,
  Sparkles,
  Square,
  User,
} from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"
import { Textarea } from "@/components/ui/textarea"
import { ThinkingIndicator } from "@/components/ui/thinking-indicator"
import { MentorMessageContent } from "@/components/mentor/mentor-message-content"
import { MentorQuotaNotice } from "@/components/mentor/mentor-quota-notice"
import { useMentorChat } from "@/hooks/use-mentor-chat"
import { ApiClientError } from "@/lib/api/client"
import { getExamBlueprint } from "@/lib/exams"
import { consumeMentorSeed } from "@/lib/mentor/seed"
import {
  buildMentorFollowUpActions,
  buildMentorSuggestions,
  type MentorSuggestion,
} from "@/lib/mentor/suggestions"
import { computeExamReadiness } from "@/lib/progress/readiness"
import { useSessionStore } from "@/lib/store/use-session-store"
import { cn } from "@/lib/utils"

interface MentorChatProps {
  /** Omitted for a brand-new thread — the server mints the id on first send. */
  conversationId?: string
  /**
   * Pre-filled first message (e.g. deep-linked from an exam debrief). It seeds
   * the composer rather than auto-sending: arriving on a page shouldn't silently
   * spend a message from the user's quota.
   */
  seed?: string
}

export function MentorChat({ conversationId, seed }: MentorChatProps) {
  const router = useRouter()
  const topicMastery = useSessionStore((s) => s.topicMastery)
  const examAccuracy = useSessionStore((s) => s.examAccuracy)
  const activeExamCode = useSessionStore((s) => s.activeExamCode)
  const userExams = useSessionStore((s) => s.userExams)
  const messagesLeft = useSessionStore((s) => s.mentorMessagesLeft())
  const applyMentorUsage = useSessionStore((s) => s.applyMentorUsage)

  const [quizzing, setQuizzing] = useState(false)
  const [copied, setCopied] = useState<string | null>(null)
  const [showPrompts, setShowPrompts] = useState(false)
  const [nearBottom, setNearBottom] = useState(true)
  const threadRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const {
    messages,
    streamingReply,
    input,
    setInput,
    status,
    error,
    send,
    stop,
    reconcile,
    retryLast,
  } = useMentorChat({
    conversationId,
    seed,
    activeExamCode,
    quotaRemaining: messagesLeft,
    onUsage: applyMentorUsage,
  })

  const blueprint = activeExamCode ? getExamBlueprint(activeExamCode) : null
  const readiness = useMemo(
    () =>
      blueprint
        ? computeExamReadiness(
            blueprint,
            topicMastery,
            examAccuracy[blueprint.examCode],
          )
        : null,
    [blueprint, topicMastery, examAccuracy],
  )
  const daysToExam = useMemo(() => {
    const exam = userExams.find(
      (item) => item.examCode.toUpperCase() === activeExamCode?.toUpperCase(),
    )
    if (!exam?.examDate) return null
    return Math.max(
      0,
      Math.ceil(
        (new Date(`${exam.examDate}T00:00:00`).getTime() - Date.now()) /
          86_400_000,
      ),
    )
  }, [activeExamCode, userExams])
  const suggestions = useMemo(
    () => buildMentorSuggestions(readiness, 4, { daysToExam }),
    [daysToExam, readiness],
  )
  const loading = status === "loading"
  const sending = status === "streaming"
  const blocked = status === "quota-blocked"
  const isEmpty = !loading && messages.length === 0 && !streamingReply

  useEffect(() => {
    const storedSeed = consumeMentorSeed()
    if (storedSeed) setInput(storedSeed)
  }, [setInput])

  useEffect(() => {
    const thread = threadRef.current
    if (!thread || !nearBottom) return
    thread.scrollTo({ top: thread.scrollHeight, behavior: "smooth" })
  }, [messages, nearBottom, sending, streamingReply])

  useEffect(() => {
    if (status === "idle" && !isEmpty) textareaRef.current?.focus()
  }, [isEmpty, messages.length, status])

  /**
   * "Quiz me on X" hands off to the Practice card with the domain pre-selected
   * — the real, metered, graded pipeline (chat questions would earn no mastery
   * credit), but with a chance to adjust size and difficulty before starting.
   */
  function startQuiz(domainName: string) {
    if (quizzing) return
    setQuizzing(true)
    sessionStorage.setItem("mentor:return", window.location.pathname)
    router.push(`/practice?topic=${encodeURIComponent(domainName)}`)
  }

  function onSuggestion(suggestion: MentorSuggestion) {
    if (suggestion.focusDomain) {
      startQuiz(suggestion.focusDomain)
      return
    }
    void send(suggestion.prompt)
  }

  const latestAssistant = [...messages]
    .reverse()
    .find((message) => message.role === "assistant")
  const followUpActions = useMemo(
    () =>
      latestAssistant
        ? buildMentorFollowUpActions(readiness, latestAssistant.content, {
            daysToExam,
          })
        : [],
    [daysToExam, latestAssistant, readiness],
  )

  /** Quiz-card "explain my mistake": pre-fill only — never auto-send quota. */
  function prefillFollowUp(prompt: string) {
    setInput(prompt)
    textareaRef.current?.focus()
  }

  async function copyMessage(id: string, content: string) {
    await navigator.clipboard.writeText(content)
    setCopied(id)
    window.setTimeout(() => setCopied(null), 1600)
  }

  function scrollToLatest() {
    const thread = threadRef.current
    if (!thread) return
    thread.scrollTo({ top: thread.scrollHeight, behavior: "smooth" })
    setNearBottom(true)
  }

  return (
    <div className="relative flex min-h-0 flex-1 flex-col">
      <div
        ref={threadRef}
        onScroll={(event) => {
          const target = event.currentTarget
          setNearBottom(
            target.scrollHeight - target.scrollTop - target.clientHeight < 80,
          )
        }}
        className="no-scrollbar flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto px-1 pb-4"
        role="log"
        aria-label="Mentor conversation"
        aria-live="polite"
      >
        {loading && (
          <div className="flex flex-1 items-center justify-center gap-2 text-sm text-muted-foreground">
            <Spinner className="size-4" />
            Loading conversation…
          </div>
        )}

        {isEmpty && (
          <div className="mx-auto mt-auto flex w-full max-w-2xl flex-col gap-3 rounded-2xl border border-primary/20 bg-primary/5 p-5">
            <p className="flex items-center gap-2 font-medium text-primary">
              <Sparkles className="size-4" />
              Ask Mentor anything about {blueprint?.exam ?? "your exam"}
            </p>
            <p className="text-sm text-muted-foreground text-pretty">
              Mentor knows your exam blueprint, your uploaded syllabus, and which
              domains you&apos;re weakest in.
            </p>
          </div>
        )}

        {messages.map((message) => (
          <div
            key={message.id}
            className={cn(
              "group flex max-w-[92%] items-start gap-2 sm:max-w-[82%]",
              message.role === "user" ? "self-end flex-row-reverse" : "self-start",
            )}
          >
            <span
              className={cn(
                "mt-1 flex size-7 shrink-0 items-center justify-center rounded-full",
                message.role === "assistant"
                  ? "border bg-primary/10 text-primary"
                  : "bg-primary text-primary-foreground",
              )}
              aria-hidden
            >
              {message.role === "assistant" ? (
                <Bot className="size-3.5" />
              ) : (
                <User className="size-3.5" />
              )}
            </span>
            <div className="min-w-0">
              <div
                className={cn(
                  "rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed",
                  message.role === "assistant"
                    ? "border bg-card text-foreground/90"
                    : "bg-primary text-primary-foreground",
                )}
              >
                {message.role === "assistant" ? (
                  <MentorMessageContent
                    content={message.content}
                    onFollowUp={prefillFollowUp}
                  />
                ) : (
                  message.content
                )}
              </div>
              <div
                className={cn(
                  "mt-1 flex items-center gap-1 px-1 text-[10px] text-muted-foreground",
                  message.role === "user" && "justify-end",
                )}
              >
                <time dateTime={message.createdAt}>
                  {new Intl.DateTimeFormat(undefined, {
                    hour: "numeric",
                    minute: "2-digit",
                  }).format(new Date(message.createdAt))}
                </time>
                {message.role === "assistant" && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-xs"
                    className="size-6 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 sm:focus-visible:opacity-100"
                    onClick={() => void copyMessage(message.id, message.content)}
                    aria-label="Copy Mentor response"
                  >
                    {copied === message.id ? <Check /> : <Copy />}
                  </Button>
                )}
              </div>
            </div>
          </div>
        ))}

        {streamingReply && (
          <div className="flex max-w-[92%] items-start gap-2 self-start sm:max-w-[82%]">
            <span className="mt-1 flex size-7 shrink-0 items-center justify-center rounded-full border bg-primary/10 text-primary">
              <Bot className="size-3.5" />
            </span>
            <div className="rounded-2xl border bg-card px-3.5 py-2.5 text-sm leading-relaxed text-foreground/90">
              <MentorMessageContent content={streamingReply} streaming />
              <span className="ml-0.5 inline-block h-3.5 w-0.5 animate-pulse bg-primary align-middle" />
            </div>
          </div>
        )}

        {sending && !streamingReply && (
          <ThinkingIndicator label="Mentor is thinking" />
        )}

        {latestAssistant && !sending && (
          <div className="ml-9 flex flex-wrap gap-1.5">
            {followUpActions.map((action) =>
              action.type === "practice" ? (
                <Button
                  key={action.type}
                  type="button"
                  size="sm"
                  variant="outline"
                  className="rounded-full"
                  disabled={quizzing}
                  onClick={() => startQuiz(action.domainName)}
                >
                  <ListPlus />
                  {quizzing ? "Opening practice…" : action.label}
                </Button>
              ) : action.type === "plan" ? (
                <Button
                  key={action.type}
                  asChild
                  size="sm"
                  variant="outline"
                  className="rounded-full"
                >
                  <Link href="/plan">
                    <BookOpen />
                    {action.label}
                  </Link>
                </Button>
              ) : (
                <Button
                  key={action.type}
                  type="button"
                  size="sm"
                  variant="outline"
                  className="rounded-full"
                  onClick={() => {
                    setInput(action.prompt)
                    textareaRef.current?.focus()
                  }}
                >
                  <MessageSquarePlus />
                  {action.label}
                </Button>
              ),
            )}
          </div>
        )}
      </div>

      {!nearBottom && (
        <Button
          type="button"
          size="sm"
          variant="secondary"
          className="absolute bottom-36 left-1/2 z-10 -translate-x-1/2 rounded-full shadow-lg"
          onClick={scrollToLatest}
        >
          <ArrowDown />
          Latest
        </Button>
      )}

      {blocked && error instanceof ApiClientError && error.code === "QUOTA_LIMIT" && (
        <MentorQuotaNotice
          upgradeTier={error.upgradeTier}
          message={error.message}
        />
      )}

      {status === "conversation-limit" && (
        <Alert className="mb-3">
          <AlertTitle>Saved chat limit reached</AlertTitle>
          <AlertDescription className="flex flex-wrap items-center gap-2">
            Delete an old conversation from the Chats panel, then try again.
            <Button asChild size="sm" variant="outline">
              <Link href="/mentor">Manage chats</Link>
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {(status === "error" || status === "interrupted") && error && (
        <Alert variant="destructive" className="mb-3">
          <AlertTitle>
            {status === "interrupted" ? "Reconnecting" : "Message not confirmed"}
          </AlertTitle>
          <AlertDescription className="flex flex-wrap items-center gap-2">
            <span>{error.message}</span>
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => void reconcile()}
            >
              <RotateCcw />
              Refresh chat
            </Button>
            {status === "error" && (
              <Button
                type="button"
                size="sm"
                variant="ghost"
                onClick={retryLast}
              >
                Retry safely
              </Button>
            )}
          </AlertDescription>
        </Alert>
      )}

      {!blocked && status !== "conversation-limit" && (
        <div className="shrink-0 space-y-2 border-t pt-3">
          {(isEmpty || showPrompts) && suggestions.length > 0 && (
            <div className="flex flex-wrap gap-1.5" aria-label="Suggested prompts">
              {suggestions.map((s) => (
                <button
                  key={s.label}
                  type="button"
                  disabled={sending || quizzing}
                  onClick={() => onSuggestion(s)}
                  className="rounded-full border border-primary/30 px-2.5 py-1 text-xs text-primary transition-colors hover:bg-primary/10 disabled:opacity-50"
                >
                  {quizzing && s.focusDomain ? "Opening practice…" : s.label}
                </button>
              ))}
            </div>
          )}

          <form
            onSubmit={(e) => {
              e.preventDefault()
              void send(input)
            }}
            className="flex items-end gap-2 rounded-xl border bg-card p-2 focus-within:ring-2 focus-within:ring-ring/60"
          >
            <Textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault()
                  void send(input)
                }
              }}
              rows={2}
              maxLength={2000}
              placeholder="Ask Mentor about your exam…"
              aria-label="Ask Mentor a question"
              disabled={sending || loading}
              className="min-h-12 flex-1 resize-none border-0 bg-transparent shadow-none focus-visible:ring-0"
            />
            {sending ? (
              <Button
                type="button"
                size="icon"
                variant="outline"
                onClick={stop}
                aria-label="Stop generating"
              >
                <Square className="size-4" />
              </Button>
            ) : (
              <Button
                type="submit"
                size="icon"
                disabled={!input.trim() || loading}
                aria-label="Send"
              >
                <Send className="size-4" />
              </Button>
            )}
          </form>

          <div className="flex items-center justify-between gap-2 px-1 text-xs text-muted-foreground">
            <button
              type="button"
              onClick={() => setShowPrompts((current) => !current)}
              className="transition-colors hover:text-foreground"
            >
              {showPrompts ? "Hide prompts" : "Show prompts"}
            </button>
            {messagesLeft !== null && (
              <span>
                {messagesLeft} {messagesLeft === 1 ? "message" : "messages"} left
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
