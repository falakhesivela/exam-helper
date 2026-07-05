import type {
  AnswerRecord,
  DragAnswer,
  PracticeSession,
  Question,
} from "@/types";
import type { ExamBlueprint } from "@/lib/exams/types";
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
    return false;
  }
  return selectedIds.length > 0;
}

/**
 * How many options a multi-select MCQ expects, when derivable from the stem
 * ("Select TWO answers", "Choose three responses"). Null when unknown.
 */
export function expectedSelectionCount(question: Question): number | null {
  if (!isMcqQuestion(question) || !question.multiSelect) return null;
  const stem = questionStemText(question).toLowerCase();
  if (/\bthree\b/.test(stem)) return 3;
  if (/\btwo\b/.test(stem)) return 2;
  return null;
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

/** Computes the score for a session with separate skipped count. */
export function scoreOf(session: PracticeSession): {
  correct: number;
  total: number;
  answered: number;
  skipped: number;
  pct: number;
} {
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

/**
 * Domain scorecard for exam sessions.
 * Prefers domainId + blueprint names; falls back to question.topic.
 */
export function domainBreakdown(
  session: PracticeSession,
  blueprint?: ExamBlueprint | null,
) {
  const map = new Map<
    string,
    { topic: string; correct: number; total: number }
  >();

  for (const q of session.questions) {
    const key = q.domainId ?? q.topic;
    const topic =
      (q.domainId &&
        blueprint?.domains.find((d) => d.id === q.domainId)?.name) ||
      q.topic;
    const entry = map.get(key) ?? { topic, correct: 0, total: 0 };
    entry.total += 1;
    if (session.answers[q.id]?.isCorrect) entry.correct += 1;
    map.set(key, entry);
  }

  return [...map.values()]
    .map((v) => ({
      topic: v.topic,
      correct: v.correct,
      total: v.total,
      pct: Math.round((v.correct / v.total) * 100),
    }))
    .sort((a, b) => a.topic.localeCompare(b.topic));
}
