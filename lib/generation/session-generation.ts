"use client"

import { create } from "zustand"
import type { PracticeSession } from "@/types"
import { startSseStream } from "@/lib/api/stream"
import { ApiClientError } from "@/lib/api/client"
import { useSessionStore } from "@/lib/store/use-session-store"

export interface GenerationProgressHandlers {
  onStatus?: (message: string) => void
  onMetadata?: (meta: {
    exam?: string
    examCode?: string
    focusTopics?: string[]
  }) => void
  onQuestionPreview?: (index: number, preview: { topic?: string }) => void
  onQuestion?: (index: number) => void
  onReady?: (session: PracticeSession) => void
  onDone?: (session: PracticeSession) => void
  onError?: (error: Error) => void
}

interface ActiveGeneration {
  sessionId: string
  mode: "practice" | "exam"
  expectedCount: number
  completedCount: number
  status: "generating" | "complete" | "failed"
  statusMessage: string
}

interface GenerationState {
  active: ActiveGeneration | null
  abort: (() => void) | null
  startPracticeGeneration: (
    params: {
      description: string
      clarifications?: Record<string, string>
      fileId?: string
      count?: number
    },
    handlers?: GenerationProgressHandlers,
  ) => void
  startExamGeneration: (
    params: {
      questionCount: number
      durationSec: number
      exam?: string
      examCode?: string
    },
    handlers?: GenerationProgressHandlers,
  ) => void
  clear: () => void
}

function mergeSessionIntoStore(session: PracticeSession) {
  useSessionStore.setState((state) => {
    const existing = state.sessions.find((s) => s.id === session.id)
    const merged: PracticeSession = existing
      ? {
          ...session,
          currentIndex: Math.max(existing.currentIndex, session.currentIndex),
          answers: { ...session.answers, ...existing.answers },
        }
      : session
    const idx = state.sessions.findIndex((s) => s.id === merged.id)
    const sessions =
      idx === -1
        ? [merged, ...state.sessions]
        : state.sessions.map((s) => (s.id === merged.id ? merged : s))
    return { sessions }
  })
}

function wireSseHandlers(
  set: (fn: (state: GenerationState) => Partial<GenerationState>) => void,
  get: () => GenerationState,
  handlers: GenerationProgressHandlers | undefined,
  mode: "practice" | "exam",
  expectedCount: number,
) {
  return {
    onStatus: (message: string) => {
      set((state) => ({
        active: state.active
          ? { ...state.active, statusMessage: message }
          : state.active,
      }))
      handlers?.onStatus?.(message)
    },
    onEvent: (event: string, data: unknown) => {
      if (event === "metadata") {
        handlers?.onMetadata?.(
          data as {
            exam?: string
            examCode?: string
            focusTopics?: string[]
          },
        )
      } else if (event === "question_preview") {
        const { index, topic } = data as { index: number; topic?: string }
        handlers?.onQuestionPreview?.(index, { topic })
      } else if (event === "question") {
        const { index } = data as { index: number }
        set((state) => ({
          active: state.active
            ? { ...state.active, completedCount: index + 1 }
            : state.active,
        }))
        handlers?.onQuestion?.(index)
      } else if (event === "ready") {
        const { sessionId, session } = data as {
          sessionId: string
          session: PracticeSession
        }
        mergeSessionIntoStore(session)
        set(() => ({
          active: {
            sessionId,
            mode,
            expectedCount,
            completedCount: session.questions.length,
            status: "generating",
            statusMessage: "Generating remaining questions…",
          },
        }))
        handlers?.onReady?.(session)
      }
    },
    onDone: (data: PracticeSession & { remainingFreeQuestions?: number }) => {
      mergeSessionIntoStore(data)
      void useSessionStore.getState().hydrate()
      void useSessionStore.getState().refreshProfile()
      set(() => ({
        active: get().active
          ? {
              ...get().active!,
              status: "complete",
              completedCount: expectedCount,
              statusMessage: "All questions ready",
            }
          : null,
      }))
      handlers?.onDone?.(data)
      setTimeout(() => get().clear(), 1500)
    },
  }
}

export const useGenerationStore = create<GenerationState>((set, get) => ({
  active: null,
  abort: null,

  clear: () => {
    get().abort?.()
    set({ active: null, abort: null })
  },

  startPracticeGeneration: (params, handlers) => {
    get().clear()
    const count = params.count ?? 5

    const { promise, abort } = startSseStream<
      PracticeSession & { remainingFreeQuestions?: number }
    >(
      "/api/intake/generate",
      params,
      wireSseHandlers(set, get, handlers, "practice", count),
    )

    set({ abort })

    void promise.catch((err) => {
      if (err instanceof Error && err.name === "AbortError") return
      set((state) => ({
        active: state.active ? { ...state.active, status: "failed" } : null,
      }))
      handlers?.onError?.(
        err instanceof ApiClientError
          ? err
          : err instanceof Error
            ? err
            : new Error("Generation failed"),
      )
    })
  },

  startExamGeneration: (params, handlers) => {
    get().clear()

    const { promise, abort } = startSseStream<
      PracticeSession & { remainingFreeQuestions?: number }
    >(
      "/api/exams",
      params,
      wireSseHandlers(set, get, handlers, "exam", params.questionCount),
    )

    set({ abort })

    void promise.catch((err) => {
      if (err instanceof Error && err.name === "AbortError") return
      set((state) => ({
        active: state.active ? { ...state.active, status: "failed" } : null,
      }))
      handlers?.onError?.(
        err instanceof ApiClientError
          ? err
          : err instanceof Error
            ? err
            : new Error("Generation failed"),
      )
    })
  },
}))

export function getActiveGenerationForSession(sessionId: string) {
  const active = useGenerationStore.getState().active
  if (!active || active.sessionId !== sessionId) return null
  return active
}
