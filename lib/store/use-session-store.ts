"use client"

import { create } from "zustand"
import type { AnswerRecord, LearnTopic, PracticeSession, TopicLesson, TopicMastery, UserProfile } from "@/types"
import { api, USE_MOCKS } from "@/lib/api/client"
import {
  buildMockLearnTopics,
  buildMockTopicLesson,
  createExamSession,
  createSessionFromIntake,
  generateMockTopicLesson,
  emptyProfile,
  mockHistory,
  mockMasteryTrend,
  mockProfile,
  mockTopicMastery,
  type ExamConfig,
} from "@/lib/mock-data"
import { isAnswerCorrect } from "@/lib/session-utils"

interface SessionState {
  profile: UserProfile
  sessions: PracticeSession[]
  topicMastery: TopicMastery[]
  masteryTrend: { label: string; mastery: number }[]
  learnTopics: LearnTopic[]
  hydrated: boolean

  getSession: (id: string) => PracticeSession | undefined
  remainingFreeQuestions: () => number

  hydrate: () => Promise<void>
  refreshProfile: () => Promise<void>
  refreshLearnTopics: () => Promise<void>
  fetchLesson: (topicSlug: string) => Promise<TopicLesson>
  generateLesson: (topicSlug: string, force?: boolean) => Promise<TopicLesson>
  ensureLesson: (topicSlug: string) => Promise<TopicLesson>
  updateLessonProgress: (
    lessonId: string,
    updates: { status?: "started" | "completed"; bookmarked?: boolean },
  ) => Promise<void>

  startSession: (
    exam: string,
    examCode: string,
    focusTopics: string[],
  ) => Promise<string>
  startExam: (config: ExamConfig) => Promise<string>
  submitExam: (
    sessionId: string,
    answers: Record<string, string[]>,
    timeUsedSec: number,
  ) => Promise<void>
  answerQuestion: (
    sessionId: string,
    questionId: string,
    selectedOptionIds: string[],
    timeSpentSec: number,
  ) => Promise<{ isCorrect: boolean }>
  toggleMarkForReview: (sessionId: string, questionId: string) => Promise<void>
  skipQuestion: (sessionId: string, questionId: string) => Promise<void>
  goToIndex: (sessionId: string, index: number) => Promise<void>
  completeSession: (sessionId: string) => Promise<void>
}

function upsertSession(
  sessions: PracticeSession[],
  session: PracticeSession,
): PracticeSession[] {
  const idx = sessions.findIndex((s) => s.id === session.id)
  if (idx === -1) return [session, ...sessions]
  const next = [...sessions]
  next[idx] = session
  return next
}

export const useSessionStore = create<SessionState>((set, get) => ({
  profile: USE_MOCKS ? mockProfile : emptyProfile,
  sessions: USE_MOCKS ? mockHistory : [],
  topicMastery: USE_MOCKS ? mockTopicMastery : [],
  masteryTrend: USE_MOCKS ? mockMasteryTrend : [],
  learnTopics: USE_MOCKS ? buildMockLearnTopics() : [],
  hydrated: false,

  getSession: (id) => get().sessions.find((s) => s.id === id),

  remainingFreeQuestions: () => {
    const { profile } = get()
    if (profile.plan === "pro") return Infinity
    return Math.max(0, profile.dailyLimit - profile.questionsUsedToday)
  },

  hydrate: async () => {
    if (USE_MOCKS || get().hydrated) return
    try {
      const [profile, sessions, topicMastery, masteryTrend, learnTopics] =
        await Promise.all([
          api.me(),
          api.listSessions(),
          api.topicMastery(),
          api.masteryTrend(),
          api.learnTopics(),
        ])
      set({ profile, sessions, topicMastery, masteryTrend, learnTopics, hydrated: true })
    } catch {
      set({ profile: emptyProfile, sessions: [], topicMastery: [], masteryTrend: [], learnTopics: [], hydrated: true })
    }
  },

  refreshProfile: async () => {
    if (USE_MOCKS) return
    try {
      const profile = await api.me()
      set({ profile })
    } catch {
      // ignore
    }
  },

  refreshLearnTopics: async () => {
    if (USE_MOCKS) {
      set({ learnTopics: buildMockLearnTopics() })
      return
    }
    try {
      const learnTopics = await api.learnTopics()
      set({ learnTopics })
    } catch {
      // ignore
    }
  },

  fetchLesson: async (topicSlug) => {
    if (USE_MOCKS) return buildMockTopicLesson(topicSlug)
    return api.getLesson(topicSlug)
  },

  generateLesson: async (topicSlug, force = false) => {
    if (USE_MOCKS) {
      const lesson = generateMockTopicLesson(topicSlug)
      set((state) => ({
        learnTopics: state.learnTopics.map((t) =>
          t.slug === topicSlug
            ? {
                ...t,
                lessonId: lesson.id,
                lessonStatus: "started",
                hasAiContent: true,
              }
            : t,
        ),
      }))
      return lesson
    }

    const lesson = await api.generateLesson(topicSlug, force)
    await get().refreshLearnTopics()
    return lesson
  },

  ensureLesson: async (topicSlug) => {
    if (USE_MOCKS) {
      const lesson = buildMockTopicLesson(topicSlug)
      return { ...lesson, id: lesson.id ?? `lesson-${topicSlug}`, status: "started" }
    }
    const lesson = await api.startLesson(topicSlug)
    await get().refreshLearnTopics()
    return lesson
  },

  updateLessonProgress: async (lessonId, updates) => {
    if (USE_MOCKS) {
      set((state) => ({
        learnTopics: state.learnTopics.map((t) =>
          t.lessonId === lessonId
            ? {
                ...t,
                lessonStatus: updates.status ?? t.lessonStatus,
                bookmarked:
                  updates.bookmarked !== undefined
                    ? updates.bookmarked
                    : t.bookmarked,
              }
            : t,
        ),
      }))
      return
    }

    await api.updateLessonProgress(lessonId, updates)
    await get().refreshLearnTopics()
  },

  startSession: async (exam, examCode, focusTopics) => {
    if (USE_MOCKS) {
      const session = createSessionFromIntake(exam, examCode, focusTopics)
      set((state) => ({ sessions: [session, ...state.sessions] }))
      return session.id
    }
    throw new Error("Use api.generateSession from intake flow")
  },

  startExam: async (config) => {
    if (USE_MOCKS) {
      const session = createExamSession(config)
      set((state) => ({ sessions: [session, ...state.sessions] }))
      return session.id
    }
    const session = await api.startExam({
      questionCount: config.questionCount,
      durationSec: config.durationSec,
      exam: config.exam,
      examCode: config.examCode,
    })
    set((state) => ({
      sessions: [session, ...state.sessions],
    }))
    await get().refreshProfile()
    return session.id
  },

  submitExam: async (sessionId, answers, timeUsedSec) => {
    if (USE_MOCKS) {
      set((state) => {
        let answeredCount = 0
        const sessions = state.sessions.map((s) => {
          if (s.id !== sessionId) return s
          const records: PracticeSession["answers"] = {}
          for (const q of s.questions) {
            const selected = answers[q.id] ?? []
            const answered = selected.length > 0
            if (answered) answeredCount += 1
            records[q.id] = {
              questionId: q.id,
              selectedOptionIds: selected,
              isCorrect: answered ? isAnswerCorrect(q, selected) : false,
              markedForReview: s.answers[q.id]?.markedForReview ?? false,
              skipped: !answered,
              timeSpentSec: 0,
            }
          }
          return {
            ...s,
            answers: records,
            status: "completed" as const,
            completedAt: new Date().toISOString(),
            timeUsedSec,
          }
        })
        return {
          sessions,
          profile: {
            ...state.profile,
            questionsUsedToday: state.profile.questionsUsedToday + answeredCount,
          },
        }
      })
      return
    }

    const session = await api.submitExam(sessionId, answers, timeUsedSec)
    set((state) => ({
      sessions: upsertSession(state.sessions, session),
    }))
    await get().refreshProfile()
  },

  answerQuestion: async (sessionId, questionId, selectedOptionIds, timeSpentSec) => {
    if (USE_MOCKS) {
      const session = get().sessions.find((s) => s.id === sessionId)
      const question = session?.questions.find((q) => q.id === questionId)
      const isCorrect = question
        ? isAnswerCorrect(question, selectedOptionIds)
        : false
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
      return { isCorrect }
    }

    const result = await api.answerQuestion(sessionId, {
      questionId,
      selectedOptionIds,
      timeSpentSec,
    })

    set((state) => ({
      sessions: upsertSession(state.sessions, {
        ...result.session,
        questions: result.session.questions.map((q) =>
          q.id === questionId ? result.question : q,
        ),
        answers: {
          ...result.session.answers,
          [questionId]: result.answer,
        },
      }),
    }))

    await get().refreshProfile()
    return { isCorrect: result.answer.isCorrect }
  },

  toggleMarkForReview: async (sessionId, questionId) => {
    if (USE_MOCKS) {
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
      return
    }

    const session = await api.markQuestion(sessionId, questionId)
    set((state) => ({
      sessions: upsertSession(state.sessions, session),
    }))
  },

  skipQuestion: async (sessionId, questionId) => {
    if (USE_MOCKS) {
      set((state) => ({
        sessions: state.sessions.map((s) => {
          if (s.id !== sessionId) return s
          const existing = s.answers[questionId]
          if (existing?.isCorrect !== undefined && existing.selectedOptionIds.length)
            return s
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
      return
    }

    const session = await api.skipQuestion(sessionId, questionId)
    set((state) => ({
      sessions: upsertSession(state.sessions, session),
    }))
  },

  goToIndex: async (sessionId, index) => {
    if (USE_MOCKS) {
      set((state) => ({
        sessions: state.sessions.map((s) =>
          s.id === sessionId ? { ...s, currentIndex: index } : s,
        ),
      }))
      return
    }

    const session = await api.setCursor(sessionId, index)
    set((state) => ({
      sessions: upsertSession(state.sessions, session),
    }))
  },

  completeSession: async (sessionId) => {
    if (USE_MOCKS) {
      set((state) => ({
        sessions: state.sessions.map((s) =>
          s.id === sessionId
            ? { ...s, status: "completed", completedAt: new Date().toISOString() }
            : s,
        ),
      }))
      return
    }

    const session = await api.completeSession(sessionId)
    set((state) => ({
      sessions: upsertSession(state.sessions, session),
    }))
    await get().refreshProfile()
  },
}))
