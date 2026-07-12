"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { api, ApiClientError } from "@/lib/api/client"

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
        })),
      )
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

  useEffect(
    () => () => {
      abortRef.current?.abort()
      clearReconcileTimers()
    },
    [clearReconcileTimers],
  )

  return {
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
    conversationId: idRef.current,
  }
}
