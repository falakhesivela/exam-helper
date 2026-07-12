// Pure post-exam analysis helpers. Deliberately free of runtime imports so
// they run under `node --test` (types only), and re-exported from
// session-utils for existing call sites.

import type { PracticeSession } from "@/types";
import type { ExamBlueprint } from "@/lib/exams/types";

export interface ConfidenceBreakdown {
  /** Answers that carried a confidence rating. */
  rated: number;
  /** Sure + correct. */
  solid: number;
  /** Sure + wrong — the dangerous quadrant. */
  overconfident: number;
  /** Unsure + correct — knows more than they think. */
  lucky: number;
  /** Unsure + wrong — expected gaps. */
  shaky: number;
}

/** Tally the confidence-vs-correctness quadrants for a session. */
export function confidenceBreakdown(
  session: PracticeSession,
): ConfidenceBreakdown {
  const out: ConfidenceBreakdown = {
    rated: 0,
    solid: 0,
    overconfident: 0,
    lucky: 0,
    shaky: 0,
  };
  for (const a of Object.values(session.answers)) {
    if (!a.confidence) continue;
    out.rated += 1;
    if (a.confidence === "sure") {
      if (a.isCorrect) out.solid += 1;
      else out.overconfident += 1;
    } else {
      if (a.isCorrect) out.lucky += 1;
      else out.shaky += 1;
    }
  }
  return out;
}

export interface DomainScore {
  topic: string;
  domainId?: string;
  correct: number;
  total: number;
  pct: number;
}

/**
 * Domain scorecard for exam sessions.
 * Prefers domainId + blueprint names; falls back to question.topic.
 */
export function domainBreakdown(
  session: PracticeSession,
  blueprint?: ExamBlueprint | null,
): DomainScore[] {
  const map = new Map<
    string,
    { topic: string; domainId?: string; correct: number; total: number }
  >();

  for (const q of session.questions) {
    const key = q.domainId ?? q.topic;
    const topic =
      (q.domainId &&
        blueprint?.domains.find((d) => d.id === q.domainId)?.name) ||
      q.topic;
    const entry =
      map.get(key) ?? { topic, domainId: q.domainId, correct: 0, total: 0 };
    entry.total += 1;
    if (session.answers[q.id]?.isCorrect) entry.correct += 1;
    map.set(key, entry);
  }

  return [...map.values()]
    .map((v) => ({
      topic: v.topic,
      domainId: v.domainId,
      correct: v.correct,
      total: v.total,
      pct: Math.round((v.correct / v.total) * 100),
    }))
    .sort((a, b) => a.topic.localeCompare(b.topic));
}

/**
 * The domains most likely to sink the real exam: below the pass mark,
 * weakest first. Domains with a single question are still included — one
 * blown question in a 10-question mock is real signal for the learner.
 */
export function weakestDomains(
  breakdown: DomainScore[],
  passMark: number,
  max = 2,
): DomainScore[] {
  return breakdown
    .filter((d) => d.pct < passMark)
    .sort((a, b) => a.pct - b.pct || b.total - a.total)
    .slice(0, max);
}

export type PaceFlag = "rushed" | "overtime" | null;

export interface PaceEntry {
  questionId: string;
  /** 1-based question number, matching the review screen. */
  position: number;
  timeSpentSec: number;
  isCorrect: boolean;
  flag: PaceFlag;
}

export interface PaceReport {
  targetPerQuestion: number;
  avgPerAnswered: number;
  /** Answered in under ~40% of the target AND wrong — likely careless. */
  rushedWrong: number;
  /** Took over 1.6× the target — where the clock actually went. */
  overtime: number;
  entries: PaceEntry[];
}

/**
 * Per-question time analysis for a completed exam. Returns null when no
 * timing data was recorded (older sessions, practice mode).
 */
export function paceReport(session: PracticeSession): PaceReport | null {
  const durationSec = session.durationSec;
  const total = session.questions.length;
  if (!durationSec || total === 0) return null;

  const targetPerQuestion = Math.round(durationSec / total);
  const entries: PaceEntry[] = [];
  let timedSum = 0;
  let timedCount = 0;

  session.questions.forEach((q, i) => {
    const a = session.answers[q.id];
    const time = a?.timeSpentSec ?? 0;
    if (time <= 0) return;
    const isCorrect = a?.isCorrect ?? false;
    let flag: PaceFlag = null;
    if (time > targetPerQuestion * 1.6) flag = "overtime";
    else if (time < targetPerQuestion * 0.4 && !isCorrect && !a?.skipped) {
      flag = "rushed";
    }
    entries.push({
      questionId: q.id,
      position: i + 1,
      timeSpentSec: time,
      isCorrect,
      flag,
    });
    timedSum += time;
    timedCount += 1;
  });

  if (timedCount === 0) return null;

  return {
    targetPerQuestion,
    avgPerAnswered: Math.round(timedSum / timedCount),
    rushedWrong: entries.filter((e) => e.flag === "rushed").length,
    overtime: entries.filter((e) => e.flag === "overtime").length,
    entries,
  };
}
