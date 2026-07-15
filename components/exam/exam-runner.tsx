"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  CircleHelp,
  Clock,
  Flag,
  Keyboard,
  LayoutGrid,
  Play,
  Timer,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
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
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { ExamSummary } from "@/components/exam/exam-summary";
import { ExamQuestionPane } from "@/components/exam/vue/exam-question-pane";
import { AwsServiceHelp } from "@/components/exam/vue/aws-service-help";
import { ExamRules } from "@/components/exam/vue/exam-rules";
import {
  ExamNavigator,
  ItemReviewScreen,
} from "@/components/exam/vue/item-review-screen";
import { LoadingScreen } from "@/components/ui/loading-screen";
import { GenerationStatusBanner } from "@/components/generation/generation-tracker";
import { getExamBlueprint } from "@/lib/exams";
import { examShowsAwsServiceHelp } from "@/lib/exams/aws-service-abbreviations";
import { useSessionStore } from "@/lib/store/use-session-store";
import { api, USE_MOCKS } from "@/lib/api/client";
import { useSessionSync } from "@/hooks/use-session-sync";
import { useCountdown, formatClock } from "@/hooks/use-countdown";
import {
  examDeadlineMs,
  isResumableExam,
  useExamState,
} from "@/hooks/use-exam-state";
import type { Confidence, DragAnswer, PracticeSession } from "@/types";
import { isExamQuestionAnswered } from "@/lib/exam-answer-state";
import { cn } from "@/lib/utils";

type ExamPhase = "rules" | "resume" | "exam" | "review" | "done";

interface ExamRunnerProps {
  sessionId: string;
}

export function ExamRunner({ sessionId }: ExamRunnerProps) {
  const router = useRouter();
  const session = useSessionStore((s) => s.getSession(sessionId));
  const submitExam = useSessionStore((s) => s.submitExam);
  // Hydrate only stocks summary stubs — the full session (questions,
  // answers) loads here before the exam can render.
  const needsFetch = (!session || session.summary === true) && !USE_MOCKS;
  const [loading, setLoading] = useState(needsFetch);

  const { expectedTotal, availableCount, generationFailed, isGenerating } =
    useSessionSync(sessionId, needsFetch ? undefined : session);

  useEffect(() => {
    if (!needsFetch) return;
    void api
      .getSession(sessionId)
      .then((s) => {
        useSessionStore.setState((state) => ({
          sessions: state.sessions.some((x) => x.id === s.id)
            ? state.sessions.map((x) => (x.id === s.id ? s : x))
            : [s, ...state.sessions],
        }));
      })
      .catch(() => undefined)
      .finally(() => setLoading(false));
  }, [needsFetch, sessionId]);

  if (needsFetch && loading) {
    return <LoadingScreen message="Loading exam…" />;
  }

  if (!session || session.summary === true) {
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center gap-3 p-6 text-center">
        <p className="text-lg font-medium">Exam not found</p>
        <Button onClick={() => router.push("/exam")}>Set up a new exam</Button>
      </div>
    );
  }

  if (generationFailed) {
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center gap-3 p-6 text-center">
        <p className="text-lg font-medium">Exam generation failed</p>
        <Button onClick={() => router.push("/exam")}>Set up a new exam</Button>
      </div>
    );
  }

  if (session.questions.length === 0 && isGenerating) {
    return <LoadingScreen message="Preparing first question…" />;
  }

  return (
    <>
      <GenerationStatusBanner sessionId={sessionId} />
      <ExamRunnerInner
        key={session.id}
        session={session}
        expectedTotal={expectedTotal}
        availableCount={availableCount}
        isGenerating={isGenerating}
        onSubmit={submitExam}
        onExit={() => router.push("/dashboard")}
      />
    </>
  );
}

interface InnerProps {
  session: PracticeSession;
  expectedTotal: number;
  availableCount: number;
  isGenerating: boolean;
  onSubmit: (
    sessionId: string,
    answers: Record<string, string[]>,
    flagged: string[],
    timeUsedSec: number,
    dragAnswers: Record<string, DragAnswer>,
    timeSpent: Record<string, number>,
    confidence: Record<string, Confidence>,
  ) => Promise<void>;
  onExit: () => void;
}

function ExamRunnerInner({
  session,
  expectedTotal,
  availableCount,
  isGenerating,
  onSubmit,
  onExit,
}: InnerProps) {
  const blueprint = getExamBlueprint(session.examCode);
  const total = Math.max(
    expectedTotal,
    availableCount,
    session.questions.length,
  );
  const durationSec = session.durationSec ?? 30 * 60;
  const canSubmit = !isGenerating && availableCount >= expectedTotal;
  const passMark = session.passMark ?? blueprint?.passMark ?? 72;
  const durationMin = Math.round(durationSec / 60);

  const [phase, setPhase] = useState<ExamPhase>(() =>
    isResumableExam(session) ? "resume" : "rules",
  );
  const [timerActive, setTimerActive] = useState(false);
  const {
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
    markDirty,
    flush,
    setAutosaveEnabled,
  } = useExamState(session);
  const [submitting, setSubmitting] = useState(false);
  const [navOpen, setNavOpen] = useState(false);
  const [starting, setStarting] = useState(false);
  const [shortcutsOpen, setShortcutsOpen] = useState(false);

  // Server-anchored deadline: survives reloads with the true remaining time.
  // When the server anchor is missing (degraded start, mocks) the clock is
  // anchored client-side at startExam so every consumer — the header clock,
  // the expiry watcher, the submit-time math — reads the same deadline.
  const clientDeadlineRef = useRef<number | null>(null);
  const deadlineMs =
    examDeadlineMs(session) ?? clientDeadlineRef.current ?? undefined;
  function ensureDeadlineAnchor() {
    if (examDeadlineMs(session) == null && clientDeadlineRef.current == null) {
      clientDeadlineRef.current = Date.now() + durationSec * 1000;
    }
  }
  function remainingSec(): number {
    const deadline = examDeadlineMs(session) ?? clientDeadlineRef.current;
    if (deadline == null) return durationSec;
    return Math.max(0, Math.round((deadline - Date.now()) / 1000));
  }

  // Auto-submit at the deadline without re-rendering on every clock tick —
  // the visible countdown lives in ExamHeader. A parent-level effect (not a
  // hook in the header) because time can expire on the review screen too,
  // where the header isn't mounted.
  const handleSubmitRef = useRef<() => Promise<void>>(async () => {});
  useEffect(() => {
    handleSubmitRef.current = handleSubmit;
  });
  useEffect(() => {
    if (!timerActive || submitting || deadlineMs == null) return;
    if (phase !== "exam" && phase !== "review") return;
    const check = () => {
      if (Date.now() >= deadlineMs) void handleSubmitRef.current();
    };
    check();
    const id = setInterval(check, 1000);
    return () => clearInterval(id);
  }, [timerActive, submitting, deadlineMs, phase]);

  useEffect(() => {
    setAutosaveEnabled(phase === "exam" || phase === "review");
  }, [phase, setAutosaveEnabled]);

  const targetPerQuestion = total > 0 ? Math.round(durationSec / total) : 60;

  // Real per-question time, accumulated across visits and folded into
  // `timeSpent` whenever the learner leaves the current question.
  const enteredAtRef = useRef(Date.now());
  function commitElapsed() {
    const current = session.questions[index];
    if (!current || phase !== "exam") return;
    const elapsed = Math.round((Date.now() - enteredAtRef.current) / 1000);
    enteredAtRef.current = Date.now();
    if (elapsed <= 0) return;
    setTimeSpent((prev) => ({
      ...prev,
      [current.id]: (prev[current.id] ?? 0) + elapsed,
    }));
    markDirty();
  }
  /** timeSpent plus the still-uncommitted seconds on the current question. */
  function finalTimeSpent(): Record<string, number> {
    const result = { ...timeSpent };
    const current = session.questions[index];
    if (current && phase === "exam") {
      const elapsed = Math.round((Date.now() - enteredAtRef.current) / 1000);
      if (elapsed > 0) result[current.id] = (result[current.id] ?? 0) + elapsed;
    }
    return result;
  }

  const question = session.questions[index];
  const selected = answers[question?.id] ?? [];
  const dragAnswer = question ? dragAnswers[question.id] : undefined;
  const answeredCount = useMemo(
    () =>
      session.questions.filter((q) =>
        isExamQuestionAnswered(q, answers, dragAnswers),
      ).length,
    [answers, dragAnswers, session.questions],
  );
  const unsureSet = useMemo(
    () =>
      new Set(
        Object.entries(confidence)
          .filter(([, level]) => level === "unsure")
          .map(([id]) => id),
      ),
    [confidence],
  );
  const unsureCount = unsureSet.size;

  // Frozen at submit; the countdown itself lives in ExamHeader.
  const [timeUsedSec, setTimeUsedSec] = useState(0);

  async function handleSubmit() {
    if (phase === "done" || submitting || !canSubmit) return;
    setSubmitting(true);
    try {
      const timeUsed = Math.min(durationSec, durationSec - remainingSec());
      setTimeUsedSec(Math.max(0, timeUsed));
      await onSubmit(
        session.id,
        answers,
        [...flagged],
        Math.max(0, timeUsed),
        dragAnswers,
        finalTimeSpent(),
        confidence,
      );
      setPhase("done");
      setNavOpen(false);
    } finally {
      setSubmitting(false);
    }
  }

  async function startExam() {
    if (starting) return;
    setStarting(true);
    try {
      if (!USE_MOCKS) {
        // Anchor the clock server-side so the exam survives reloads.
        // Idempotent — a resume returns the original start time.
        const started = await api.startExamSession(session.id);
        if (started.examStartedAt) {
          useSessionStore.setState((state) => ({
            sessions: state.sessions.map((s) =>
              s.id === session.id
                ? { ...s, examStartedAt: started.examStartedAt }
                : s,
            ),
          }));
        }
      }
    } catch {
      // Degrade gracefully: run with a client-anchored timer (no resume).
    } finally {
      setStarting(false);
    }
    ensureDeadlineAnchor();
    enteredAtRef.current = Date.now();
    setPhase("exam");
    setTimerActive(true);
  }

  function resumeExam() {
    ensureDeadlineAnchor();
    enteredAtRef.current = Date.now();
    setPhase("exam");
    setTimerActive(true);
  }

  // A resumed exam whose time already ran out is scored immediately from the
  // autosaved answers instead of restarting a dead clock.
  const expired =
    phase === "resume" && deadlineMs != null && deadlineMs <= Date.now();
  useEffect(() => {
    if (expired && canSubmit && !submitting) void handleSubmit();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [expired, canSubmit, submitting]);

  function goTo(i: number) {
    commitElapsed();
    const maxIndex = Math.max(availableCount - 1, 0);
    setIndex(Math.min(Math.max(i, 0), maxIndex));
    setNavOpen(false);
    markDirty();
    if (phase === "review") setPhase("exam");
  }

  function toggleOption(optionId: string) {
    if (!question) return;
    setAnswers((prev) => {
      const current = prev[question.id] ?? [];
      let next: string[];
      if (question.multiSelect) {
        next = current.includes(optionId)
          ? current.filter((id) => id !== optionId)
          : [...current, optionId];
      } else {
        next = [optionId];
      }
      return { ...prev, [question.id]: next };
    });
    markDirty();
  }

  function toggleFlag() {
    if (!question) return;
    setFlagged((prev) => {
      const next = new Set(prev);
      if (next.has(question.id)) next.delete(question.id);
      else next.add(question.id);
      return next;
    });
    markDirty();
  }

  function setQuestionConfidence(level: Confidence) {
    if (!question) return;
    setConfidence((prev) => {
      const next = { ...prev };
      // Tapping the active level clears it back to "no answer".
      if (next[question.id] === level) delete next[question.id];
      else next[question.id] = level;
      return next;
    });
    markDirty();
  }

  useEffect(() => {
    if (phase !== "exam" || submitting) return;

    function onKeyDown(event: KeyboardEvent) {
      const target = event.target;
      if (
        target instanceof HTMLInputElement ||
        target instanceof HTMLTextAreaElement ||
        target instanceof HTMLSelectElement
      ) {
        return;
      }

      const key = event.key.toLowerCase();

      if (!event.altKey) {
        // Plain keys: 1-9 pick an option, "?" shows the shortcut help.
        if (event.key === "?") {
          event.preventDefault();
          setShortcutsOpen((open) => !open);
          return;
        }
        if (
          question &&
          !event.ctrlKey &&
          !event.metaKey &&
          /^[1-9]$/.test(event.key)
        ) {
          const option = question.options?.[Number(event.key) - 1];
          if (option) {
            event.preventDefault();
            toggleOption(option.id);
          }
        }
        return;
      }

      if (key === "n" || event.key === "ArrowRight") {
        event.preventDefault();
        if (index + 1 < availableCount) goTo(index + 1);
        else if (canSubmit) goToReview();
      } else if (key === "p" || event.key === "ArrowLeft") {
        event.preventDefault();
        if (index > 0) goTo(index - 1);
      } else if (key === "f") {
        event.preventDefault();
        if (!question) return;
        setFlagged((prev) => {
          const next = new Set(prev);
          if (next.has(question.id)) next.delete(question.id);
          else next.add(question.id);
          return next;
        });
        markDirty();
      } else if (key === "u") {
        event.preventDefault();
        if (!question) return;
        setConfidence((prev) => {
          const next = { ...prev };
          if (next[question.id] === "unsure") delete next[question.id];
          else next[question.id] = "unsure";
          return next;
        });
        markDirty();
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, submitting, index, availableCount, canSubmit, question?.id]);

  function beginReviewFilter(
    mode: "all" | "incomplete" | "flagged" | "unsure",
  ) {
    const ids = session.questions.map((q) => q.id);
    let target = 0;
    if (mode === "incomplete") {
      target = session.questions.findIndex(
        (q) => !isExamQuestionAnswered(q, answers, dragAnswers),
      );
    } else if (mode === "flagged") {
      target = ids.findIndex((id) => flagged.has(id));
    } else if (mode === "unsure") {
      target = ids.findIndex((id) => confidence[id] === "unsure");
    }
    setIndex(target >= 0 ? target : 0);
    setPhase("exam");
  }

  function goToReview() {
    commitElapsed();
    setNavOpen(false);
    setPhase("review");
  }

  if (submitting) {
    return <LoadingScreen message="Scoring your exam…" />;
  }

  if (phase === "done") {
    return (
      <div className="min-h-dvh px-4 py-8">
        <ExamSummary session={session} timeUsedSec={timeUsedSec} />
      </div>
    );
  }

  if (phase === "rules") {
    return (
      <ExamRules
        examCode={session.examCode}
        examName={session.exam}
        questionCount={total}
        durationMin={durationMin}
        passMark={passMark}
        questionsReady={session.questions.length > 0 && !starting}
        isGenerating={isGenerating}
        onStart={() => void startExam()}
      />
    );
  }

  if (phase === "resume") {
    const resumeRemaining =
      deadlineMs != null
        ? Math.max(0, Math.round((deadlineMs - Date.now()) / 1000))
        : durationSec;
    const savedAnswered = session.questions.filter((q) =>
      isExamQuestionAnswered(q, answers, dragAnswers),
    ).length;
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center gap-6 p-6 text-center">
        <div className="flex flex-col items-center gap-2">
          <h1 className="text-xl font-semibold">Resume your exam</h1>
          <p className="text-sm text-muted-foreground">
            {session.exam} · {savedAnswered} of {total} answered
          </p>
          <p
            className={cn(
              "flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-semibold tabular-nums",
              resumeRemaining <= 300
                ? "bg-destructive/15 text-destructive"
                : "bg-secondary text-foreground",
            )}
          >
            <Clock className="size-4" />
            {formatClock(resumeRemaining)} remaining
          </p>
        </div>
        <p className="max-w-sm text-sm text-muted-foreground">
          Your answers and flags were saved. The clock kept running from when
          you started — just like the real exam.
        </p>
        <Button size="lg" onClick={resumeExam} disabled={expired}>
          <Play data-icon="inline-start" />
          {expired ? "Time expired — scoring…" : "Resume exam"}
        </Button>
      </div>
    );
  }

  if (phase === "review") {
    return (
      <ItemReviewScreen
        total={total}
        answeredCount={answeredCount}
        flaggedCount={flagged.size}
        unsureCount={unsureCount}
        canSubmit={canSubmit}
        onReviewAll={() => beginReviewFilter("all")}
        onReviewIncomplete={() => beginReviewFilter("incomplete")}
        onReviewFlagged={() => beginReviewFilter("flagged")}
        onReviewUnsure={() => beginReviewFilter("unsure")}
        onEndReview={() => void handleSubmit()}
      />
    );
  }

  if (!question) {
    return <LoadingScreen message="Preparing question…" />;
  }

  const isFlagged = flagged.has(question.id);

  return (
    <div className="flex min-h-dvh flex-col bg-muted/20">
      <ExamHeader
        index={index}
        total={total}
        answeredCount={answeredCount}
        availableCount={availableCount}
        expectedTotal={expectedTotal}
        isGenerating={isGenerating}
        durationSec={durationSec}
        targetPerQuestion={targetPerQuestion}
        timerActive={timerActive && !submitting}
        deadlineMs={deadlineMs}
        examStarted={Boolean(session.examStartedAt)}
        onExitConfirmed={() => {
          commitElapsed();
          flush();
          onExit();
        }}
        onOpenShortcuts={() => setShortcutsOpen(true)}
        onOpenNav={() => setNavOpen(true)}
      />

      <div className="mx-auto flex w-full max-w-2xl flex-1 gap-6 px-4 py-6 xl:max-w-5xl">
        <div className="flex min-w-0 flex-1 flex-col gap-4">
          {examShowsAwsServiceHelp(session.examCode) && <AwsServiceHelp />}
          <div className="rounded-lg border border-border bg-card p-5 shadow-sm">
            <ExamQuestionPane
              question={question}
              selected={selected}
              dragAnswer={dragAnswer}
              isFlagged={isFlagged}
              onToggleOption={toggleOption}
              onDragAnswerChange={(next) => {
                setDragAnswers((prev) => ({ ...prev, [question.id]: next }));
                markDirty();
              }}
            />
          </div>

          {/* Confidence self-rating: powers the post-exam "misconception vs
            lucky guess" analysis, so guessing honestly pays off. */}
          <div className="flex items-center justify-between gap-3 rounded-lg border border-border bg-card px-4 py-3">
            <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <CircleHelp className="size-3.5" />
              How sure are you?
            </span>
            <div className="flex gap-1.5" role="group" aria-label="Confidence">
              <Button
                type="button"
                size="sm"
                variant={
                  confidence[question.id] === "sure" ? "secondary" : "outline"
                }
                className={cn(
                  confidence[question.id] === "sure" && "text-success",
                )}
                aria-pressed={confidence[question.id] === "sure"}
                onClick={() => setQuestionConfidence("sure")}
              >
                Sure
              </Button>
              <Button
                type="button"
                size="sm"
                variant={
                  confidence[question.id] === "unsure" ? "secondary" : "outline"
                }
                className={cn(
                  confidence[question.id] === "unsure" && "text-chart-3",
                )}
                aria-pressed={confidence[question.id] === "unsure"}
                onClick={() => setQuestionConfidence("unsure")}
              >
                Unsure
              </Button>
            </div>
          </div>
        </div>

        {/* Persistent navigator rail on wide screens; the Sheet covers mobile. */}
        <aside className="sticky top-20 hidden max-h-[calc(100dvh-8rem)] w-64 shrink-0 self-start overflow-y-auto xl:block">
          <div className="flex flex-col gap-3 rounded-lg border border-border bg-card p-4">
            <p className="text-xs font-medium text-muted-foreground">
              {answeredCount} of {total} answered · {flagged.size} flagged
            </p>
            <ExamNavigator
              total={total}
              currentIndex={index}
              answers={answers}
              dragAnswers={dragAnswers}
              questions={session.questions}
              flagged={flagged}
              unsure={unsureSet}
              questionIds={session.questions.map((q) => q.id)}
              onGoTo={goTo}
            />
          </div>
        </aside>
      </div>

      <footer className="sticky bottom-0 border-t border-border bg-background/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-sm">
        <div className="mx-auto flex max-w-2xl items-center gap-2 px-4 py-3">
          <Button
            variant="ghost"
            size="icon-lg"
            aria-label="Previous question"
            disabled={index === 0}
            onClick={() => goTo(index - 1)}
          >
            <ArrowLeft />
          </Button>
          <Button
            variant={isFlagged ? "secondary" : "outline"}
            size="lg"
            onClick={toggleFlag}
            className={cn(isFlagged && "text-chart-3")}
          >
            <Flag data-icon="inline-start" />
            {isFlagged ? "Flagged" : "Flag"}
          </Button>

          {index + 1 < availableCount ? (
            <Button
              size="lg"
              className="flex-1"
              onClick={() => goTo(index + 1)}
            >
              Next
              <ArrowRight data-icon="inline-end" />
            </Button>
          ) : (
            <Button
              size="lg"
              className="flex-1"
              disabled={!canSubmit}
              onClick={goToReview}
            >
              {canSubmit ? "Review & submit" : "Waiting for questions…"}
            </Button>
          )}
        </div>
      </footer>

      <Sheet open={navOpen} onOpenChange={setNavOpen}>
        <SheetContent side="right" className="flex w-full flex-col sm:max-w-md">
          <SheetHeader>
            <SheetTitle>Question navigator</SheetTitle>
            <SheetDescription>
              {answeredCount} of {total} answered · {flagged.size} flagged
            </SheetDescription>
          </SheetHeader>

          <div className="flex-1 overflow-y-auto px-4">
            <ExamNavigator
              total={total}
              currentIndex={index}
              answers={answers}
              dragAnswers={dragAnswers}
              questions={session.questions}
              flagged={flagged}
              unsure={unsureSet}
              questionIds={session.questions.map((q) => q.id)}
              onGoTo={goTo}
            />
          </div>

          <div className="mt-auto flex flex-col gap-2 border-t border-border p-4">
            <Button disabled={!canSubmit} onClick={goToReview}>
              Review & submit
            </Button>
          </div>
        </SheetContent>
      </Sheet>

      <Sheet open={shortcutsOpen} onOpenChange={setShortcutsOpen}>
        <SheetContent side="right" className="flex w-full flex-col sm:max-w-sm">
          <SheetHeader>
            <SheetTitle>Keyboard shortcuts</SheetTitle>
            <SheetDescription>
              Work the exam without the mouse.
            </SheetDescription>
          </SheetHeader>
          <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 px-4 text-sm">
            {[
              ["1–9", "Select answer option"],
              ["Alt + N / →", "Next question"],
              ["Alt + P / ←", "Previous question"],
              ["Alt + F", "Flag question"],
              ["Alt + U", "Mark unsure"],
              ["?", "Toggle this help"],
            ].map(([keys, action]) => (
              <div key={keys} className="contents">
                <dt>
                  <kbd className="rounded border border-border bg-secondary px-1.5 py-0.5 font-mono text-xs">
                    {keys}
                  </kbd>
                </dt>
                <dd className="text-muted-foreground">{action}</dd>
              </div>
            ))}
          </dl>
        </SheetContent>
      </Sheet>
    </div>
  );
}

interface ExamHeaderProps {
  index: number;
  total: number;
  answeredCount: number;
  availableCount: number;
  expectedTotal: number;
  isGenerating: boolean;
  durationSec: number;
  targetPerQuestion: number;
  timerActive: boolean;
  deadlineMs?: number;
  examStarted: boolean;
  onExitConfirmed: () => void;
  onOpenShortcuts: () => void;
  onOpenNav: () => void;
}

/**
 * Sticky exam header. Owns both once-a-second tickers (the countdown clock
 * and the per-question pace timer) so their re-renders stay confined here
 * instead of redrawing the whole runner. Expiry auto-submit deliberately does
 * NOT live here — this header is unmounted on the review screen, where the
 * clock must still fire (see the deadline watcher in ExamRunnerInner).
 */
function ExamHeader({
  index,
  total,
  answeredCount,
  availableCount,
  expectedTotal,
  isGenerating,
  durationSec,
  targetPerQuestion,
  timerActive,
  deadlineMs,
  examStarted,
  onExitConfirmed,
  onOpenShortcuts,
  onOpenNav,
}: ExamHeaderProps) {
  const remaining = useCountdown(durationSec, timerActive, undefined, deadlineMs);

  // Per-question pace: time spent on the current question vs the exam's
  // average allowance, so the learner feels real exam-day time pressure.
  const [qElapsed, setQElapsed] = useState(0);
  useEffect(() => {
    setQElapsed(0);
  }, [index]);
  useEffect(() => {
    if (!timerActive) return;
    const id = setInterval(() => setQElapsed((e) => e + 1), 1000);
    return () => clearInterval(id);
  }, [timerActive]);
  const qOver = qElapsed > targetPerQuestion;
  const qWayOver = qElapsed > targetPerQuestion * 1.6;

  // Whole-exam pace: with the remaining time and unanswered count, is the
  // learner on track to see every question?
  const unansweredCount = total - answeredCount;
  const neededPerQuestion =
    unansweredCount > 0 ? Math.floor(remaining / unansweredCount) : null;
  const behindPace =
    neededPerQuestion !== null && neededPerQuestion < targetPerQuestion * 0.75;

  const lowTime = remaining <= 60;
  const warnTime = remaining <= 300 && !lowTime;

  return (
    <header className="sticky top-0 z-10 border-b border-border bg-background/95 backdrop-blur-sm">
      <div className="mx-auto flex max-w-2xl items-center gap-3 px-4 py-3">
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="ghost" size="icon" aria-label="Exit exam">
              <X />
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Leave the exam?</AlertDialogTitle>
              <AlertDialogDescription>
                {examStarted
                  ? "Your progress is saved and the clock keeps running — resume anytime from History before time runs out."
                  : "Your exam won't be scored and progress will be lost."}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Keep going</AlertDialogCancel>
              <AlertDialogAction onClick={onExitConfirmed}>
                {examStarted ? "Save & exit" : "Leave exam"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        <div className="flex flex-1 flex-col gap-1.5">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span className="flex items-center gap-1.5">
              Question {index + 1} of {total}
              {/* Mobile pace dot — the full per-question chip is sm+ only. */}
              <span
                className={cn(
                  "size-2 rounded-full sm:hidden",
                  qWayOver
                    ? "bg-destructive"
                    : qOver
                      ? "bg-chart-3"
                      : "bg-success/60",
                )}
                title={`Time on this question: ${formatClock(qElapsed)} (target ~${formatClock(targetPerQuestion)})`}
                aria-hidden
              />
            </span>
            <span>{answeredCount} answered</span>
          </div>
          <Progress value={(answeredCount / total) * 100} className="h-1.5" />
          {isGenerating && (
            <p className="text-[11px] text-primary">
              {availableCount} of {expectedTotal} questions ready
            </p>
          )}
          {!isGenerating && behindPace && neededPerQuestion !== null && (
            <p className="text-[11px] font-medium text-chart-3">
              Behind pace — {formatClock(Math.max(0, neededPerQuestion))} per
              question to finish
            </p>
          )}
        </div>

        <div
          className={cn(
            "hidden items-center gap-1 rounded-md px-2 py-1.5 text-xs font-medium tabular-nums sm:flex",
            qWayOver
              ? "bg-destructive/15 text-destructive"
              : qOver
                ? "bg-chart-3/15 text-chart-3"
                : "bg-secondary/60 text-muted-foreground",
          )}
          title={`Target ~${formatClock(targetPerQuestion)} per question`}
          aria-label="Time on this question"
        >
          <Timer className="size-3.5" />
          {formatClock(qElapsed)}
        </div>

        <div
          className={cn(
            "flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-sm font-semibold tabular-nums",
            lowTime
              ? "bg-destructive/15 text-destructive"
              : warnTime
                ? "bg-chart-3/15 text-chart-3"
                : "bg-secondary text-foreground",
          )}
          role="timer"
          aria-label="Time remaining"
        >
          <Clock className="size-4" />
          {formatClock(remaining)}
        </div>
        {/* Announce only threshold crossings, not every tick. */}
        <span className="sr-only" aria-live="polite">
          {lowTime
            ? "Less than one minute remaining"
            : warnTime
              ? "Less than five minutes remaining"
              : ""}
        </span>

        <Button
          variant="ghost"
          size="icon"
          aria-label="Keyboard shortcuts"
          className="hidden sm:inline-flex"
          onClick={onOpenShortcuts}
        >
          <Keyboard />
        </Button>

        <Button
          variant="ghost"
          size="icon"
          aria-label="Question navigator"
          className="xl:hidden"
          onClick={onOpenNav}
        >
          <LayoutGrid />
        </Button>
      </div>
    </header>
  );
}
