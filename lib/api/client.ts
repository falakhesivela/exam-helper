"use client";

import type {
  ClarifyingQuestion,
  LearnTopic,
  PracticeSession,
  TopicLesson,
  TopicMastery,
  UserProfile,
} from "@/types";
import { buildApiFetchInit } from "./fetch-init";
import { consumeSse } from "./stream";
import {
  buildMockBookmarks,
  buildMockMissedQuestions,
  buildMockTeam,
} from "@/lib/mock-data";

export class ApiClientError extends Error {
  status: number;
  code?: string;
  remaining?: number;

  constructor(
    message: string,
    status: number,
    extra?: { code?: string; remaining?: number },
  ) {
    super(message);
    this.status = status;
    this.code = extra?.code;
    this.remaining = extra?.remaining;
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const { url, init: fetchInit } = await buildApiFetchInit(path, init);
  const res = await fetch(url, fetchInit);

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new ApiClientError(body.error ?? res.statusText, res.status, {
      code: body.code,
      remaining: body.remaining,
    });
  }

  return res.json() as Promise<T>;
}

export const api = {
  me: () => request<UserProfile>("/api/me"),

  clarify: async (
    description: string,
    handlers?: {
      onStatus?: (message: string) => void;
      onQuestion?: (index: number, question: ClarifyingQuestion) => void;
      signal?: AbortSignal;
    },
  ) => {
    const questions: ClarifyingQuestion[] = [];
    const result = await consumeSse<{
      needsClarification: boolean;
      questions: ClarifyingQuestion[];
    }>(
      "/api/intake/clarify",
      { description },
      {
        onStatus: handlers?.onStatus,
        signal: handlers?.signal,
        onEvent: (event, data) => {
          if (event === "question") {
            const { index, question } = data as {
              index: number;
              question: ClarifyingQuestion;
            };
            questions[index] = question;
            handlers?.onQuestion?.(index, question);
          }
        },
      },
    );
    return {
      needsClarification: result.needsClarification,
      questions: result.questions.length > 0 ? result.questions : questions,
    };
  },

  uploadPdf: async (file: File) => {
    const form = new FormData();
    form.append("file", file);
    const { url, init: fetchInit } = await buildApiFetchInit("/api/uploads", {
      method: "POST",
      body: form,
    });
    const res = await fetch(url, fetchInit);
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new ApiClientError(body.error ?? res.statusText, res.status);
    }
    return res.json() as Promise<{ fileId: string }>;
  },

  generateSession: async (
    params: {
      description: string;
      clarifications?: Record<string, string>;
      fileId?: string;
      count?: number;
    },
    handlers?: {
      onStatus?: (message: string) => void;
      onMetadata?: (meta: {
        exam?: string;
        examCode?: string;
        focusTopics?: string[];
      }) => void;
      onQuestionPreview?: (index: number, preview: { topic?: string }) => void;
      onQuestion?: (index: number) => void;
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
                exam?: string;
                examCode?: string;
                focusTopics?: string[];
              },
            );
          } else if (event === "question_preview") {
            const { index, topic } = data as { index: number; topic?: string };
            handlers?.onQuestionPreview?.(index, { topic });
          } else if (event === "question") {
            const { index } = data as { index: number };
            handlers?.onQuestion?.(index);
          }
        },
      },
    ),

  startExam: (params: {
    questionCount: number;
    durationSec: number;
    exam?: string;
    examCode?: string;
    description?: string;
    focusTopicsText?: string;
    focusTopics?: string[];
    fileId?: string;
    focusDomainIds?: string[];
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
      questionId: string;
      selectedOptionIds: string[];
      dragAnswer?: import("@/types").DragAnswer;
      timeSpentSec: number;
      confidence?: import("@/types").Confidence;
    },
  ) =>
    request<{
      answer: PracticeSession["answers"][string];
      question: PracticeSession["questions"][number];
      session: PracticeSession;
      /** null = unlimited on the user's tier. */
      remainingFreeQuestions: number | null;
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
      const items = buildMockMissedQuestions();
      return Promise.resolve({ items, count: items.length });
    }
    return request<{
      items: Array<{
        questionId: string;
        sessionId: string;
        exam: string;
        examCode: string;
        answeredAt: string;
        question: PracticeSession["questions"][number];
      }>;
      count: number;
    }>(`/api/progress/missed?due=${dueOnly}`);
  },

  retryMissedQuestion: (
    questionId: string,
    body: {
      selectedOptionIds: string[];
      dragAnswer?: import("@/types").DragAnswer;
      timeSpentSec?: number;
    },
  ) =>
    request<{
      isCorrect: boolean;
      question: PracticeSession["questions"][number];
      remainingCount: number;
    }>(`/api/progress/missed/${questionId}/retry`, {
      method: "POST",
      body: JSON.stringify(body),
    }),

  practiceTutor: (
    questionId: string,
    selectedOptionIds: string[],
    messages: { role: "user" | "assistant"; content: string }[] = [],
    dragAnswer?: import("@/types").DragAnswer,
    opts?: { onDelta?: (text: string) => void; signal?: AbortSignal },
  ) => {
    if (USE_MOCKS) {
      const last =
        messages.filter((m) => m.role === "user").at(-1)?.content ?? "";
      const reply = mockTutorReply(last);
      opts?.onDelta?.(reply);
      return Promise.resolve({ reply });
    }
    return consumeSse<{ reply: string }>(
      "/api/practice/tutor",
      { questionId, selectedOptionIds, messages, dragAnswer },
      {
        signal: opts?.signal,
        onEvent: (event, data) => {
          if (event === "delta") {
            const text = (data as { text?: string }).text;
            if (text) opts?.onDelta?.(text);
          }
        },
      },
    );
  },

  rateFlashcard: (questionId: string, known: boolean) => {
    if (USE_MOCKS) return Promise.resolve({ ok: true });
    return request<{ ok: boolean }>("/api/flashcards/rate", {
      method: "POST",
      body: JSON.stringify({ questionId, known }),
    });
  },

  masteryTrend: () =>
    request<{ label: string; mastery: number }[]>("/api/progress/trend"),

  examAccuracy: () =>
    request<Record<string, { accuracy: number; questions: number }>>(
      "/api/progress/exam-accuracy",
    ),

  readinessTrend: () =>
    request<{ label: string; score: number; date?: string }[]>(
      "/api/progress/readiness/trend",
    ),

  getPlan: () => request<import("@/types").StudyPlan | null>("/api/plan"),

  createPlan: (input: {
    targetDate: string;
    restDays?: number[];
    effort?: import("@/types").PlanEffort;
  }) =>
    request<import("@/types").StudyPlan>("/api/plan", {
      method: "POST",
      body: JSON.stringify(input),
    }),

  patchPlan: (input: {
    targetDate?: string;
    restDays?: number[];
    effort?: import("@/types").PlanEffort;
  }) =>
    request<import("@/types").StudyPlan>("/api/plan", {
      method: "PATCH",
      body: JSON.stringify(input),
    }),

  deletePlan: () =>
    request<null>("/api/plan", { method: "DELETE" }),

  updatePlanTask: (
    taskId: string,
    updates: {
      status?: import("@/types").StudyTaskStatus;
      scheduledDate?: string;
    },
  ) =>
    request<import("@/types").StudyPlanTask>(`/api/plan/tasks/${taskId}`, {
      method: "PATCH",
      body: JSON.stringify(updates),
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
      overallMastery: number;
      lifetimeAnswered: number;
      streakDays: number;
    }>("/api/progress/summary"),

  learnTopics: () => request<LearnTopic[]>("/api/learn/topics"),

  getLesson: (topicSlug: string) =>
    request<TopicLesson>(`/api/learn/lessons/${topicSlug}`),

  generateLesson: (
    topicSlug: string,
    force = false,
    opts?: {
      /** Partial lesson snapshots while the model writes (streaming UI). */
      onDelta?: (
        partial: import("@/lib/ai/index").StreamingLessonContent,
      ) => void;
    },
  ) =>
    consumeSse<TopicLesson>(
      `/api/learn/lessons/${topicSlug}/generate${force ? "?force=true" : ""}`,
      {},
      {
        onEvent: (event, data) => {
          if (event === "delta") {
            opts?.onDelta?.(
              data as import("@/lib/ai/index").StreamingLessonContent,
            );
          }
        },
      },
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
      const items = buildMockBookmarks();
      return Promise.resolve({ items, count: items.length });
    }
    return request<{ items: import("@/types").Bookmark[]; count: number }>(
      "/api/bookmarks",
    );
  },

  bookmarkIds: () => {
    if (USE_MOCKS) {
      return Promise.resolve({
        ids: buildMockBookmarks().map((b) => b.questionId),
      });
    }
    return request<{ ids: string[] }>("/api/bookmarks/ids");
  },

  addBookmark: (questionId: string) => {
    if (USE_MOCKS) return Promise.resolve({ ok: true, questionId });
    return request<{ ok: boolean }>("/api/bookmarks", {
      method: "POST",
      body: JSON.stringify({ questionId }),
    });
  },

  removeBookmark: (questionId: string) => {
    if (USE_MOCKS) return Promise.resolve({ ok: true, questionId });
    return request<{ ok: boolean }>("/api/bookmarks", {
      method: "DELETE",
      body: JSON.stringify({ questionId }),
    });
  },

  reportQuestion: (
    questionId: string,
    reason: "wrong_answer" | "unclear" | "typo" | "other",
    detail?: string,
  ) => {
    if (USE_MOCKS) return Promise.resolve({ ok: true });
    return request<{ ok: boolean }>("/api/questions/report", {
      method: "POST",
      body: JSON.stringify({ questionId, reason, detail }),
    });
  },

  team: () => {
    if (USE_MOCKS) return Promise.resolve(buildMockTeam());
    return request<import("@/types").Team | null>("/api/team");
  },

  createTeam: (name: string) => {
    if (USE_MOCKS) return Promise.resolve(buildMockTeam());
    return request<import("@/types").Team>("/api/team", {
      method: "POST",
      body: JSON.stringify({ name }),
    });
  },

  inviteToTeam: () => {
    if (USE_MOCKS) return Promise.resolve({ token: "mock-invite-token" });
    return request<{ token: string }>("/api/team/invite", { method: "POST" });
  },

  joinTeam: (token: string) => {
    if (USE_MOCKS) return Promise.resolve(buildMockTeam());
    return request<import("@/types").Team>("/api/team/join", {
      method: "POST",
      body: JSON.stringify({ token }),
    });
  },

  removeTeamMember: (userId: string) => {
    if (USE_MOCKS) return Promise.resolve({ ok: true });
    return request<{ ok: boolean }>(`/api/team/members/${userId}`, {
      method: "DELETE",
    });
  },

  getSubscription: () => {
    if (USE_MOCKS) {
      return Promise.resolve<import("@/types").SubscriptionDetails>({
        hasSubscription: false,
        status: null,
        nextBilledAt: null,
        cancelEffectiveAt: null,
        updatePaymentUrl: null,
      });
    }
    return request<import("@/types").SubscriptionDetails>(
      "/api/paddle/subscription",
    );
  },

  cancelSubscription: () =>
    request<import("@/types").SubscriptionDetails>("/api/paddle/subscription", {
      method: "POST",
    }),
};

export const USE_MOCKS =
  process.env.NEXT_PUBLIC_USE_MOCKS === "true" ||
  (!process.env.NEXT_PUBLIC_SUPABASE_URL &&
    process.env.NODE_ENV === "development");

/** Canned tutor replies for mock mode (no AI call). */
function mockTutorReply(lastUserMessage: string): string {
  const msg = lastUserMessage.toLowerCase();
  if (msg.includes("mnemonic")) {
    return 'Try "RICE": Read-replicas Improve Concurrent rEads. When a question stresses read scaling without touching writes, RICE points you to read replicas.';
  }
  if (msg.includes("correct") || msg.includes("right")) {
    return "The correct option directly addresses read scalability: read replicas serve read traffic off the primary, so latency drops during peak reads. The others fix availability or backups, not read throughput.";
  }
  if (
    msg.includes("beginner") ||
    msg.includes("new") ||
    msg.includes("simply")
  ) {
    return "Think of one busy cashier (the primary database). Read replicas are extra cashiers who can only ring up 'read' customers, so the line moves faster — without changing how new stock is added (writes).";
  }
  return "Good question. Focus on what the scenario optimizes for: here it's read latency under load. Map each option to the bottleneck it solves, and pick the one that targets reads specifically.";
}
