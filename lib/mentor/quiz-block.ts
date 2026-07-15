// Inline quiz protocol for Mentor replies. The model emits a fenced code block
// tagged `quiz` containing one JSON object; the chat UI renders it as an
// interactive question card instead of a code block. Pure string/JSON work —
// no runtime imports — so it runs under `node --test`.

import type { QuestionOption } from "@/types"

export interface MentorQuiz {
  question: string
  options: QuestionOption[]
  correctOptionIds: string[]
  multiSelect: boolean
  explanation: string
}

export type MentorSegment =
  /** Prose between quiz blocks, rendered as regular markdown. */
  | { type: "markdown"; text: string }
  | { type: "quiz"; quiz: MentorQuiz }
  /** An unclosed ```quiz fence at the tail of a still-streaming reply. */
  | { type: "pending-quiz" }
  /** A closed ```quiz fence whose JSON didn't validate. */
  | { type: "invalid-quiz" }

const MIN_OPTIONS = 2
const MAX_OPTIONS = 6

/** Strict validation: a malformed model payload must never render half a quiz. */
export function parseQuizJson(raw: string): MentorQuiz | null {
  let data: unknown
  try {
    data = JSON.parse(raw)
  } catch {
    return null
  }
  if (typeof data !== "object" || data === null || Array.isArray(data)) return null
  const q = data as Record<string, unknown>

  if (typeof q.question !== "string" || !q.question.trim()) return null
  if (!Array.isArray(q.options)) return null
  if (q.options.length < MIN_OPTIONS || q.options.length > MAX_OPTIONS) return null

  const options: QuestionOption[] = []
  const seen = new Set<string>()
  for (const raw of q.options) {
    if (typeof raw !== "object" || raw === null) return null
    const { id, text } = raw as Record<string, unknown>
    if (typeof id !== "string" || !id.trim()) return null
    if (typeof text !== "string" || !text.trim()) return null
    if (seen.has(id)) return null
    seen.add(id)
    options.push({ id, text })
  }

  if (!Array.isArray(q.correctOptionIds) || q.correctOptionIds.length === 0)
    return null
  const correct = [...new Set(q.correctOptionIds)]
  if (!correct.every((id) => typeof id === "string" && seen.has(id))) return null
  // Every option "correct" is not a question.
  if (correct.length >= options.length) return null

  return {
    question: q.question.trim(),
    options,
    correctOptionIds: correct as string[],
    multiSelect: q.multiSelect === true || correct.length > 1,
    explanation: typeof q.explanation === "string" ? q.explanation.trim() : "",
  }
}

const QUIZ_FENCE = /```quiz[^\S\n]*\n([\s\S]*?)```/g
const OPEN_FENCE = /```quiz[^\S\n]*(\n[\s\S]*)?$/

/**
 * Split a Mentor reply into markdown prose and quiz blocks. While `streaming`,
 * a trailing unclosed fence becomes a `pending-quiz` placeholder instead of
 * leaking raw JSON into the bubble token by token.
 */
export function parseMentorContent(
  content: string,
  opts?: { streaming?: boolean },
): MentorSegment[] {
  const segments: MentorSegment[] = []
  let cursor = 0

  const pushMarkdown = (text: string) => {
    if (text.trim()) segments.push({ type: "markdown", text })
  }

  for (const match of content.matchAll(QUIZ_FENCE)) {
    pushMarkdown(content.slice(cursor, match.index))
    const quiz = parseQuizJson(match[1])
    segments.push(quiz ? { type: "quiz", quiz } : { type: "invalid-quiz" })
    cursor = match.index + match[0].length
  }

  const tail = content.slice(cursor)
  const open = tail.match(OPEN_FENCE)
  if (open) {
    pushMarkdown(tail.slice(0, open.index))
    // Mid-stream the fence just hasn't closed yet; in a finished reply an
    // unclosed fence is a malformed block.
    segments.push({ type: opts?.streaming ? "pending-quiz" : "invalid-quiz" })
  } else {
    pushMarkdown(tail)
  }

  return segments
}
