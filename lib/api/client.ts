import type {
  ClarifyingQuestion,
  LearnTopic,
  PracticeSession,
  TopicLesson,
  TopicMastery,
  UserProfile,
} from "@/types"
import { consumeSse } from "./stream"
import { buildMockBookmarks, buildMockMissedQuestions } from "@/lib/mock-data"

export class ApiClientError extends Error {
  status: number
  code?: string
  remaining?: number

  constructor(
    message: string,
    status: number,
    extra?: { code?: string; remaining?: number },
  ) {
    super(message)
    this.status = status
    this.code = extra?.code
    this.remaining = extra?.remaining
  }
}

function getTimezone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone
  } catch {
    return "UTC"
  }
}

async function request<T>(
  path: string,
  init?: RequestInit,
): Promise<T> {
  const res = await fetch(path, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      "X-Timezone": getTimezone(),
      ...init?.headers,
    },
    credentials: "include",
  })

  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new ApiClientError(
      body.error ?? res.statusText,
      res.status,
      { code: body.code, remaining: body.remaining },
    )
  }

  return res.json() as Promise<T>
}

export const api = {
  me: () => request<UserProfile>("/api/me"),

  clarify: async (description: string, handlers?: {
    onStatus?: (message: string) => void
    onQuestion?: (index: number, question: ClarifyingQuestion) => void
  }) => {
    const questions: ClarifyingQuestion[] = []
    const result = await consumeSse<{
      needsClarification: boolean
      questions: ClarifyingQuestion[]
    }>(
      "/api/intake/clarify",
      { description },
      {
        onStatus: handlers?.onStatus,
        onEvent: (event, data) => {
          if (event === "question") {
            const { index, question } = data as {
              index: number
              question: ClarifyingQuestion
            }
            questions[index] = question
            handlers?.onQuestion?.(index, question)
          }
        },
      },
    )
    return {
      needsClarification: result.needsClarification,
      questions: result.questions.length > 0 ? result.questions : questions,
    }
  },

  uploadPdf: async (file: File) => {
    const form = new FormData()
    form.append("file", file)
    const res = await fetch("/api/uploads", {
      method: "POST",
      body: form,
      credentials: "include",
      headers: { "X-Timezone": getTimezone() },
    })
    if (!res.ok) {
      const body = await res.json().catch(() => ({}))
      throw new ApiClientError(body.error ?? res.statusText, res.status)
    }
    return res.json() as Promise<{ fileId: string }>
  },

  generateSession: async (
    params: {
      description: string
      clarifications?: Record<string, string>
      fileId?: string
      count?: number
    },
    handlers?: {
      onStatus?: (message: string) => void
      onMetadata?: (meta: {
        exam?: string
        examCode?: string
        focusTopics?: string[]
      }) => void
      onQuestionPreview?: (index: number, preview: { topic?: string }) => void
      onQuestion?: (index: number) => void
    },
  ) =>
    consumeSse<PracticeSession & { remainingFreeQuestions?: number }>(
      "/api/intake/generate",
      params,
      {
        onStatus: handlers?.onStatus,
        onEvent: (event, data) => {
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
            handlers?.onQuestion?.(index)
          }
        },
      },
    ),

  startExam: (params: {
    questionCount: number
    durationSec: number
    exam?: string
    examCode?: string
    description?: string
    focusTopicsText?: string
    focusTopics?: string[]
    fileId?: string
    focusDomainIds?: string[]
  }) =>
    consumeSse<PracticeSession & { remainingFreeQuestions?: number }>(
      "/api/exams",
      params,
    ),

  listSessions: () => request<PracticeSession[]>("/api/sessions"),

  getSession: (id: string) => request<PracticeSession>(`/api/sessions/${id}`),

  answerQuestion: (
    sessionId: string,
    body: {
      questionId: string
      selectedOptionIds: string[]
      dragAnswer?: import("@/types").DragAnswer
      timeSpentSec: number
      confidence?: import("@/types").Confidence
    },
  ) =>
    request<{
      answer: PracticeSession["answers"][string]
      question: PracticeSession["questions"][number]
      session: PracticeSession
      remainingFreeQuestions: number
    }>(`/api/sessions/${sessionId}/answer`, {
      method: "PATCH",
      body: JSON.stringify(body),
    }),

  markQuestion: (sessionId: string, questionId: string) =>
    request<PracticeSession>(`/api/sessions/${sessionId}/mark`, {
      method: "PATCH",
      body: JSON.stringify({ questionId }),
    }),

  skipQuestion: (sessionId: string, questionId: string) =>
    request<PracticeSession>(`/api/sessions/${sessionId}/skip`, {
      method: "PATCH",
      body: JSON.stringify({ questionId }),
    }),

  setCursor: (sessionId: string, index: number) =>
    request<PracticeSession>(`/api/sessions/${sessionId}/cursor`, {
      method: "PATCH",
      body: JSON.stringify({ index }),
    }),

  submitExam: (
    sessionId: string,
    answers: Record<string, string[]>,
    flagged: string[],
    timeUsedSec: number,
    dragAnswers: Record<string, import("@/types").DragAnswer> = {},
  ) =>
    request<PracticeSession>(`/api/sessions/${sessionId}/submit`, {
      method: "POST",
      body: JSON.stringify({ answers, dragAnswers, flagged, timeUsedSec }),
    }),

  completeSession: (sessionId: string) =>
    request<PracticeSession>(`/api/sessions/${sessionId}/complete`, {
      method: "POST",
    }),

  topicMastery: () => request<TopicMastery[]>("/api/progress/mastery"),

  missedQuestions: (dueOnly = false) => {
    if (USE_MOCKS) {
      const items = buildMockMissedQuestions()
      return Promise.resolve({ items, count: items.length })
    }
    return request<{
      items: Array<{
        questionId: string
        sessionId: string
        exam: string
        examCode: string
        answeredAt: string
        question: PracticeSession["questions"][number]
      }>
      count: number
    }>(`/api/progress/missed?due=${dueOnly}`)
  },

  retryMissedQuestion: (
    questionId: string,
    body: {
      selectedOptionIds: string[]
      dragAnswer?: import("@/types").DragAnswer
      timeSpentSec?: number
    },
  ) =>
    request<{
      isCorrect: boolean
      question: PracticeSession["questions"][number]
      remainingCount: number
    }>(`/api/progress/missed/${questionId}/retry`, {
      method: "POST",
      body: JSON.stringify(body),
    }),

  practiceTutor: (
    questionId: string,
    selectedOptionIds: string[],
    messages: { role: "user" | "assistant"; content: string }[] = [],
  ) => {
    if (USE_MOCKS) {
      const last = messages.filter((m) => m.role === "user").at(-1)?.content ?? ""
      return Promise.resolve({ reply: mockTutorReply(last) })
    }
    return request<{ reply: string }>("/api/practice/tutor", {
      method: "POST",
      body: JSON.stringify({ questionId, selectedOptionIds, messages }),
    })
  },

  masteryTrend: () =>
    request<{ label: string; mastery: number }[]>("/api/progress/trend"),

  examAccuracy: () =>
    request<Record<string, { accuracy: number; questions: number }>>(
      "/api/progress/exam-accuracy",
    ),

  readinessTrend: () =>
    request<{ label: string; score: number }[]>(
      "/api/progress/readiness/trend",
    ),

  getPlan: () => request<import("@/types").StudyPlan | null>("/api/plan"),

  createPlan: (targetDate: string) =>
    request<import("@/types").StudyPlan>("/api/plan", {
      method: "POST",
      body: JSON.stringify({ targetDate }),
    }),

  updatePlanTask: (
    taskId: string,
    status: import("@/types").StudyTaskStatus,
  ) =>
    request<import("@/types").StudyPlanTask>(`/api/plan/tasks/${taskId}`, {
      method: "PATCH",
      body: JSON.stringify({ status }),
    }),

  coachPlan: () =>
    request<import("@/types").PlanCoaching>("/api/plan/coach", {
      method: "POST",
    }),

  streak: () => request<import("@/types").StreakSummary>("/api/streak"),

  updateDailyGoal: (dailyGoal: number) =>
    request<{ dailyGoal: number }>("/api/streak", {
      method: "PATCH",
      body: JSON.stringify({ dailyGoal }),
    }),

  progressSummary: () =>
    request<{
      overallMastery: number
      lifetimeAnswered: number
      streakDays: number
    }>("/api/progress/summary"),

  learnTopics: () => request<LearnTopic[]>("/api/learn/topics"),

  getLesson: (topicSlug: string) =>
    request<TopicLesson>(`/api/learn/lessons/${topicSlug}`),

  generateLesson: (topicSlug: string, force = false) =>
    request<TopicLesson>(
      `/api/learn/lessons/${topicSlug}/generate${force ? "?force=true" : ""}`,
      { method: "POST" },
    ),

  startLesson: (topicSlug: string) =>
    request<TopicLesson>(`/api/learn/lessons/${topicSlug}/start`, {
      method: "POST",
    }),

  updateLessonProgress: (
    lessonId: string,
    body: { status?: "started" | "completed"; bookmarked?: boolean },
  ) =>
    request<{ status: "started" | "completed"; bookmarked: boolean }>(
      `/api/learn/progress/${lessonId}`,
      { method: "PATCH", body: JSON.stringify(body) },
    ),

  signOut: () =>
    request<{ ok: boolean }>("/api/auth/signout", { method: "POST" }),

  bookmarks: () => {
    if (USE_MOCKS) {
      const items = buildMockBookmarks()
      return Promise.resolve({ items, count: items.length })
    }
    return request<{ items: import("@/types").Bookmark[]; count: number }>(
      "/api/bookmarks",
    )
  },

  bookmarkIds: () => {
    if (USE_MOCKS) {
      return Promise.resolve({ ids: buildMockBookmarks().map((b) => b.questionId) })
    }
    return request<{ ids: string[] }>("/api/bookmarks/ids")
  },

  addBookmark: (questionId: string) => {
    if (USE_MOCKS) return Promise.resolve({ ok: true, questionId })
    return request<{ ok: boolean }>("/api/bookmarks", {
      method: "POST",
      body: JSON.stringify({ questionId }),
    })
  },

  removeBookmark: (questionId: string) => {
    if (USE_MOCKS) return Promise.resolve({ ok: true, questionId })
    return request<{ ok: boolean }>("/api/bookmarks", {
      method: "DELETE",
      body: JSON.stringify({ questionId }),
    })
  },
}

export const USE_MOCKS =
  process.env.NEXT_PUBLIC_USE_MOCKS === "true" ||
  (!process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NODE_ENV === "development")

/** Canned tutor replies for mock mode (no AI call). */
function mockTutorReply(lastUserMessage: string): string {
  const msg = lastUserMessage.toLowerCase()
  if (msg.includes("mnemonic")) {
    return "Try \"RICE\": Read-replicas Improve Concurrent rEads. When a question stresses read scaling without touching writes, RICE points you to read replicas."
  }
  if (msg.includes("correct") || msg.includes("right")) {
    return "The correct option directly addresses read scalability: read replicas serve read traffic off the primary, so latency drops during peak reads. The others fix availability or backups, not read throughput."
  }
  if (msg.includes("beginner") || msg.includes("new") || msg.includes("simply")) {
    return "Think of one busy cashier (the primary database). Read replicas are extra cashiers who can only ring up 'read' customers, so the line moves faster — without changing how new stock is added (writes)."
  }
  return "Good question. Focus on what the scenario optimizes for: here it's read latency under load. Map each option to the bottleneck it solves, and pick the one that targets reads specifically."
}
