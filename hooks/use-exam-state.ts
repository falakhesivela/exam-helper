"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { api, USE_MOCKS } from "@/lib/api/client"
import type { Confidence, DragAnswer, PracticeSession } from "@/types"

export interface ExamAnswerState {
  answers: Record<string, string[]>
  dragAnswers: Record<string, DragAnswer>
  flagged: Set<string>
  confidence: Record<string, Confidence>
  timeSpent: Record<string, number>
  index: number
}

/** True when the session has a server-anchored clock and unsaved progress to restore. */
export function isResumableExam(session: PracticeSession): boolean {
  return Boolean(
    session.mode === "exam" &&
      session.status === "in-progress" &&
      session.examStartedAt,
  )
}

/** Epoch-ms deadline for a started exam, or null before the clock starts. */
export function examDeadlineMs(session: PracticeSession): number | null {
  if (!session.examStartedAt || session.durationSec == null) return null
  const started = Date.parse(session.examStartedAt)
  if (Number.isNaN(started)) return null
  return started + session.durationSec * 1000
}

function seedFromSession(session: PracticeSession): ExamAnswerState {
  const answers: Record<string, string[]> = {}
  const dragAnswers: Record<string, DragAnswer> = {}
  const flagged = new Set<string>()
  const confidence: Record<string, Confidence> = {}
  const timeSpent: Record<string, number> = {}

  if (isResumableExam(session)) {
    for (const record of Object.values(session.answers)) {
      if (record.selectedOptionIds.length > 0) {
        answers[record.questionId] = record.selectedOptionIds
      }
      if (record.dragAnswer) dragAnswers[record.questionId] = record.dragAnswer
      if (record.markedForReview) flagged.add(record.questionId)
      if (record.confidence) confidence[record.questionId] = record.confidence
      if (record.timeSpentSec > 0) timeSpent[record.questionId] = record.timeSpentSec
    }
  }

  const maxIndex = Math.max(session.questions.length - 1, 0)
  const index = isResumableExam(session)
    ? Math.min(Math.max(session.currentIndex ?? 0, 0), maxIndex)
    : 0

  return { answers, dragAnswers, flagged, confidence, timeSpent, index }
}

/**
 * Holds all mid-exam answer state, seeded from the server session when the
 * exam is being resumed, and autosaves it back (debounced + interval +
 * pagehide flush) so an interrupted mock exam survives reloads and crashes.
 */
export function useExamState(session: PracticeSession) {
  const [seed] = useState(() => seedFromSession(session))
  const [answers, setAnswers] = useState(seed.answers)
  const [dragAnswers, setDragAnswers] = useState(seed.dragAnswers)
  const [flagged, setFlagged] = useState(seed.flagged)
  const [confidence, setConfidence] = useState(seed.confidence)
  const [timeSpent, setTimeSpent] = useState(seed.timeSpent)
  const [index, setIndex] = useState(seed.index)

  // --- autosave engine ---
  const sessionId = session.id
  const dirtyRef = useRef(false)
  const savingRef = useRef(false)
  const enabledRef = useRef(false)
  const stateRef = useRef({ answers, dragAnswers, flagged, confidence, timeSpent, index })
  stateRef.current = { answers, dragAnswers, flagged, confidence, timeSpent, index }

  const flush = useCallback(() => {
    if (USE_MOCKS || !enabledRef.current || !dirtyRef.current || savingRef.current) {
      return
    }
    dirtyRef.current = false
    savingRef.current = true
    const s = stateRef.current
    void api
      .saveExamState(sessionId, {
        answers: s.answers,
        dragAnswers: s.dragAnswers,
        flagged: [...s.flagged],
        currentIndex: s.index,
        timeSpent: s.timeSpent,
        confidence: s.confidence,
      })
      .catch(() => {
        // Autosave is best-effort — retry on the next tick.
        dirtyRef.current = true
      })
      .finally(() => {
        savingRef.current = false
      })
  }, [sessionId])

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const markDirty = useCallback(() => {
    dirtyRef.current = true
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(flush, 2000)
  }, [flush])

  /** Enable autosave once the exam is actually running (past the rules screen). */
  const setAutosaveEnabled = useCallback((enabled: boolean) => {
    enabledRef.current = enabled
  }, [])

  useEffect(() => {
    const interval = setInterval(flush, 20_000)
    const onHide = () => {
      if (document.visibilityState === "hidden") flush()
    }
    window.addEventListener("visibilitychange", onHide)
    window.addEventListener("pagehide", flush)
    return () => {
      clearInterval(interval)
      window.removeEventListener("visibilitychange", onHide)
      window.removeEventListener("pagehide", flush)
      if (debounceRef.current) clearTimeout(debounceRef.current)
      flush()
    }
  }, [flush])

  return {
    answers,
    setAnswers,
    dragAnswers,
    setDragAnswers,
    flagged,
    setFlagged,
    confidence,
    setConfidence,
    timeSpent,
    setTimeSpent,
    index,
    setIndex,
    resumed: isResumableExam(session) && Object.keys(seed.answers).length + Object.keys(seed.dragAnswers).length > 0,
    markDirty,
    flush,
    setAutosaveEnabled,
  }
}
