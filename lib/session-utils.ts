import type {
  AnswerRecord,
  DragAnswer,
  PracticeSession,
  Question,
} from "@/types";
import { gradeDragAnswer as gradeDrag } from "@/lib/db/sessions";
import { questionStemText } from "@/lib/question-stem";

export function questionTypeOf(question: Question) {
  return question.questionType ?? "mcq";
}

export function isMcqQuestion(question: Question) {
  return questionTypeOf(question) === "mcq";
}

export function isDragQuestion(question: Question) {
  return questionTypeOf(question) !== "mcq";
}

/** Whether the user has provided a substantive answer for this question. */
export function isQuestionAnswered(
  question: Question,
  selectedIds: string[],
  dragAnswer?: DragAnswer,
): boolean {
  if (isDragQuestion(question)) {
    if (!dragAnswer || !question.dragData) return false;
    if (
      dragAnswer.type === "drag_match" &&
      question.dragData.type === "drag_match"
    ) {
      return (
        Object.keys(dragAnswer.mapping).length >=
        question.dragData.targets.length
      );
    }
    if (
      dragAnswer.type === "drag_order" &&
      question.dragData.type === "drag_order"
    ) {
      return dragAnswer.order.length >= question.dragData.items.length;
    }
    if (
      dragAnswer.type === "drag_categorize" &&
      question.dragData.type === "drag_categorize"
    ) {
      const assigned = Object.values(dragAnswer.buckets).flat();
      return assigned.length >= question.dragData.items.length;
    }
    if (
      dragAnswer.type === "select_grid" &&
      question.dragData.type === "select_grid"
    ) {
      // Every row must have a selection.
      return question.dragData.rows.every(
        (r) => dragAnswer.selections[r.id] != null,
      );
    }
    if (
      dragAnswer.type === "command_input" &&
      question.dragData.type === "command_input"
    ) {
      return dragAnswer.value.trim().length > 0;
    }
    return false;
  }
  return selectedIds.length > 0;
}

/**
 * How many options a multi-select MCQ expects, when derivable from explicit
 * stem instructions ("Select TWO answers", "Which three…"). Null when unknown.
 *
 * Avoids false positives from incidental "two" (e.g. "across two Regions").
 */
export function expectedSelectionCount(question: Question): number | null {
  if (!isMcqQuestion(question) || !question.multiSelect) return null;
  const stem = questionStemText(question).toLowerCase();

  const verbCount = stem.match(
    /\b(?:select|choose|pick)(?:\s+(?:the|all|exactly|only))?\s*(two|three|2|3)\b/,
  );
  if (verbCount) {
    return verbCount[1] === "three" || verbCount[1] === "3" ? 3 : 2;
  }

  const whichCount = stem.match(/\bwhich\s+(two|three|2|3)\b/);
  if (whichCount) {
    return whichCount[1] === "three" || whichCount[1] === "3" ? 3 : 2;
  }

  const parenCount = stem.match(/\(\s*select\s+(two|three|2|3)\b/);
  if (parenCount) {
    return parenCount[1] === "three" || parenCount[1] === "3" ? 3 : 2;
  }

  return null;
}

/** Keep only option ids that exist on the current question. */
export function validMcqSelections(
  question: Question,
  selectedIds: string[],
): string[] {
  if (!isMcqQuestion(question)) return selectedIds;
  const optionIds = new Set((question.options ?? []).map((o) => o.id));
  return selectedIds.filter((id) => optionIds.has(id));
}

/** Label for the submit button while a counted multi-select is incomplete. */
export function multiSelectSubmitLabel(
  selectedCount: number,
  expectedCount: number,
): string {
  if (selectedCount < expectedCount) {
    const remaining = expectedCount - selectedCount;
    return `Select ${remaining} more (${selectedCount}/${expectedCount})`;
  }
  return `Too many selected (${selectedCount}/${expectedCount})`;
}

function recordHasResponse(record: AnswerRecord): boolean {
  return (
    record.skipped ||
    record.selectedOptionIds.length > 0 ||
    record.dragAnswer != null
  );
}

/**
 * Whether a question still carries its answer key. The server strips
 * `correctOptionIds`/`explanation` (and drag answer keys) from questions the
 * user hasn't answered yet, so an empty explanation marks a stripped copy.
 */
function questionHasAnswerKey(question: Question): boolean {
  return (
    (question.correctOptionIds?.length ?? 0) > 0 ||
    question.explanation.length > 0
  );
}

/**
 * Merge a freshly fetched session over the locally cached one. Server records
 * are the graded source of truth; a local record only wins when the server
 * snapshot has no substantive response yet (e.g. a poll raced an answer PATCH
 * and only carries a mark-for-review stub).
 *
 * Questions merge the same way: a stale poll snapshot must never replace a
 * revealed question (answer key present) with its stripped copy, nor shrink
 * the question list while generation streams new ones in.
 */
export function mergeSessionUpdate(
  existing: PracticeSession | undefined,
  incoming: PracticeSession,
): PracticeSession {
  if (!existing) return incoming;
  const answers: Record<string, AnswerRecord> = { ...incoming.answers };
  for (const [questionId, record] of Object.entries(existing.answers)) {
    const fresh = answers[questionId];
    if (!fresh || (recordHasResponse(record) && !recordHasResponse(fresh))) {
      answers[questionId] = record;
    }
  }

  const existingById = new Map(existing.questions.map((q) => [q.id, q]));
  const incomingIds = new Set(incoming.questions.map((q) => q.id));
  const questions = incoming.questions.map((q) => {
    const prev = existingById.get(q.id);
    return prev && questionHasAnswerKey(prev) && !questionHasAnswerKey(q)
      ? prev
      : q;
  });
  for (const q of existing.questions) {
    if (!incomingIds.has(q.id)) questions.push(q);
  }

  return {
    ...incoming,
    currentIndex: Math.max(existing.currentIndex, incoming.currentIndex),
    questions,
    answers,
  };
}

/** Compares two arrays of option ids regardless of order. */
export function isAnswerCorrect(
  question: Question,
  selectedIds: string[],
  dragAnswer?: DragAnswer,
): boolean {
  if (isDragQuestion(question)) {
    return gradeDrag(question.dragData, dragAnswer);
  }
  const correct = [...(question.correctOptionIds ?? [])].sort();
  const selected = [...selectedIds].sort();
  return (
    correct.length === selected.length &&
    correct.every((id, i) => id === selected[i])
  );
}

// Pure post-exam analysis helpers live in exam-insights.ts (no runtime
// imports, so they run under `node --test`); re-exported here for callers.
export {
  confidenceBreakdown,
  domainBreakdown,
  paceReport,
  weakestDomains,
} from "./exam-insights";
export type {
  ConfidenceBreakdown,
  DomainScore,
  PaceEntry,
  PaceFlag,
  PaceReport,
} from "./exam-insights";

/** Whether this store entry is a list-view stub without question payloads. */
export function isSessionSummary(session: PracticeSession): boolean {
  return session.summary === true;
}

/** Computes the score for a session with separate skipped count. */
export function scoreOf(session: PracticeSession): {
  correct: number;
  total: number;
  answered: number;
  skipped: number;
  pct: number;
} {
  // Summary stubs carry server-computed counts instead of question payloads.
  if (session.summary && session.scoreSummary) {
    const { correct, answered, skipped, total } = session.scoreSummary;
    const pct = total > 0 ? Math.round((correct / total) * 100) : 0;
    return { correct, total, answered, skipped, pct };
  }

  let correct = 0;
  let answered = 0;
  let skipped = 0;
  const total = session.questions.length;

  for (const q of session.questions) {
    const a = session.answers[q.id];
    if (!a) continue;
    if (a.skipped) {
      skipped += 1;
      continue;
    }
    const hasAnswer =
      a.selectedOptionIds.length > 0 || a.dragAnswer != null || a.isCorrect;
    if (!hasAnswer) continue;
    answered += 1;
    if (a.isCorrect) correct += 1;
  }

  const pct = total > 0 ? Math.round((correct / total) * 100) : 0;
  return { correct, total, answered, skipped, pct };
}

/** Aggregates correct/incorrect counts per topic for a finished session. */
export function topicBreakdown(session: PracticeSession) {
  const map = new Map<string, { correct: number; total: number }>();
  for (const q of session.questions) {
    const entry = map.get(q.topic) ?? { correct: 0, total: 0 };
    entry.total += 1;
    if (session.answers[q.id]?.isCorrect) entry.correct += 1;
    map.set(q.topic, entry);
  }
  return [...map.entries()].map(([topic, v]) => ({
    topic,
    ...v,
    pct: Math.round((v.correct / v.total) * 100),
  }));
}

