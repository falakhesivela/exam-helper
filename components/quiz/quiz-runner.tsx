"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
import {
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  Clock,
  FastForward,
  Flag,
  FlagOff,
  MessageCircleQuestion,
  SkipForward,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { QuestionProgress } from "@/components/quiz/question-progress";
import { SessionStreak } from "@/components/quiz/session-streak";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { OptionCard } from "@/components/quiz/option-card";
import { ExplanationPanel } from "@/components/quiz/explanation-panel";
import { SessionSummary } from "@/components/quiz/session-summary";
import { QuestionStem } from "@/components/exam/vue/question-stem";
import { ExamQuestionPane } from "@/components/exam/vue/exam-question-pane";
import { AiTutorPanel } from "@/components/quiz/ai-tutor-panel";
import { LoadingScreen } from "@/components/ui/loading-screen";
import { Spinner } from "@/components/ui/spinner";
import { GenerationStatusBanner } from "@/components/generation/generation-tracker";
import { useSessionStore } from "@/lib/store/use-session-store";
import { api, USE_MOCKS } from "@/lib/api/client";
import { useSessionSync } from "@/hooks/use-session-sync";
import { formatTime, useStopwatch } from "@/hooks/use-stopwatch";
import { formatClock, useCountdown } from "@/hooks/use-countdown";
import type { Confidence, DragAnswer, PracticeSession } from "@/types";
import {
  expectedSelectionCount,
  isMcqQuestion,
  isQuestionAnswered,
  mergeSessionUpdate,
} from "@/lib/session-utils";
import { cn } from "@/lib/utils";

interface QuizRunnerProps {
  sessionId: string;
}

const AUTO_ADVANCE_KEY = "prepa-quiz-auto-advance";
/** Pause before auto-advancing past a correct answer. */
const AUTO_ADVANCE_DELAY_MS = 1300;

export function QuizRunner({ sessionId }: QuizRunnerProps) {
  const router = useRouter();
  const session = useSessionStore((s) => s.getSession(sessionId));
  const answerQuestion = useSessionStore((s) => s.answerQuestion);
  const toggleMarkForReview = useSessionStore((s) => s.toggleMarkForReview);
  const skipQuestion = useSessionStore((s) => s.skipQuestion);
  const goToIndex = useSessionStore((s) => s.goToIndex);
  const completeSession = useSessionStore((s) => s.completeSession);
  const [loading, setLoading] = useState(!session && !USE_MOCKS);

  const { pollNow, expectedTotal, availableCount, generationFailed } =
    useSessionSync(sessionId, session);

  useEffect(() => {
    if (session || USE_MOCKS) return;
    void api
      .getSession(sessionId)
      .then((s) => {
        useSessionStore.setState((state) => {
          const existing = state.sessions.find((x) => x.id === s.id);
          const merged = mergeSessionUpdate(existing, s);
          const idx = state.sessions.findIndex((x) => x.id === s.id);
          const sessions =
            idx === -1
              ? [merged, ...state.sessions]
              : state.sessions.map((x) => (x.id === s.id ? merged : x));
          return { sessions };
        });
      })
      .catch(() => undefined)
      .finally(() => setLoading(false));
  }, [session, sessionId]);

  if (loading) {
    return <LoadingScreen message="Loading session…" />;
  }

  if (!session) {
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center gap-3 p-6 text-center">
        <p className="text-lg font-medium">Session not found</p>
        <Button onClick={() => router.push("/intake")}>
          Start a new session
        </Button>
      </div>
    );
  }

  if (generationFailed) {
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center gap-3 p-6 text-center">
        <p className="text-lg font-medium">Question generation failed</p>
        <p className="text-sm text-muted-foreground">
          Something went wrong while creating your session.
        </p>
        <Button onClick={() => router.push("/intake")}>
          Start a new session
        </Button>
      </div>
    );
  }

  if (
    session.questions.length === 0 &&
    session.generationStatus === "generating"
  ) {
    return <LoadingScreen message="Preparing first question…" />;
  }

  return (
    <>
      <GenerationStatusBanner sessionId={sessionId} />
      <QuizRunnerInner
        key={session.id}
        session={session}
        expectedTotal={expectedTotal}
        availableCount={availableCount}
        pollNow={pollNow}
        onAnswer={answerQuestion}
        onMark={toggleMarkForReview}
        onSkip={skipQuestion}
        onGoTo={goToIndex}
        onComplete={completeSession}
        onExit={() => router.push("/dashboard")}
      />
    </>
  );
}

interface InnerProps {
  session: PracticeSession;
  expectedTotal: number;
  availableCount: number;
  pollNow: () => Promise<PracticeSession | undefined>;
  onAnswer: (
    sessionId: string,
    questionId: string,
    selected: string[],
    time: number,
    dragAnswer?: DragAnswer,
    confidence?: Confidence,
  ) => Promise<{ isCorrect: boolean }>;
  onMark: (sessionId: string, questionId: string) => Promise<void>;
  onSkip: (sessionId: string, questionId: string) => Promise<void>;
  onGoTo: (sessionId: string, index: number) => Promise<void>;
  onComplete: (sessionId: string) => Promise<void>;
  onExit: () => void;
}

function QuizRunnerInner({
  session,
  expectedTotal,
  availableCount,
  pollNow,
  onAnswer,
  onMark,
  onSkip,
  onGoTo,
  onComplete,
  onExit,
}: InnerProps) {
  const initialIndex = (() => {
    const start = session.currentIndex ?? 0;
    // Clamp to a valid question index — a session whose `currentIndex` has
    // reached the end (e.g. an already-completed session) would otherwise
    // index past the array and crash.
    return Math.min(
      Math.max(start, 0),
      Math.max(session.questions.length - 1, 0),
    );
  })();
  /** The question currently on screen (may be behind `cursor` while reviewing). */
  const [index, setIndex] = useState(initialIndex);
  /** The furthest question the learner is actively working on. */
  const [cursor, setCursor] = useState(initialIndex);
  const [selected, setSelected] = useState<string[]>([]);
  const [dragAnswer, setDragAnswer] = useState<DragAnswer | undefined>();
  const [confidence, setConfidence] = useState<Confidence | undefined>();
  const [revealed, setRevealed] = useState(false);
  const [answerCorrect, setAnswerCorrect] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [skipping, setSkipping] = useState(false);
  const [marking, setMarking] = useState(false);
  const [advancing, setAdvancing] = useState(false);
  const [waitingForNext, setWaitingForNext] = useState(false);
  const [stalled, setStalled] = useState(false);
  // A completed session reopened from history goes straight to its summary.
  const [finished, setFinished] = useState(
    () => session.status === "completed",
  );
  const [streak, setStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);
  /** Only mount the AI tutor for the question it was requested on. */
  const [tutorQuestionId, setTutorQuestionId] = useState<string | null>(null);
  /** Options the learner has struck out while reasoning (per question). */
  const [eliminated, setEliminated] = useState<string[]>([]);
  /** Opt-in: move to the next question automatically after a correct answer. */
  const [autoAdvance, setAutoAdvance] = useState(
    () =>
      typeof window !== "undefined" &&
      localStorage.getItem(AUTO_ADVANCE_KEY) === "1",
  );
  const advancingRef = useRef(false);
  const timedPractice = (session.durationSec ?? 0) > 0;
  const sessionRemaining = useCountdown(
    session.durationSec ?? 0,
    timedPractice && !finished,
    () => {
      void onComplete(session.id)
        .catch(() => {
          toast.error("Couldn't save the session as completed.");
        })
        .finally(() => setFinished(true));
    },
  );
  const reviewing = index < cursor;
  const { seconds, reset } = useStopwatch(!finished && !reviewing);

  const busy = submitting || skipping || marking || advancing || waitingForNext;

  const question = session.questions[index];
  const total = Math.max(
    expectedTotal,
    availableCount,
    session.questions.length,
  );
  const questionIds = session.questions.map((q) => q.id);
  const currentRecord = question ? session.answers[question.id] : undefined;
  const marked = currentRecord?.markedForReview ?? false;

  const correct = answerCorrect;
  const expectedCount = question ? expectedSelectionCount(question) : null;
  const answerComplete =
    question != null &&
    isQuestionAnswered(question, selected, dragAnswer) &&
    (expectedCount == null || selected.length === expectedCount);

  // Sync per-question state when the question on screen changes: restore
  // graded state for an already-answered question (refresh, resume, stepping
  // back to review) and reset to a clean slate for an unanswered one so a
  // fresh question can never inherit the previous question's revealed state.
  useEffect(() => {
    if (!question) return;
    const record = session.answers[question.id];
    if (
      record &&
      !record.skipped &&
      (record.selectedOptionIds.length > 0 || record.dragAnswer != null)
    ) {
      setSelected(record.selectedOptionIds);
      setDragAnswer(record.dragAnswer);
      setConfidence(record.confidence);
      setAnswerCorrect(record.isCorrect);
      setRevealed(true);
    } else {
      clearQuestionState();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- sync only when the question changes
  }, [question?.id]);

  // Auto-advance past correct answers when the learner has opted in. The
  // cleanup cancels the timer if they navigate away first; the last question
  // always waits for a manual "Finish session".
  useEffect(() => {
    if (!autoAdvance || !revealed || !answerCorrect || reviewing) return;
    if (cursor + 1 >= total) return;
    const id = window.setTimeout(() => void advance(), AUTO_ADVANCE_DELAY_MS);
    return () => window.clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- advance closes over latest state
  }, [autoAdvance, revealed, answerCorrect, reviewing, cursor, total]);

  if (!question && session.generationStatus === "generating") {
    return <LoadingScreen message="Preparing next question…" />;
  }

  if (finished || (!question && session.generationStatus === "complete")) {
    return (
      <div className="min-h-dvh px-4 py-8">
        <SessionSummary session={session} bestStreak={bestStreak} />
      </div>
    );
  }

  function clearQuestionState() {
    setSelected([]);
    setDragAnswer(undefined);
    setConfidence(undefined);
    setRevealed(false);
    setAnswerCorrect(false);
    setTutorQuestionId(null);
    setEliminated([]);
  }

  function toggleOption(optionId: string) {
    if (revealed || reviewing) return;
    // Picking a struck-out option restores it.
    setEliminated((prev) => prev.filter((id) => id !== optionId));
    setSelected((prev) => {
      if (question.multiSelect) {
        return prev.includes(optionId)
          ? prev.filter((id) => id !== optionId)
          : [...prev, optionId];
      }
      return [optionId];
    });
  }

  function toggleEliminated(optionId: string) {
    if (revealed || reviewing) return;
    setEliminated((prev) =>
      prev.includes(optionId)
        ? prev.filter((id) => id !== optionId)
        : [...prev, optionId],
    );
    // Ruling an option out also deselects it.
    setSelected((prev) => prev.filter((id) => id !== optionId));
  }

  function toggleAutoAdvance() {
    const next = !autoAdvance;
    setAutoAdvance(next);
    try {
      localStorage.setItem(AUTO_ADVANCE_KEY, next ? "1" : "0");
    } catch {
      // Storage unavailable — the toggle still works for this session.
    }
    toast.info(
      next
        ? "Auto-advance on: correct answers move on automatically."
        : "Auto-advance off.",
    );
  }

  async function handleSubmit() {
    if (!question || submitting || reviewing) return;
    if (!answerComplete) return;
    setSubmitting(true);
    try {
      const result = await onAnswer(
        session.id,
        question.id,
        selected,
        seconds,
        dragAnswer,
        confidence,
      );
      setAnswerCorrect(result.isCorrect);
      setRevealed(true);
      if (result.isCorrect) {
        setStreak((s) => {
          const next = s + 1;
          setBestStreak((b) => Math.max(b, next));
          return next;
        });
      } else {
        setTutorQuestionId(question.id);
        setStreak(0);
      }
    } catch {
      toast.error("Couldn't check your answer. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  function goBack() {
    if (busy || index === 0) return;
    clearQuestionState();
    setIndex(index - 1);
  }

  function goForward() {
    if (busy || !reviewing) return;
    clearQuestionState();
    setIndex(index + 1);
  }

  function returnToCurrent() {
    if (busy || !reviewing) return;
    clearQuestionState();
    setIndex(cursor);
  }

  async function advance() {
    if (advancingRef.current) return;
    advancingRef.current = true;
    setAdvancing(true);
    setStalled(false);
    try {
      if (cursor + 1 >= total) {
        try {
          await onComplete(session.id);
        } catch {
          toast.error(
            "Couldn't save the session as completed, but your answers are safe.",
          );
        }
        setFinished(true);
        return;
      }

      if (cursor + 1 >= availableCount) {
        setWaitingForNext(true);
        try {
          let fresh = await pollNow();
          let attempts = 0;
          while (
            fresh &&
            fresh.questions.length <= cursor + 1 &&
            fresh.generationStatus === "generating" &&
            attempts < 12
          ) {
            await new Promise((r) => setTimeout(r, 2000));
            fresh = await pollNow();
            attempts += 1;
          }
          if (!fresh || fresh.questions.length <= cursor + 1) {
            setStalled(true);
            return;
          }
        } finally {
          setWaitingForNext(false);
        }
      }

      const next = cursor + 1;
      const latest = useSessionStore.getState().getSession(session.id);
      if (!latest || latest.questions.length <= next) {
        setStalled(true);
        return;
      }

      // Clear feedback state before switching questions — option ids (a–d) repeat
      // across questions, and awaiting onGoTo would otherwise flash stale styling.
      clearQuestionState();
      setCursor(next);
      setIndex(next);
      reset();
      // Cursor persistence is non-critical — a failure only affects where a
      // future resume lands, so don't block or alarm the user.
      await onGoTo(session.id, next).catch(() => undefined);
    } finally {
      advancingRef.current = false;
      setAdvancing(false);
    }
  }

  async function handleSkip() {
    if (skipping || busy || reviewing) return;
    setSkipping(true);
    try {
      await onSkip(session.id, question.id);
      setStreak(0);
      await advance();
    } catch {
      toast.error("Couldn't skip this question. Please try again.");
    } finally {
      setSkipping(false);
    }
  }

  async function handleMark() {
    if (marking || busy) return;
    setMarking(true);
    try {
      await onMark(session.id, question.id);
    } catch {
      toast.error("Couldn't update the review flag. Please try again.");
    } finally {
      setMarking(false);
    }
  }

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (busy || finished) return;
      const target = e.target as HTMLElement;
      if (
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.isContentEditable
      ) {
        return;
      }

      if (e.key === "ArrowLeft") {
        if (index > 0 && (revealed || reviewing)) {
          e.preventDefault();
          goBack();
        }
        return;
      }

      if (e.key === "ArrowRight") {
        if (reviewing) {
          e.preventDefault();
          goForward();
        }
        return;
      }

      if (e.key === "Enter") {
        e.preventDefault();
        if (reviewing) goForward();
        else if (revealed) void advance();
        else void handleSubmit();
        return;
      }

      if (reviewing) return;

      if (e.key === "s" || e.key === "S") {
        if (!revealed) {
          e.preventDefault();
          void handleSkip();
        }
        return;
      }

      if (e.key === "f" || e.key === "F") {
        e.preventDefault();
        void handleMark();
        return;
      }

      if (revealed || !isMcqQuestion(question)) return;

      const opts = question.options ?? [];
      const keyMap: Record<string, number> = {
        "1": 0,
        "2": 1,
        "3": 2,
        "4": 3,
        a: 0,
        b: 1,
        c: 2,
        d: 3,
        A: 0,
        B: 1,
        C: 2,
        D: 3,
      };
      const idx = keyMap[e.key];
      if (idx != null && idx < opts.length) {
        e.preventDefault();
        toggleOption(opts[idx].id);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps -- handlers close over latest state
    [
      busy,
      finished,
      revealed,
      reviewing,
      index,
      cursor,
      question,
      selected,
      dragAnswer,
      submitting,
    ],
  );

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  return (
    <div className="flex min-h-dvh flex-col">
      {/* Focus-mode header */}
      <header className="sticky top-0 z-10 border-b border-border bg-background/85 backdrop-blur-lg">
        <div className="mx-auto flex max-w-2xl items-center gap-3 px-4 py-3">
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="ghost" size="icon" aria-label="Exit session">
                <X />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Leave this session?</AlertDialogTitle>
                <AlertDialogDescription>
                  Your progress so far is saved, but the session will be left
                  incomplete.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Keep going</AlertDialogCancel>
                <AlertDialogAction onClick={onExit}>Leave</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

          <div className="flex flex-1 flex-col gap-1.5">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span className="flex items-center gap-2">
                Question {index + 1} of {total}
                {reviewing ? (
                  <Badge
                    variant="secondary"
                    className="px-1.5 py-0 text-[10px]"
                  >
                    Reviewing
                  </Badge>
                ) : (
                  <SessionStreak streak={streak} />
                )}
              </span>
              <span className="flex items-center gap-1 tabular-nums">
                <Clock className="size-3.5" />
                {timedPractice
                  ? formatClock(sessionRemaining)
                  : formatTime(seconds)}
              </span>
            </div>
            <QuestionProgress
              total={total}
              currentIndex={index}
              questionIds={questionIds}
              answers={session.answers}
              revealed={revealed}
              maxSelectableIndex={cursor}
              onSelect={(i) => {
                if (busy || i === index) return;
                clearQuestionState();
                setIndex(i);
              }}
            />
          </div>

          <Button
            variant="ghost"
            size="icon"
            aria-label={
              autoAdvance
                ? "Turn off auto-advance on correct answers"
                : "Turn on auto-advance on correct answers"
            }
            aria-pressed={autoAdvance}
            onClick={toggleAutoAdvance}
            className={cn(autoAdvance && "text-primary")}
          >
            <FastForward />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            aria-label={marked ? "Unmark for review" : "Mark for review"}
            aria-pressed={marked}
            onClick={handleMark}
            disabled={marking || busy}
            className={cn(marked && "text-primary")}
          >
            {marking ? <Spinner /> : marked ? <FlagOff /> : <Flag />}
          </Button>
        </div>
      </header>

      {/* Question body */}
      <div className="relative mx-auto flex w-full max-w-2xl flex-1 flex-col gap-5 px-4 py-6">
        {submitting && (
          <div
            className="absolute inset-0 z-10 flex items-center justify-center rounded-xl bg-background/60 backdrop-blur-[1px]"
            aria-live="polite"
            aria-busy="true"
          >
            <div className="flex items-center gap-2 rounded-lg border border-border bg-card px-4 py-2.5 text-sm font-medium shadow-sm">
              <Spinner />
              Checking your answer…
            </div>
          </div>
        )}
        <AnimatePresence mode="wait">
          <motion.div
            key={question.id}
            initial={{ opacity: 0, x: 24 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -24 }}
            transition={{ duration: 0.25 }}
            className="flex flex-col gap-5"
          >
            <div className="flex flex-col gap-3">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="secondary">{question.topic}</Badge>
                <Badge variant="outline" className="capitalize">
                  {question.difficulty}
                </Badge>
                {question.multiSelect && (
                  <Badge variant="outline">
                    {expectedCount === 2
                      ? "Select TWO answers"
                      : expectedCount === 3
                        ? "Select THREE answers"
                        : "Select all that apply"}
                  </Badge>
                )}
                {reviewing && currentRecord?.skipped && (
                  <Badge variant="outline" className="text-muted-foreground">
                    Skipped
                  </Badge>
                )}
              </div>
              {isMcqQuestion(question) ? (
                <>
                  <QuestionStem question={question} />
                  <div className="flex flex-col gap-2.5">
                    {(question.options ?? []).map((option, i) => (
                      <OptionCard
                        key={`${question.id}-${option.id}`}
                        option={option}
                        index={i}
                        selected={selected.includes(option.id)}
                        revealed={revealed}
                        isCorrect={(question.correctOptionIds ?? []).includes(
                          option.id,
                        )}
                        multiSelect={Boolean(question.multiSelect)}
                        disabled={revealed || busy || reviewing}
                        onToggle={() => toggleOption(option.id)}
                        eliminated={eliminated.includes(option.id)}
                        onToggleEliminated={
                          revealed || reviewing
                            ? undefined
                            : () => toggleEliminated(option.id)
                        }
                      />
                    ))}
                  </div>
                </>
              ) : (
                <ExamQuestionPane
                  question={question}
                  selected={selected}
                  dragAnswer={dragAnswer}
                  isFlagged={marked}
                  onToggleOption={toggleOption}
                  onDragAnswerChange={(a) => {
                    if (!revealed && !reviewing) setDragAnswer(a);
                  }}
                  revealed={revealed}
                />
              )}
            </div>

            {revealed && (
              <>
                <ExplanationPanel question={question} isCorrect={correct} />
                {!correct &&
                  (tutorQuestionId === question.id ? (
                    <AiTutorPanel
                      question={question}
                      selectedOptionIds={selected}
                      dragAnswer={dragAnswer}
                    />
                  ) : (
                    <Button
                      variant="outline"
                      className="self-start"
                      onClick={() => setTutorQuestionId(question.id)}
                    >
                      <MessageCircleQuestion data-icon="inline-start" />
                      Ask the AI tutor
                    </Button>
                  ))}
              </>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Sticky action footer */}
      <footer className="sticky bottom-0 border-t border-border bg-background/90 pb-[env(safe-area-inset-bottom)] backdrop-blur-lg">
        {stalled && !reviewing && (
          <div className="mx-auto flex max-w-2xl items-center gap-2 px-4 pt-2.5 text-xs text-warning">
            <Spinner className="size-3.5" />
            The next question is taking longer than expected to generate. Try
            again in a moment.
          </div>
        )}
        {!revealed && !reviewing && (
          <div className="mx-auto flex max-w-2xl items-center gap-2 px-4 pt-2.5 text-xs">
            <span className="text-muted-foreground">How sure are you?</span>
            {(["sure", "unsure"] as const).map((c) => (
              <button
                key={c}
                type="button"
                aria-pressed={confidence === c}
                onClick={() =>
                  setConfidence((cur) => (cur === c ? undefined : c))
                }
                className={cn(
                  "rounded-full border px-2.5 py-1 font-medium capitalize transition-colors",
                  confidence === c
                    ? c === "sure"
                      ? "border-primary bg-primary/15 text-primary"
                      : "border-warning bg-warning/15 text-warning"
                    : "border-border text-muted-foreground hover:border-foreground/40",
                )}
              >
                {c}
              </button>
            ))}
          </div>
        )}
        <div className="mx-auto flex max-w-2xl items-center gap-3 px-4 py-3">
          {!reviewing && !revealed && (
            <>
              <p className="shrink-0 text-[10px] text-muted-foreground md:hidden">
                Enter to check · S skip · F flag
              </p>
              <p className="hidden shrink-0 gap-1 text-[10px] text-muted-foreground md:flex">
                <kbd className="rounded border border-border px-1">1-4</kbd>
                <kbd className="rounded border border-border px-1">Enter</kbd>
                <kbd className="rounded border border-border px-1">S</kbd>
                <kbd className="rounded border border-border px-1">F</kbd>
                <kbd className="rounded border border-border px-1">←</kbd>
              </p>
            </>
          )}
          {index > 0 && (revealed || reviewing) && (
            <Button
              variant="ghost"
              size="icon-lg"
              aria-label="Previous question"
              onClick={goBack}
              disabled={busy}
            >
              <ChevronLeft />
            </Button>
          )}
          {reviewing ? (
            <>
              <Button
                variant="ghost"
                size="icon-lg"
                aria-label="Next question"
                onClick={goForward}
                disabled={busy}
              >
                <ChevronRight />
              </Button>
              <Button
                size="lg"
                className="flex-1"
                onClick={returnToCurrent}
                disabled={busy}
              >
                Back to question {cursor + 1}
                <ArrowRight data-icon="inline-end" />
              </Button>
            </>
          ) : !revealed ? (
            <>
              <Button
                variant="ghost"
                size="lg"
                onClick={handleSkip}
                disabled={busy}
                className="text-muted-foreground"
              >
                {skipping ? (
                  <Spinner data-icon="inline-start" />
                ) : (
                  <SkipForward data-icon="inline-start" />
                )}
                {skipping ? "Skipping…" : "Skip"}
              </Button>
              <Button
                size="lg"
                className="flex-1"
                disabled={!answerComplete || busy}
                onClick={handleSubmit}
              >
                {submitting ? (
                  <>
                    <Spinner data-icon="inline-start" />
                    Checking…
                  </>
                ) : expectedCount != null &&
                  selected.length > 0 &&
                  selected.length !== expectedCount ? (
                  selected.length < expectedCount ? (
                    `Select ${expectedCount - selected.length} more`
                  ) : (
                    `Select only ${expectedCount}`
                  )
                ) : (
                  "Check answer"
                )}
              </Button>
            </>
          ) : (
            <Button
              size="lg"
              className="flex-1"
              onClick={() => void advance()}
              disabled={advancing}
              autoFocus
            >
              {advancing || waitingForNext ? (
                <>
                  <Spinner data-icon="inline-start" />
                  {waitingForNext
                    ? "Preparing next question…"
                    : cursor + 1 >= total
                      ? "Finishing…"
                      : "Loading…"}
                </>
              ) : (
                <>
                  {stalled
                    ? "Try again"
                    : cursor + 1 >= total
                      ? "Finish session"
                      : "Next question"}
                  <ArrowRight data-icon="inline-end" />
                </>
              )}
            </Button>
          )}
        </div>
      </footer>
    </div>
  );
}
