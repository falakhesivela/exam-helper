"use client";

import { create } from "zustand";
import type {
  AnswerRecord,
  DragAnswer,
  LearnTopic,
  PlanCoaching,
  PracticeSession,
  StreakSummary,
  StudyPlan,
  StudyTaskStatus,
  TopicMastery,
  TopicLesson,
  UserProfile,
} from "@/types";
import { api, isUnauthorizedError, USE_MOCKS } from "@/lib/api/client";
import {
  buildMockLearnTopics,
  buildMockTopicLesson,
  createExamSession,
  createSessionFromIntake,
  generateMockTopicLesson,
  buildMockBookmarks,
  buildMockExamTips,
  buildMockUserExams,
  buildMockStreak,
  buildMockStudyPlan,
  mockPlanCoaching,
  mockHistory,
  mockProfile,
  mockReadinessTrend,
  mockTopicMastery,
  type ExamConfig,
} from "@/lib/mock-data";
import { emptyProfile } from "@/lib/store/empty-profile";
import {
  isAnswerCorrect,
  isQuestionAnswered,
  mergeSessionUpdate,
} from "@/lib/session-utils";

interface SessionState {
  profile: UserProfile;
  sessions: PracticeSession[];
  topicMastery: TopicMastery[];
  examAccuracy: Record<string, { accuracy: number; questions: number }>;
  readinessTrend: { label: string; score: number; date?: string }[];
  plan: StudyPlan | null;
  coaching: PlanCoaching | null;
  streak: StreakSummary | null;
  bookmarkedIds: string[];
  learnTopics: LearnTopic[];
  /** Exams the user is studying (onboarding choices + practiced exams). */
  userExams: import("@/types").UserExam[];
  /** Static exam-taking tips for the active exam (catalog content). */
  examTips: import("@/types").ExamTip[];
  /**
   * Exam currently scoping Learn/plan/readiness. Client-side view state:
   * defaults to the server-resolved active exam (last practiced) and resets
   * on reload — switching here does not persist anything.
   */
  activeExamCode: string | null;
  /**
   * True once identity is known — the profile loaded, or we're signed out.
   * The app shell renders as soon as this flips; page data may still be
   * streaming in (see dataReady).
   */
  hydrated: boolean;
  /** True once the bulk data fetches (sessions, mastery, plan…) landed. */
  dataReady: boolean;
  /** A hydrate() call is in flight. */
  hydrating: boolean;
  /**
   * Hydration failed for a reason other than being signed out (network, 5xx,
   * service-worker timeout). The shell must offer a retry rather than render
   * a signed-out UI over a live session.
   */
  hydrationError: boolean;

  getSession: (id: string) => PracticeSession | undefined;
  /**
   * Full session with questions/answers, fetching from the server when the
   * store only holds a summary stub (or nothing). Returns null on 404/error.
   */
  ensureFullSession: (id: string) => Promise<PracticeSession | null>;
  remainingFreeQuestions: () => number;
  /** Mentor messages left in the user's window. null = unlimited. */
  mentorMessagesLeft: () => number | null;
  /**
   * Apply the `remaining` the chat stream reports on `done`, so the counter
   * ticks down without re-fetching /api/me.
   */
  applyMentorUsage: (remaining: number | null) => void;

  hydrate: (opts?: { force?: boolean }) => Promise<void>;
  retryHydration: () => Promise<void>;
  /** Drop all user data — call when Supabase reports the session is gone. */
  applySignedOut: () => void;
  refreshProfile: () => Promise<void>;
  refreshUserExams: () => Promise<void>;
  /** Switch the exam scoping Learn/plan/readiness (view-only, not persisted). */
  setActiveExam: (examCode: string) => Promise<void>;
  refreshTopicMastery: () => Promise<void>;
  refreshExamAccuracy: () => Promise<void>;
  refreshPlan: () => Promise<void>;
  createPlan: (input: {
    targetDate: string;
    restDays?: number[];
    effort?: import("@/types").PlanEffort;
  }) => Promise<StudyPlan>;
  updatePlanSettings: (input: {
    targetDate?: string;
    restDays?: number[];
    effort?: import("@/types").PlanEffort;
  }) => Promise<StudyPlan>;
  deletePlan: () => Promise<void>;
  updatePlanTask: (
    taskId: string,
    updates: { status?: StudyTaskStatus; scheduledDate?: string },
  ) => Promise<void>;
  requestCoaching: () => Promise<void>;
  refreshStreak: () => Promise<void>;
  setDailyGoal: (dailyGoal: number) => Promise<void>;
  toggleBookmark: (questionId: string) => Promise<void>;
  refreshLearnTopics: () => Promise<void>;
  fetchLesson: (topicSlug: string) => Promise<TopicLesson>;
  generateLesson: (
    topicSlug: string,
    force?: boolean,
    opts?: {
      onDelta?: (
        partial: import("@/lib/ai/index").StreamingLessonContent,
      ) => void;
    },
  ) => Promise<TopicLesson>;
  ensureLesson: (topicSlug: string) => Promise<TopicLesson>;
  updateLessonProgress: (
    lessonId: string,
    updates: {
      status?: "started" | "completed";
      bookmarked?: boolean;
      checkScore?: number;
      checkTotal?: number;
    },
  ) => Promise<void>;

  startSession: (
    exam: string,
    examCode: string,
    focusTopics: string[],
  ) => Promise<string>;
  startExam: (config: ExamConfig) => Promise<string>;
  submitExam: (
    sessionId: string,
    answers: Record<string, string[]>,
    flagged: string[],
    timeUsedSec: number,
    dragAnswers?: Record<string, DragAnswer>,
    timeSpent?: Record<string, number>,
    confidence?: Record<string, import("@/types").Confidence>,
  ) => Promise<void>;
  answerQuestion: (
    sessionId: string,
    questionId: string,
    selectedOptionIds: string[],
    timeSpentSec: number,
    dragAnswer?: import("@/types").DragAnswer,
    confidence?: import("@/types").Confidence,
  ) => Promise<{ isCorrect: boolean }>;
  toggleMarkForReview: (sessionId: string, questionId: string) => Promise<void>;
  skipQuestion: (sessionId: string, questionId: string) => Promise<void>;
  goToIndex: (sessionId: string, index: number) => Promise<void>;
  completeSession: (sessionId: string) => Promise<void>;
}

function upsertSession(
  sessions: PracticeSession[],
  session: PracticeSession,
): PracticeSession[] {
  const idx = sessions.findIndex((s) => s.id === session.id);
  if (idx === -1) return [session, ...sessions];
  const next = [...sessions];
  next[idx] = session;
  return next;
}

/**
 * Upsert a server session response without letting it downgrade local state —
 * server snapshots strip answer keys from unanswered questions, and a response
 * that raced another request could otherwise wipe a revealed question.
 */
function mergeUpsertSession(
  sessions: PracticeSession[],
  incoming: PracticeSession,
): PracticeSession[] {
  const existing = sessions.find((s) => s.id === incoming.id);
  return upsertSession(sessions, mergeSessionUpdate(existing, incoming));
}

/** Backoff between profile fetch retries; length also caps the attempt count. */
const PROFILE_RETRY_DELAYS_MS = [400, 1200];

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/**
 * Load the profile, retrying transient failures. Only a 401 means "signed
 * out" — a network blip, a cold backend, or the service worker's 10s timeout
 * must never be allowed to masquerade as one.
 */
async function fetchProfileWithRetry(): Promise<UserProfile> {
  for (let attempt = 0; ; attempt++) {
    try {
      return await api.me();
    } catch (err) {
      if (isUnauthorizedError(err) || attempt >= PROFILE_RETRY_DELAYS_MS.length) {
        throw err;
      }
      await sleep(PROFILE_RETRY_DELAYS_MS[attempt]);
    }
  }
}

function signedOutState(): Partial<SessionState> {
  return {
    profile: emptyProfile,
    sessions: [],
    topicMastery: [],
    examAccuracy: {},
    readinessTrend: [],
    plan: null,
    coaching: null,
    streak: null,
    bookmarkedIds: [],
    learnTopics: [],
    userExams: [],
    examTips: [],
    activeExamCode: null,
    hydrated: true,
    dataReady: true,
    hydrating: false,
    hydrationError: false,
  };
}

/**
 * Apply a fresh summary listing without downgrading sessions that already
 * hold full question payloads (e.g. the exam being taken right now): a full
 * copy always beats a stub for the same id.
 */
function reconcileSummaries(
  existing: PracticeSession[],
  summaries: PracticeSession[],
): PracticeSession[] {
  const fullById = new Map(
    existing
      .filter((s) => !s.summary && s.questions.length > 0)
      .map((s) => [s.id, s]),
  );
  return summaries.map((s) => fullById.get(s.id) ?? s);
}

export const useSessionStore = create<SessionState>((set, get) => ({
  profile: USE_MOCKS ? mockProfile : emptyProfile,
  sessions: USE_MOCKS ? mockHistory : [],
  topicMastery: USE_MOCKS ? mockTopicMastery : [],
  examAccuracy: {},
  readinessTrend: USE_MOCKS ? mockReadinessTrend : [],
  plan: USE_MOCKS ? buildMockStudyPlan() : null,
  coaching: null,
  streak: USE_MOCKS ? buildMockStreak() : null,
  bookmarkedIds: USE_MOCKS ? buildMockBookmarks().map((b) => b.questionId) : [],
  learnTopics: USE_MOCKS ? buildMockLearnTopics() : [],
  userExams: USE_MOCKS ? buildMockUserExams() : [],
  examTips: USE_MOCKS ? buildMockExamTips() : [],
  activeExamCode: USE_MOCKS ? "SAA-C03" : null,
  hydrated: false,
  dataReady: USE_MOCKS,
  hydrating: false,
  hydrationError: false,

  getSession: (id) => get().sessions.find((s) => s.id === id),

  ensureFullSession: async (id) => {
    const existing = get().sessions.find((s) => s.id === id);
    if (existing && !existing.summary) return existing;
    if (USE_MOCKS) return existing ?? null;
    try {
      const fresh = await api.getSession(id);
      set((state) => ({
        sessions: mergeUpsertSession(state.sessions, fresh),
      }));
      return get().sessions.find((s) => s.id === id) ?? fresh;
    } catch {
      return null;
    }
  },

  remainingFreeQuestions: () => {
    const { profile } = get();
    // null limit = unlimited; Infinity is fine in memory (never serialized).
    if (profile.dailyLimit === null) return Infinity;
    return Math.max(0, profile.dailyLimit - profile.questionsUsedToday);
  },

  mentorMessagesLeft: () => {
    const { profile } = get();
    const usage = profile.usage?.mentor_messages;
    if (usage) return usage.remaining;
    // Unknown is intentionally displayed as no counter. Showing the plan limit
    // here would claim it is the *remaining* allowance after usage has failed
    // to load, which can be materially wrong.
    return null;
  },

  applyMentorUsage: (remaining) => {
    set((state) => {
      const limit = state.profile.limits?.mentorMessages ?? null;
      return {
        profile: {
          ...state.profile,
          usage: {
            ...state.profile.usage,
            mentor_messages: {
              limit,
              used: limit === null || remaining === null ? 0 : limit - remaining,
              remaining,
            },
          },
        },
      };
    });
  },

  hydrate: async (opts) => {
    if (USE_MOCKS) return;
    const { hydrated, hydrating } = get();
    if (hydrating || (hydrated && !opts?.force)) return;
    set({ hydrating: true, hydrationError: false });

    // Stage 1: the profile alone decides whether we are signed in, and it
    // carries the server-resolved active exam that scopes the fetches below.
    let profile: UserProfile;
    try {
      profile = await fetchProfileWithRetry();
    } catch (err) {
      if (isUnauthorizedError(err)) {
        set({ ...signedOutState(), hydrating: false });
      } else {
        // Leave the existing profile alone — a failed fetch is not a sign-out.
        set({ hydrating: false, hydrationError: true });
      }
      return;
    }

    // Identity is known — unblock the shell now. Page data streams in below
    // and components show skeletons until dataReady flips.
    const activeExamCode = profile.activeExam?.examCode ?? null;
    set({
      profile,
      activeExamCode,
      hydrated: true,
      hydrationError: false,
      dataReady: false,
    });

    // Stage 2: every fetch is individually non-fatal. None of them may blank
    // the shell, let alone reset the identity we just established.
    const [
      userExamsRes,
      sessions,
      topicMastery,
      learnTopics,
      examAccuracy,
      readinessTrend,
      plan,
    ] = await Promise.all([
      api.userExams().catch(() => ({ exams: [] })),
      // Summary listing: metadata + score counts only. Full sessions load
      // lazily via ensureFullSession when a quiz/exam/review page opens.
      api.listSessions({ summary: true }).catch(() => [] as PracticeSession[]),
      api.topicMastery().catch(() => [] as TopicMastery[]),
      api.learnTopics(activeExamCode).catch(() => [] as LearnTopic[]),
      api.examAccuracy().catch(() => ({})),
      api.readinessTrend(activeExamCode).catch(() => []),
      api.getPlan(activeExamCode).catch(() => null),
    ]);

    set((state) => ({
      userExams: userExamsRes.exams,
      sessions: reconcileSummaries(state.sessions, sessions),
      topicMastery,
      learnTopics,
      examAccuracy,
      readinessTrend,
      plan,
      dataReady: true,
      hydrating: false,
    }));

    // Non-critical extras; fetch separately so they never block the shell.
    void api
      .examTips(activeExamCode)
      .then(({ tips }) => set({ examTips: tips }))
      .catch(() => {});
    void get().refreshStreak();
    void api
      .bookmarkIds()
      .then(({ ids }) => set({ bookmarkedIds: ids }))
      .catch(() => {});
  },

  retryHydration: async () => {
    set({ hydrationError: false });
    await get().hydrate({ force: true });
  },

  applySignedOut: () => set({ ...signedOutState(), hydrating: false }),

  refreshUserExams: async () => {
    if (USE_MOCKS) return;
    try {
      const { exams } = await api.userExams();
      set({ userExams: exams });
    } catch {
      // non-fatal
    }
  },

  setActiveExam: async (examCode) => {
    const previous = get().activeExamCode;
    if (previous === examCode) return;
    set({ activeExamCode: examCode });
    if (USE_MOCKS) return;
    try {
      const [learnTopics, readinessTrend, plan, tipsRes, topicMastery, examAccuracy] =
        await Promise.all([
          api.learnTopics(examCode),
          api.readinessTrend(examCode).catch(() => []),
          api.getPlan(examCode).catch(() => null),
          api.examTips(examCode).catch(() => ({ tips: [] })),
          api.topicMastery().catch(() => get().topicMastery),
          api.examAccuracy().catch(() => get().examAccuracy),
        ]);
      set({
        learnTopics,
        readinessTrend,
        plan,
        examTips: tipsRes.tips,
        coaching: null,
        topicMastery,
        examAccuracy,
      });
    } catch {
      set({ activeExamCode: previous });
    }
  },

  refreshProfile: async () => {
    if (USE_MOCKS) return;
    try {
      const profile = await api.me();
      set({ profile });
    } catch {
      // ignore
    }
  },

  refreshTopicMastery: async () => {
    if (USE_MOCKS) return;
    try {
      const topicMastery = await api.topicMastery();
      set({ topicMastery });
    } catch {
      // ignore
    }
  },

  refreshExamAccuracy: async () => {
    if (USE_MOCKS) return;
    try {
      const [examAccuracy, readinessTrend] = await Promise.all([
        api.examAccuracy(),
        api.readinessTrend().catch(() => get().readinessTrend),
      ]);
      set({ examAccuracy, readinessTrend });
    } catch {
      // ignore
    }
  },

  refreshPlan: async () => {
    if (USE_MOCKS) return;
    try {
      const plan = await api.getPlan(get().activeExamCode);
      set({ plan });
    } catch {
      // ignore
    }
  },

  createPlan: async (input) => {
    if (USE_MOCKS) {
      const plan = get().plan ?? buildMockStudyPlan();
      set({ plan, coaching: null });
      return plan;
    }
    const plan = await api.createPlan({
      examCode: get().activeExamCode ?? undefined,
      ...input,
    });
    // A new schedule invalidates any coaching fetched for the old one.
    set({ plan, coaching: null });
    return plan;
  },

  updatePlanSettings: async (input) => {
    if (USE_MOCKS) {
      const plan = get().plan ?? buildMockStudyPlan();
      set({ plan, coaching: null });
      return plan;
    }
    const plan = await api.patchPlan(input, get().activeExamCode);
    set({ plan, coaching: null });
    return plan;
  },

  deletePlan: async () => {
    if (!USE_MOCKS) await api.deletePlan(get().activeExamCode);
    set({ plan: null, coaching: null });
  },

  updatePlanTask: async (taskId, updates) => {
    // Optimistic local update, then persist.
    set((state) =>
      state.plan
        ? {
            plan: {
              ...state.plan,
              tasks: state.plan.tasks.map((t) =>
                t.id === taskId
                  ? {
                      ...t,
                      ...(updates.status ? { status: updates.status } : {}),
                      ...(updates.scheduledDate
                        ? { scheduledDate: updates.scheduledDate }
                        : {}),
                    }
                  : t,
              ),
            },
          }
        : state,
    );
    if (USE_MOCKS) return;
    try {
      await api.updatePlanTask(taskId, updates);
    } catch {
      await get().refreshPlan();
    }
  },

  requestCoaching: async () => {
    if (USE_MOCKS) {
      set({ coaching: mockPlanCoaching });
      return;
    }
    const coaching = await api.coachPlan();
    set({ coaching });
  },

  refreshStreak: async () => {
    if (USE_MOCKS) return;
    try {
      const streak = await api.streak();
      set({ streak });
    } catch {
      // ignore — streak is non-critical
    }
  },

  setDailyGoal: async (dailyGoal) => {
    set((state) => ({
      profile: { ...state.profile, dailyGoal },
      streak: state.streak ? { ...state.streak, dailyGoal } : state.streak,
    }));
    if (USE_MOCKS) return;
    try {
      await api.updateDailyGoal(dailyGoal);
      await get().refreshStreak();
    } catch {
      // ignore
    }
  },

  toggleBookmark: async (questionId) => {
    const wasBookmarked = get().bookmarkedIds.includes(questionId);
    // Optimistic update.
    set((state) => ({
      bookmarkedIds: wasBookmarked
        ? state.bookmarkedIds.filter((id) => id !== questionId)
        : [...state.bookmarkedIds, questionId],
    }));
    if (USE_MOCKS) return;
    try {
      if (wasBookmarked) await api.removeBookmark(questionId);
      else await api.addBookmark(questionId);
    } catch {
      // Revert on failure.
      set((state) => ({
        bookmarkedIds: wasBookmarked
          ? [...state.bookmarkedIds, questionId]
          : state.bookmarkedIds.filter((id) => id !== questionId),
      }));
    }
  },

  refreshLearnTopics: async () => {
    if (USE_MOCKS) {
      set({ learnTopics: buildMockLearnTopics() });
      return;
    }
    try {
      const learnTopics = await api.learnTopics(get().activeExamCode);
      set({ learnTopics });
    } catch {
      // ignore
    }
  },

  fetchLesson: async (topicSlug) => {
    if (USE_MOCKS) return buildMockTopicLesson(topicSlug);
    return api.getLesson(topicSlug, get().activeExamCode);
  },

  generateLesson: async (topicSlug, force = false, opts) => {
    if (USE_MOCKS) {
      const lesson = generateMockTopicLesson(topicSlug);
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
      }));
      return lesson;
    }

    const lesson = await api.generateLesson(topicSlug, force, {
      ...opts,
      exam: get().activeExamCode,
    });
    await get().refreshLearnTopics();
    return lesson;
  },

  ensureLesson: async (topicSlug) => {
    if (USE_MOCKS) {
      const lesson = buildMockTopicLesson(topicSlug);
      return {
        ...lesson,
        id: lesson.id ?? `lesson-${topicSlug}`,
        status: "started",
      };
    }
    const lesson = await api.startLesson(topicSlug, get().activeExamCode);
    await get().refreshLearnTopics();
    return lesson;
  },

  updateLessonProgress: async (lessonId, updates) => {
    if (USE_MOCKS) {
      const checkPassed =
        updates.checkScore !== undefined &&
        updates.checkTotal &&
        updates.checkScore >= updates.checkTotal * 0.7;
      set((state) => ({
        learnTopics: state.learnTopics.map((t) =>
          t.lessonId === lessonId
            ? {
                ...t,
                lessonStatus: checkPassed
                  ? "completed"
                  : (updates.status ?? t.lessonStatus),
                bookmarked:
                  updates.bookmarked !== undefined
                    ? updates.bookmarked
                    : t.bookmarked,
              }
            : t,
        ),
      }));
      return;
    }

    await api.updateLessonProgress(lessonId, updates);
    await get().refreshLearnTopics();
  },

  startSession: async (exam, examCode, focusTopics) => {
    if (USE_MOCKS) {
      const session = createSessionFromIntake(exam, examCode, focusTopics);
      set((state) => ({ sessions: [session, ...state.sessions] }));
      return session.id;
    }
    throw new Error("Use api.generateSession from intake flow");
  },

  startExam: async (config) => {
    if (USE_MOCKS) {
      const session = createExamSession(config);
      set((state) => ({ sessions: [session, ...state.sessions] }));
      return session.id;
    }
    const session = await api.startExam({
      questionCount: config.questionCount,
      durationSec: config.durationSec,
      exam: config.exam,
      examCode: config.examCode,
    });
    set((state) => ({
      sessions: [session, ...state.sessions],
    }));
    await get().refreshProfile();
    return session.id;
  },

  submitExam: async (
    sessionId,
    answers,
    flagged,
    timeUsedSec,
    dragAnswers = {},
    timeSpent = {},
    confidence = {},
  ) => {
    const flaggedSet = new Set(flagged);
    if (USE_MOCKS) {
      set((state) => {
        let answeredCount = 0;
        const sessions = state.sessions.map((s) => {
          if (s.id !== sessionId) return s;
          const records: PracticeSession["answers"] = {};
          for (const q of s.questions) {
            const selected = answers[q.id] ?? [];
            const dragAnswer = dragAnswers[q.id];
            const answered = isQuestionAnswered(q, selected, dragAnswer);
            if (answered) answeredCount += 1;
            records[q.id] = {
              questionId: q.id,
              selectedOptionIds: selected,
              dragAnswer,
              isCorrect: answered
                ? isAnswerCorrect(q, selected, dragAnswer)
                : false,
              markedForReview: flaggedSet.has(q.id),
              skipped: !answered,
              timeSpentSec: timeSpent[q.id] ?? 0,
              confidence: confidence[q.id],
            };
          }
          return {
            ...s,
            answers: records,
            status: "completed" as const,
            completedAt: new Date().toISOString(),
            timeUsedSec,
          };
        });
        return {
          sessions,
          profile: {
            ...state.profile,
            questionsUsedToday:
              state.profile.questionsUsedToday + answeredCount,
          },
        };
      });
      return;
    }

    const session = await api.submitExam(
      sessionId,
      answers,
      flagged,
      timeUsedSec,
      dragAnswers,
      timeSpent,
      confidence,
    );
    set((state) => ({
      sessions: mergeUpsertSession(state.sessions, session),
    }));
    void Promise.all([
      get().refreshProfile(),
      get().refreshTopicMastery(),
      get().refreshExamAccuracy(),
      // Plan-linked task is marked done server-side on submit.
      get().refreshPlan(),
    ]);
  },

  answerQuestion: async (
    sessionId,
    questionId,
    selectedOptionIds,
    timeSpentSec,
    dragAnswer?,
    confidence?,
  ) => {
    if (USE_MOCKS) {
      const session = get().sessions.find((s) => s.id === sessionId);
      const question = session?.questions.find((q) => q.id === questionId);
      const isCorrect = question
        ? isAnswerCorrect(question, selectedOptionIds, dragAnswer)
        : false;
      set((state) => ({
        profile: {
          ...state.profile,
          questionsUsedToday: state.profile.questionsUsedToday + 1,
        },
        sessions: state.sessions.map((s) => {
          if (s.id !== sessionId) return s;
          const record: AnswerRecord = {
            questionId,
            selectedOptionIds,
            isCorrect,
            markedForReview: s.answers[questionId]?.markedForReview ?? false,
            skipped: false,
            timeSpentSec,
            confidence,
          };
          return { ...s, answers: { ...s.answers, [questionId]: record } };
        }),
      }));
      return { isCorrect };
    }

    const result = await api.answerQuestion(sessionId, {
      questionId,
      selectedOptionIds,
      dragAnswer,
      timeSpentSec,
      confidence,
    });

    set((state) => ({
      sessions: mergeUpsertSession(state.sessions, {
        ...result.session,
        questions: result.session.questions.map((q) =>
          q.id === questionId ? result.question : q,
        ),
        answers: {
          ...result.session.answers,
          [questionId]: result.answer,
        },
      }),
    }));

    await Promise.all([
      get().refreshProfile(),
      get().refreshTopicMastery(),
      get().refreshStreak(),
    ]);
    return { isCorrect: result.answer.isCorrect };
  },

  toggleMarkForReview: async (sessionId, questionId) => {
    if (USE_MOCKS) {
      set((state) => ({
        sessions: state.sessions.map((s) => {
          if (s.id !== sessionId) return s;
          const existing = s.answers[questionId];
          const record: AnswerRecord = existing
            ? { ...existing, markedForReview: !existing.markedForReview }
            : {
                questionId,
                selectedOptionIds: [],
                isCorrect: false,
                markedForReview: true,
                skipped: false,
                timeSpentSec: 0,
              };
          return { ...s, answers: { ...s.answers, [questionId]: record } };
        }),
      }));
      return;
    }

    const session = await api.markQuestion(sessionId, questionId);
    set((state) => ({
      sessions: mergeUpsertSession(state.sessions, session),
    }));
  },

  skipQuestion: async (sessionId, questionId) => {
    if (USE_MOCKS) {
      set((state) => ({
        sessions: state.sessions.map((s) => {
          if (s.id !== sessionId) return s;
          const existing = s.answers[questionId];
          if (
            existing?.isCorrect !== undefined &&
            existing.selectedOptionIds.length
          )
            return s;
          const record: AnswerRecord = {
            questionId,
            selectedOptionIds: [],
            isCorrect: false,
            markedForReview: existing?.markedForReview ?? false,
            skipped: true,
            timeSpentSec: existing?.timeSpentSec ?? 0,
          };
          return { ...s, answers: { ...s.answers, [questionId]: record } };
        }),
      }));
      return;
    }

    const session = await api.skipQuestion(sessionId, questionId);
    set((state) => ({
      sessions: mergeUpsertSession(state.sessions, session),
    }));
  },

  goToIndex: async (sessionId, index) => {
    if (USE_MOCKS) {
      set((state) => ({
        sessions: state.sessions.map((s) =>
          s.id === sessionId ? { ...s, currentIndex: index } : s,
        ),
      }));
      return;
    }

    const session = await api.setCursor(sessionId, index);
    set((state) => ({
      sessions: mergeUpsertSession(state.sessions, session),
    }));
  },

  completeSession: async (sessionId) => {
    if (USE_MOCKS) {
      set((state) => ({
        sessions: state.sessions.map((s) =>
          s.id === sessionId
            ? {
                ...s,
                status: "completed",
                completedAt: new Date().toISOString(),
              }
            : s,
        ),
      }));
      return;
    }

    const session = await api.completeSession(sessionId);
    set((state) => ({
      sessions: mergeUpsertSession(state.sessions, session),
    }));
    // Plan-linked task is marked done server-side on completion.
    void get().refreshPlan();
    await get().refreshProfile();
  },
}));
