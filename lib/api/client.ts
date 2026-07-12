"use client";

import type {
  ClarifyingQuestion,
  LearnTopic,
  MentorConversation,
  MentorMessage,
  PracticeSession,
  TopicLesson,
  TopicMastery,
  UserProfile,
} from "@/types";
import { ApiClientError } from "./error";
import { buildApiFetchInit } from "./fetch-init";
import { consumeSse } from "./stream";
import {
  buildMockBookmarks,
  buildMockExamTips,
  buildMockFactCards,
  buildMockLabCatalog,
  buildMockMissedQuestions,
  buildMockTeam,
  buildMockTopicLab,
  buildMockUserExams,
} from "@/lib/mock-data";

export { ApiClientError, isUnauthorizedError } from "./error";

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const { url, init: fetchInit } = await buildApiFetchInit(path, init);
  const res = await fetch(url, fetchInit);

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new ApiClientError(body.error ?? res.statusText, res.status, {
      code: body.code,
      remaining: body.remaining,
      feature: body.feature,
      upgradeTier: body.upgradeTier,
    });
  }

  return res.json() as Promise<T>;
}

/** Append an ?exam= scope to a path (works with existing query strings). */
function withExam(path: string, exam?: string | null): string {
  if (!exam) return path;
  const sep = path.includes("?") ? "&" : "?";
  return `${path}${sep}exam=${encodeURIComponent(exam)}`;
}

export const api = {
  me: () => request<UserProfile>("/api/me"),

  userExams: () => {
    if (USE_MOCKS) {
      return Promise.resolve({ exams: buildMockUserExams() });
    }
    return request<{ exams: import("@/types").UserExam[] }>("/api/me/exams");
  },

  addUserExam: (body: { examCode: string; exam?: string; examDate?: string }) =>
    request<{ exams: import("@/types").UserExam[] }>("/api/me/exams", {
      method: "POST",
      body: JSON.stringify(body),
    }),

  updateUserExam: (
    examCode: string,
    body: { examDate?: string; clearExamDate?: boolean },
  ) =>
    request<{ exams: import("@/types").UserExam[] }>(
      `/api/me/exams/${encodeURIComponent(examCode)}`,
      { method: "PATCH", body: JSON.stringify(body) },
    ),

  removeUserExam: (examCode: string) =>
    request<{ exams: import("@/types").UserExam[] }>(
      `/api/me/exams/${encodeURIComponent(examCode)}`,
      { method: "DELETE" },
    ),

  completeOnboarding: (body: {
    exams: { examCode: string; exam?: string; examDate?: string }[];
    skipped?: boolean;
  }) => {
    if (USE_MOCKS) {
      return Promise.resolve({ ok: true, onboardedAt: new Date().toISOString() });
    }
    return request<{ ok: boolean; onboardedAt: string }>("/api/me/onboarding", {
      method: "POST",
      body: JSON.stringify(body),
    });
  },

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

  uploadPdf: async (file: File, examCode?: string | null) => {
    const form = new FormData();
    form.append("file", file);
    if (examCode) form.append("examCode", examCode);
    const { url, init: fetchInit } = await buildApiFetchInit("/api/uploads", {
      method: "POST",
      body: form,
    });
    const res = await fetch(url, fetchInit);
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new ApiClientError(body.error ?? res.statusText, res.status, {
        code: body.code,
      });
    }
    return res.json() as Promise<{ fileId: string; extractedChars: number }>;
  },

  listUploads: (exam?: string | null) => {
    if (USE_MOCKS) return Promise.resolve({ uploads: [] });
    return request<{
      uploads: {
        id: string;
        examCode: string | null;
        fileName: string;
        extractedChars: number;
        createdAt: string;
      }[];
    }>(withExam("/api/uploads", exam));
  },

  deleteUpload: (uploadId: string) => {
    if (USE_MOCKS) return Promise.resolve({ ok: true });
    return request<{ ok: boolean }>(`/api/uploads/${uploadId}`, {
      method: "DELETE",
    });
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

  listSessions: (opts?: { summary?: boolean }) =>
    request<PracticeSession[]>(
      opts?.summary ? "/api/sessions?summary=true" : "/api/sessions",
    ),

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
    timeSpent: Record<string, number> = {},
    confidence: Record<string, import("@/types").Confidence> = {},
  ) =>
    request<PracticeSession>(`/api/sessions/${sessionId}/submit`, {
      method: "POST",
      body: JSON.stringify({
        answers,
        dragAnswers,
        flagged,
        timeUsedSec,
        timeSpent,
        confidence,
      }),
    }),

  /** Anchors the exam clock server-side; idempotent, safe to call on resume. */
  startExamSession: (sessionId: string) =>
    request<PracticeSession>(`/api/sessions/${sessionId}/start`, {
      method: "POST",
    }),

  /**
   * Mid-exam autosave of the full raw state (no grading). `keepalive` lets
   * the final flush survive tab close / navigation.
   */
  saveExamState: (
    sessionId: string,
    state: {
      answers: Record<string, string[]>;
      dragAnswers: Record<string, import("@/types").DragAnswer>;
      flagged: string[];
      currentIndex: number;
      timeSpent: Record<string, number>;
      confidence: Record<string, import("@/types").Confidence>;
    },
  ) =>
    request<{ saved: number }>(`/api/sessions/${sessionId}/exam-state`, {
      method: "PATCH",
      body: JSON.stringify(state),
      keepalive: true,
    }),

  completeSession: (sessionId: string) =>
    request<PracticeSession>(`/api/sessions/${sessionId}/complete`, {
      method: "POST",
    }),

  /** Clone missed questions from a completed exam into a fresh timed mock (paid). */
  retakeMissed: (sessionId: string) =>
    request<PracticeSession>(`/api/sessions/${sessionId}/retake-missed`, {
      method: "POST",
    }),

  /** AI examiner debrief for a completed exam (paid tiers; cached server-side). */
  examDebrief: (sessionId: string) =>
    request<{ debrief: import("@/types").ExamDebrief; cached: boolean }>(
      `/api/sessions/${sessionId}/debrief`,
      { method: "POST" },
    ),

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

  lessonTutor: (
    topicSlug: string,
    messages: { role: "user" | "assistant"; content: string }[],
    opts?: {
      onDelta?: (text: string) => void;
      signal?: AbortSignal;
      exam?: string | null;
    },
  ) => {
    if (USE_MOCKS) {
      const last =
        messages.filter((m) => m.role === "user").at(-1)?.content ?? "";
      const reply = mockTutorReply(last);
      opts?.onDelta?.(reply);
      return Promise.resolve({ reply });
    }
    return consumeSse<{ reply: string }>(
      withExam(`/api/learn/lessons/${topicSlug}/tutor`, opts?.exam),
      { messages },
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

  mentorConversations: (exam?: string | null) => {
    if (USE_MOCKS) return Promise.resolve({ conversations: [] });
    return request<{ conversations: MentorConversation[] }>(
      withExam("/api/mentor/conversations", exam),
    );
  },

  mentorConversation: (conversationId: string) => {
    if (USE_MOCKS)
      return Promise.resolve({
        conversation: {
          id: conversationId,
          title: "New conversation",
          examCode: null,
          messageCount: 0,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        } satisfies MentorConversation,
        messages: [] as MentorMessage[],
      });
    return request<{
      conversation: MentorConversation;
      messages: MentorMessage[];
    }>(`/api/mentor/conversations/${conversationId}`);
  },

  renameMentorConversation: (conversationId: string, title: string) => {
    if (USE_MOCKS)
      return Promise.resolve({
        conversation: {
          id: conversationId,
          title,
          examCode: null,
          messageCount: 0,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        } satisfies MentorConversation,
      });
    return request<{ conversation: MentorConversation }>(
      `/api/mentor/conversations/${conversationId}`,
      { method: "PATCH", body: JSON.stringify({ title }) },
    );
  },

  deleteMentorConversation: (conversationId: string) => {
    if (USE_MOCKS) return Promise.resolve({ ok: true });
    return request<{ ok: boolean }>(
      `/api/mentor/conversations/${conversationId}`,
      { method: "DELETE" },
    );
  },

  /**
   * Send one Mentor message. History is NOT sent — the server reads it from the
   * conversation, so the context window (and the token bill) can't be inflated
   * by the client. `onReady` fires with the conversation id before the first
   * token, which is how a brand-new thread learns its own URL.
   */
  mentorChat: (
    content: string,
    opts?: {
      conversationId?: string;
      examCode?: string | null;
      clientMessageId?: string;
      onDelta?: (text: string) => void;
      onReady?: (data: { conversationId: string; title: string }) => void;
      signal?: AbortSignal;
    },
  ) => {
    if (USE_MOCKS) {
      const reply = mockTutorReply(content);
      opts?.onDelta?.(reply);
      return Promise.resolve({
        reply,
        conversationId: opts?.conversationId ?? "mock-conversation",
        title: content.slice(0, 60),
        remaining: null,
      });
    }
    return consumeSse<{
      reply: string;
      conversationId: string;
      title: string;
      remaining: number | null;
    }>(
      "/api/mentor/chat",
      {
        content,
        conversationId: opts?.conversationId,
        examCode: opts?.examCode,
        clientMessageId: opts?.clientMessageId,
      },
      {
        signal: opts?.signal,
        onReady: (data) =>
          opts?.onReady?.(data as { conversationId: string; title: string }),
        onEvent: (event, data) => {
          if (event === "delta") {
            const text = (data as { text?: string }).text;
            if (text) opts?.onDelta?.(text);
          }
        },
      },
    );
  },

  factCards: (dueOnly = false) => {
    if (USE_MOCKS) {
      const items = buildMockFactCards();
      return Promise.resolve({ items, count: items.length });
    }
    return request<{ items: import("@/types").FactCard[]; count: number }>(
      `/api/learn/facts${dueOnly ? "?due=true" : ""}`,
    );
  },

  rateFact: (lessonId: string, factIndex: number, known: boolean) => {
    if (USE_MOCKS) return Promise.resolve({ ok: true });
    return request<{ ok: boolean }>("/api/learn/facts/rate", {
      method: "POST",
      body: JSON.stringify({ lessonId, factIndex, known }),
    });
  },

  rateFlashcard: (questionId: string, known: boolean) => {
    if (USE_MOCKS) return Promise.resolve({ ok: true });
    return request<{ ok: boolean }>("/api/flashcards/rate", {
      method: "POST",
      body: JSON.stringify({ questionId, known }),
    });
  },

  /** The unified review queue over both missed questions and lesson key facts. */
  reviewQueue: (
    opts: {
      dueOnly?: boolean;
      source?: import("@/types").ReviewSource;
      domainId?: string;
      topicSlug?: string;
      includeRetired?: boolean;
      limit?: number;
    } = {},
  ) => {
    if (USE_MOCKS) {
      const questions = buildMockMissedQuestions();
      const facts = buildMockFactCards();
      return Promise.resolve({
        questions,
        facts,
        count: questions.length + facts.length,
        dueCount: facts.filter((f) => f.due).length,
      } as import("@/types").ReviewQueue);
    }
    const params = new URLSearchParams();
    if (opts.dueOnly) params.set("due", "true");
    if (opts.source && opts.source !== "all") params.set("source", opts.source);
    if (opts.domainId) params.set("domainId", opts.domainId);
    if (opts.topicSlug) params.set("topicSlug", opts.topicSlug);
    if (opts.includeRetired === false) params.set("includeRetired", "false");
    if (opts.limit) params.set("limit", String(opts.limit));
    const qs = params.toString();
    return request<import("@/types").ReviewQueue>(
      `/api/review/queue${qs ? `?${qs}` : ""}`,
    );
  },

  rateReviewCard: (
    card:
      | { kind: "question"; questionId: string }
      | { kind: "fact"; lessonId: string; factIndex: number },
    known: boolean,
  ) => {
    if (USE_MOCKS) return Promise.resolve({ ok: true });
    return request<{ ok: boolean }>("/api/review/rate", {
      method: "POST",
      body: JSON.stringify({ ...card, known }),
    });
  },

  masteryTrend: () =>
    request<{ label: string; mastery: number }[]>("/api/progress/trend"),

  examAccuracy: () =>
    request<Record<string, { accuracy: number; questions: number }>>(
      "/api/progress/exam-accuracy",
    ),

  readinessTrend: (exam?: string | null) =>
    request<{ label: string; score: number; date?: string }[]>(
      withExam("/api/progress/readiness/trend", exam),
    ),

  getPlan: (exam?: string | null) =>
    request<import("@/types").StudyPlan | null>(withExam("/api/plan", exam)),

  createPlan: (input: {
    targetDate: string;
    examCode?: string;
    restDays?: number[];
    effort?: import("@/types").PlanEffort;
  }) =>
    request<import("@/types").StudyPlan>("/api/plan", {
      method: "POST",
      body: JSON.stringify(input),
    }),

  patchPlan: (
    input: {
      targetDate?: string;
      restDays?: number[];
      effort?: import("@/types").PlanEffort;
    },
    exam?: string | null,
  ) =>
    request<import("@/types").StudyPlan>(withExam("/api/plan", exam), {
      method: "PATCH",
      body: JSON.stringify(input),
    }),

  deletePlan: (exam?: string | null) =>
    request<null>(withExam("/api/plan", exam), { method: "DELETE" }),

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

  learnTopics: (exam?: string | null) =>
    request<LearnTopic[]>(withExam("/api/learn/topics", exam)),

  learnLabs: (exam?: string | null) => {
    if (USE_MOCKS) return Promise.resolve(buildMockLabCatalog());
    return request<{
      supported: boolean;
      examCode: string;
      exam: string;
      items: import("@/types").LabCatalogItem[];
    }>(withExam("/api/learn/labs", exam));
  },

  getLab: (topicSlug: string, exam?: string | null) => {
    if (USE_MOCKS) return Promise.resolve(buildMockTopicLab(topicSlug));
    return request<import("@/types").TopicLab>(
      withExam(`/api/learn/labs/${topicSlug}`, exam),
    );
  },

  generateLab: (
    topicSlug: string,
    opts?: {
      onDelta?: (partial: Partial<import("@/types").LabContent>) => void;
      exam?: string | null;
      force?: boolean;
    },
  ) => {
    if (USE_MOCKS) return Promise.resolve(buildMockTopicLab(topicSlug, true));
    return consumeSse<import("@/types").TopicLab>(
      withExam(
        `/api/learn/labs/${topicSlug}/generate${opts?.force ? "?force=true" : ""}`,
        opts?.exam,
      ),
      {},
      {
        onEvent: (event, data) => {
          if (event === "delta") {
            opts?.onDelta?.(data as Partial<import("@/types").LabContent>);
          }
        },
      },
    );
  },

  startLab: (topicSlug: string, exam?: string | null) => {
    if (USE_MOCKS) {
      return Promise.resolve({
        ...buildMockTopicLab(topicSlug, true),
        started: true,
        status: "started" as const,
      });
    }
    return request<import("@/types").TopicLab>(
      withExam(`/api/learn/labs/${topicSlug}/start`, exam),
      { method: "POST" },
    );
  },

  updateLabProgress: (
    topicSlug: string,
    body: {
      stepsDone?: number[];
      checkpointScore?: number;
      checkpointTotal?: number;
      status?: "started" | "completed";
    },
    exam?: string | null,
  ) => {
    if (USE_MOCKS) {
      return Promise.resolve({
        ...buildMockTopicLab(topicSlug, true),
        started: true,
        stepsDone: body.stepsDone ?? [],
      });
    }
    return request<import("@/types").TopicLab>(
      withExam(`/api/learn/labs/${topicSlug}/progress`, exam),
      { method: "PATCH", body: JSON.stringify(body) },
    );
  },

  examTips: (exam?: string | null) => {
    if (USE_MOCKS) {
      return Promise.resolve({
        examCode: "SAA-C03",
        exam: "AWS Certified Solutions Architect – Associate",
        tips: buildMockExamTips(),
      });
    }
    return request<{
      examCode: string;
      exam: string;
      tips: import("@/types").ExamTip[];
    }>(withExam("/api/learn/exam-tips", exam));
  },

  getLesson: (topicSlug: string, exam?: string | null) =>
    request<TopicLesson>(withExam(`/api/learn/lessons/${topicSlug}`, exam)),

  generateLesson: (
    topicSlug: string,
    force = false,
    opts?: {
      /** Partial lesson snapshots while the model writes (streaming UI). */
      onDelta?: (
        partial: import("@/lib/ai/index").StreamingLessonContent,
      ) => void;
      exam?: string | null;
    },
  ) =>
    consumeSse<TopicLesson>(
      withExam(
        `/api/learn/lessons/${topicSlug}/generate${force ? "?force=true" : ""}`,
        opts?.exam,
      ),
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

  startLesson: (topicSlug: string, exam?: string | null) =>
    request<TopicLesson>(withExam(`/api/learn/lessons/${topicSlug}/start`, exam), {
      method: "POST",
    }),

  updateLessonProgress: (
    lessonId: string,
    body: {
      status?: "started" | "completed"
      bookmarked?: boolean
      checkScore?: number
      checkTotal?: number
    },
  ) =>
    request<{
      status: "started" | "completed"
      bookmarked: boolean
      checkScore?: number | null
      checkTotal?: number | null
    }>(`/api/learn/progress/${lessonId}`, {
      method: "PATCH",
      body: JSON.stringify(body),
    }),

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

  /** Activate plan after Paddle checkout.completed (verifies txn via Paddle API). */
  confirmCheckout: (transactionId: string) =>
    request<{ ok: boolean; plan: string; alreadyActive?: boolean }>(
      "/api/paddle/confirm",
      {
        method: "POST",
        body: JSON.stringify({ transaction_id: transactionId }),
      },
    ),
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
