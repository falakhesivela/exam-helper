"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import type { Confidence, MentorQuizAttempt } from "@/types"
import { api, ApiClientError } from "@/lib/api/client"
import { useSessionStore } from "@/lib/store/use-session-store"

export type MentorChatStatus =
  | "idle"
  | "loading"
  | "streaming"
  | "interrupted"
  | "quota-blocked"
  | "conversation-limit"
  | "error"

export interface MentorUiMessage {
  id: string
  role: "user" | "assistant"
  content: string
  createdAt: string
  /**
   * The persisted row id, when there is one. Quick-check attempts are keyed by
   * it, so a card can only save an answer once its message exists server-side —
   * which is why /mentor/chat returns the id rather than leaving the client to
   * reload the thread first.
   */
  serverId?: number
}

interface UseMentorChatOptions {
  conversationId?: string
  seed?: string
  activeExamCode: string | null
  quotaRemaining: number | null
  onUsage: (remaining: number | null) => void
}

export function useMentorChat({
  conversationId,
  seed,
  activeExamCode,
  quotaRemaining,
  onUsage,
}: UseMentorChatOptions) {
  const [messages, setMessages] = useState<MentorUiMessage[]>([])
  const [quizAttempts, setQuizAttempts] = useState<MentorQuizAttempt[]>([])
  const [streamingReply, setStreamingReply] = useState("")
  const [input, setInput] = useState(seed ?? "")
  const [status, setStatus] = useState<MentorChatStatus>(
    conversationId ? "loading" : quotaRemaining === 0 ? "quota-blocked" : "idle",
  )
  const [error, setError] = useState<ApiClientError | Error | null>(null)
  const abortRef = useRef<AbortController | null>(null)
  const idRef = useRef<string | undefined>(conversationId)
  const lastSendRef = useRef<{ text: string; clientMessageId: string } | null>(
    null,
  )
  const reconcileTimersRef = useRef<number[]>([])

  const clearReconcileTimers = useCallback(() => {
    for (const timer of reconcileTimersRef.current) window.clearTimeout(timer)
    reconcileTimersRef.current = []
  }, [])

  const loadConversation = useCallback(async (id: string, initial = false) => {
    if (initial) setStatus("loading")
    try {
      const result = await api.mentorConversation(id)
      setMessages(
        result.messages.map((message) => ({
          id: `server-${message.id}`,
          role: message.role,
          content: message.content,
          createdAt: message.createdAt,
          serverId: message.id,
        })),
      )
      setQuizAttempts(result.quizAttempts ?? [])
      setStreamingReply("")
      setError(null)
      setStatus(quotaRemaining === 0 ? "quota-blocked" : "idle")
      return result.messages
    } catch (caught) {
      const normalized =
        caught instanceof Error ? caught : new Error("Could not load conversation")
      setError(normalized)
      setStatus("error")
      return null
    }
  }, [quotaRemaining])

  useEffect(() => {
    if (!conversationId) return
    idRef.current = conversationId
    void loadConversation(conversationId, true)
  }, [conversationId, loadConversation])

  useEffect(() => {
    if (quotaRemaining === 0 && status === "idle") setStatus("quota-blocked")
    if (quotaRemaining !== 0 && status === "quota-blocked") setStatus("idle")
  }, [quotaRemaining, status])

  const reconcile = useCallback(async () => {
    if (!idRef.current) return null
    return loadConversation(idRef.current)
  }, [loadConversation])

  const scheduleReconcile = useCallback(() => {
    clearReconcileTimers()
    for (const delay of [900, 2500, 5000]) {
      reconcileTimersRef.current.push(
        window.setTimeout(() => {
          void reconcile()
        }, delay),
      )
    }
  }, [clearReconcileTimers, reconcile])

  const send = useCallback(
    async (text: string, retryId?: string) => {
      const trimmed = text.trim()
      if (
        !trimmed ||
        status === "loading" ||
        status === "streaming" ||
        quotaRemaining === 0
      )
        return

      clearReconcileTimers()
      const clientMessageId = retryId ?? crypto.randomUUID()
      lastSendRef.current = { text: trimmed, clientMessageId }
      const now = new Date().toISOString()
      const optimisticId = `client-${clientMessageId}`
      setMessages((current) =>
        current.some((message) => message.id === optimisticId)
          ? current
          : [
              ...current,
              {
                id: optimisticId,
                role: "user",
                content: trimmed,
                createdAt: now,
              },
            ],
      )
      setInput("")
      setStreamingReply("")
      setError(null)
      setStatus("streaming")

      const controller = new AbortController()
      abortRef.current = controller

      try {
        const result = await api.mentorChat(trimmed, {
          conversationId: idRef.current,
          examCode: activeExamCode,
          clientMessageId,
          signal: controller.signal,
          onReady: (data) => {
            if (!idRef.current) {
              idRef.current = data.conversationId
              // Updating native history keeps this component alive while giving
              // reload/share the canonical persisted conversation URL.
              window.history.replaceState(
                window.history.state,
                "",
                `/mentor/${data.conversationId}`,
              )
            }
          },
          onDelta: (textDelta) =>
            setStreamingReply((current) => current + textDelta),
        })
        setMessages((current) => [
          ...current,
          {
            id: `assistant-${clientMessageId}`,
            role: "assistant",
            content: result.reply,
            createdAt: new Date().toISOString(),
            // Present unless the insert didn't report a row back; a card
            // without it simply grades locally and skips saving.
            serverId: result.messageId ?? undefined,
          },
        ])
        setStreamingReply("")
        onUsage(result.remaining)
        setStatus(result.remaining === 0 ? "quota-blocked" : "idle")
        lastSendRef.current = null
        window.dispatchEvent(new Event("mentor:changed"))
      } catch (caught) {
        setStreamingReply("")
        if (caught instanceof Error && caught.name === "AbortError") {
          setStatus("interrupted")
          setError(new Error("Response interrupted. Reconnecting to saved chat…"))
          scheduleReconcile()
        } else if (
          caught instanceof ApiClientError &&
          caught.code === "QUOTA_LIMIT"
        ) {
          setError(caught)
          setStatus("quota-blocked")
        } else if (
          caught instanceof ApiClientError &&
          caught.code === "CONVERSATION_LIMIT"
        ) {
          setError(caught)
          setStatus("conversation-limit")
        } else if (
          caught instanceof ApiClientError &&
          caught.code === "MESSAGE_PENDING"
        ) {
          setError(caught)
          setStatus("interrupted")
          scheduleReconcile()
        } else {
          const normalized =
            caught instanceof Error ? caught : new Error("Could not send message")
          setError(normalized)
          setStatus("error")
          // The backend persists before generation; reconcile instead of
          // rolling back and risking a duplicate retry.
          scheduleReconcile()
        }
      } finally {
        abortRef.current = null
      }
    },
    [
      activeExamCode,
      clearReconcileTimers,
      onUsage,
      quotaRemaining,
      scheduleReconcile,
      status,
    ],
  )

  const retryLast = useCallback(() => {
    const last = lastSendRef.current
    if (!last) return
    void send(last.text, last.clientMessageId)
  }, [send])

  const stop = useCallback(() => abortRef.current?.abort(), [])

  /**
   * Persist a quick-check answer and keep the local copy in step.
   *
   * The optimistic entry lands first so the card stays revealed even if the
   * request is slow, then the server's row replaces it — the server regrades
   * from the stored message, so its `isCorrect` wins over the card's local
   * verdict. A failure is swallowed on purpose: the learner has already seen
   * their result, and losing the saved copy of a free quick check is not worth
   * an error banner over the conversation.
   */
  const recordQuizAttempt = useCallback(
    async (input: {
      messageId: number
      quizIndex: number
      selectedOptionIds: string[]
      isCorrect: boolean
      attempts: number
      confidence?: Confidence
    }) => {
      const optimistic: MentorQuizAttempt = {
        messageId: input.messageId,
        quizIndex: input.quizIndex,
        selectedOptionIds: input.selectedOptionIds,
        isCorrect: input.isCorrect,
        attempts: input.attempts,
        confidence: input.confidence ?? null,
        answeredAt: new Date().toISOString(),
      }
      const replace = (attempt: MentorQuizAttempt) =>
        setQuizAttempts((current) => [
          ...current.filter(
            (a) =>
              a.messageId !== attempt.messageId ||
              a.quizIndex !== attempt.quizIndex,
          ),
          attempt,
        ])

      replace(optimistic)
      try {
        const result = await api.mentorQuizAttempt({
          messageId: input.messageId,
          quizIndex: input.quizIndex,
          selectedOptionIds: input.selectedOptionIds,
          attempts: input.attempts,
          confidence: input.confidence,
        })
        replace(result.attempt)
        // A first-attempt correct answer awards XP, so the level ring and
        // league standings in the store are now stale.
        if (result.isCorrect && input.attempts === 1) {
          void useSessionStore.getState().refreshGamification()
        }
      } catch {
        // Keep the optimistic row — it still reflects what the learner did.
      }
    },
    [],
  )

  useEffect(
    () => () => {
      abortRef.current?.abort()
      clearReconcileTimers()
    },
    [clearReconcileTimers],
  )

  return {
    messages,
    quizAttempts,
    recordQuizAttempt,
    streamingReply,
    input,
    setInput,
    status,
    error,
    send,
    stop,
    reconcile,
    retryLast,
    conversationId: idRef.current,
  }
}
