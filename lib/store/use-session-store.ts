"use client"

import { create } from "zustand"
import type { AnswerRecord, PracticeSession, UserProfile } from "@/types"
import {
  createSessionFromIntake,
  mockHistory,
  mockProfile,
} from "@/lib/mock-data"

interface SessionState {
  profile: UserProfile
  sessions: PracticeSession[]

  // Derived helpers
  getSession: (id: string) => PracticeSession | undefined
  remainingFreeQuestions: () => number

  // Actions
  startSession: (exam: string, examCode: string, focusTopics: string[]) => string
  answerQuestion: (
    sessionId: string,
    questionId: string,
    selectedOptionIds: string[],
    isCorrect: boolean,
    timeSpentSec: number,
  ) => void
  toggleMarkForReview: (sessionId: string, questionId: string) => void
  skipQuestion: (sessionId: string, questionId: string) => void
  goToIndex: (sessionId: string, index: number) => void
  completeSession: (sessionId: string) => void
}

export const useSessionStore = create<SessionState>((set, get) => ({
  profile: mockProfile,
  sessions: mockHistory,

  getSession: (id) => get().sessions.find((s) => s.id === id),

  remainingFreeQuestions: () => {
    const { profile } = get()
    if (profile.plan === "pro") return Infinity
    return Math.max(0, profile.dailyLimit - profile.questionsUsedToday)
  },

  startSession: (exam, examCode, focusTopics) => {
    const session = createSessionFromIntake(exam, examCode, focusTopics)
    set((state) => ({ sessions: [session, ...state.sessions] }))
    return session.id
  },

  answerQuestion: (sessionId, questionId, selectedOptionIds, isCorrect, timeSpentSec) => {
    set((state) => ({
      profile: {
        ...state.profile,
        questionsUsedToday: state.profile.questionsUsedToday + 1,
      },
      sessions: state.sessions.map((s) => {
        if (s.id !== sessionId) return s
        const record: AnswerRecord = {
          questionId,
          selectedOptionIds,
          isCorrect,
          markedForReview: s.answers[questionId]?.markedForReview ?? false,
          skipped: false,
          timeSpentSec,
        }
        return { ...s, answers: { ...s.answers, [questionId]: record } }
      }),
    }))
  },

  toggleMarkForReview: (sessionId, questionId) => {
    set((state) => ({
      sessions: state.sessions.map((s) => {
        if (s.id !== sessionId) return s
        const existing = s.answers[questionId]
        const record: AnswerRecord = existing
          ? { ...existing, markedForReview: !existing.markedForReview }
          : {
              questionId,
              selectedOptionIds: [],
              isCorrect: false,
              markedForReview: true,
              skipped: false,
              timeSpentSec: 0,
            }
        return { ...s, answers: { ...s.answers, [questionId]: record } }
      }),
    }))
  },

  skipQuestion: (sessionId, questionId) => {
    set((state) => ({
      sessions: state.sessions.map((s) => {
        if (s.id !== sessionId) return s
        const existing = s.answers[questionId]
        if (existing?.isCorrect !== undefined && existing.selectedOptionIds.length) return s
        const record: AnswerRecord = {
          questionId,
          selectedOptionIds: [],
          isCorrect: false,
          markedForReview: existing?.markedForReview ?? false,
          skipped: true,
          timeSpentSec: existing?.timeSpentSec ?? 0,
        }
        return { ...s, answers: { ...s.answers, [questionId]: record } }
      }),
    }))
  },

  goToIndex: (sessionId, index) => {
    set((state) => ({
      sessions: state.sessions.map((s) =>
        s.id === sessionId ? { ...s, currentIndex: index } : s,
      ),
    }))
  },

  completeSession: (sessionId) => {
    set((state) => ({
      sessions: state.sessions.map((s) =>
        s.id === sessionId
          ? { ...s, status: "completed", completedAt: new Date().toISOString() }
          : s,
      ),
    }))
  },
}))
