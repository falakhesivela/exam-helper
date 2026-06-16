"use client"

import { useCallback, useEffect, useRef } from "react"
import { toast } from "sonner"
import type { PracticeSession } from "@/types"
import { api } from "@/lib/api/client"
import { useSessionStore } from "@/lib/store/use-session-store"

function mergeSession(existing: PracticeSession | undefined, incoming: PracticeSession) {
  if (!existing) return incoming
  return {
    ...incoming,
    currentIndex: Math.max(existing.currentIndex, incoming.currentIndex),
    answers: { ...incoming.answers, ...existing.answers },
  }
}

export function useSessionSync(sessionId: string, session: PracticeSession | undefined) {
  const mergeIntoStore = useCallback((incoming: PracticeSession) => {
    useSessionStore.setState((state) => {
      const existing = state.sessions.find((s) => s.id === sessionId)
      const merged = mergeSession(existing, incoming)
      const idx = state.sessions.findIndex((s) => s.id === sessionId)
      const sessions =
        idx === -1
          ? [merged, ...state.sessions]
          : state.sessions.map((s) => (s.id === sessionId ? merged : s))
      return { sessions }
    })
  }, [sessionId])

  const pollNow = useCallback(async () => {
    try {
      const fresh = await api.getSession(sessionId)
      mergeIntoStore(fresh)
      return fresh
    } catch {
      return undefined
    }
  }, [sessionId, mergeIntoStore])

  const pollRef = useRef(pollNow)
  pollRef.current = pollNow

  useEffect(() => {
    if (!session) return

    if (session.generationStatus === "failed") {
      toast.error("Question generation failed. Please start a new session.")
      return
    }

    if (session.generationStatus !== "generating") return

    const id = window.setInterval(() => {
      void pollRef.current()
    }, 2500)

    return () => window.clearInterval(id)
  }, [session?.generationStatus, session?.id])

  return {
    pollNow,
    isGenerating: session?.generationStatus === "generating",
    expectedTotal: session?.expectedQuestionCount ?? session?.questions.length ?? 0,
    availableCount: session?.questions.length ?? 0,
    generationFailed: session?.generationStatus === "failed",
  }
}
