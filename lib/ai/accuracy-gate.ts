// Accuracy gate: blind re-answer verification for generated MCQs.
//
// A second model (routed independently via AI_MODEL_VERIFY — by default a
// different provider than generation, which decorrelates their mistakes)
// answers each question WITHOUT seeing the stored answer key. A question whose
// blind answer disagrees with its key is rejected and regenerated upstream.
// This targets the worst content-error class: a wrong answer key.
//
// The gate fails open: if the verify call errors (provider down, key unset),
// questions pass through unverified — generation must never break because
// verification is unavailable. Disable entirely with AI_ACCURACY_GATE=off.

import { z } from "zod"
import { callStructured, type AiContext } from "./client"
import type { GeneratedMcqQuestion } from "./schemas"

const blindAnswersSchema = z.object({
  answers: z.array(
    z.object({
      index: z.number().int(),
      optionIds: z.array(z.string()),
    }),
  ),
})

type BlindAnswers = z.infer<typeof blindAnswersSchema>

export function accuracyGateEnabled(): boolean {
  return process.env.AI_ACCURACY_GATE?.trim().toLowerCase() !== "off"
}

function uniqueSorted(ids: string[]): string[] {
  return [...new Set(ids)].sort()
}

function sameAnswerSet(a: string[], b: string[]): boolean {
  const x = uniqueSorted(a)
  const y = uniqueSorted(b)
  return x.length === y.length && x.every((id, i) => id === y[i])
}

const VERIFY_SYSTEM_PROMPT = [
  "You are an expert candidate sitting a professional certification exam.",
  "Answer each question below using only your own domain knowledge.",
  "Read every option carefully; do not pattern-match on option position or length.",
  "For each question return the id(s) of the option(s) you are confident are correct.",
].join(" ")

interface VerifiableMcq {
  prompt: string
  scenario?: string | null
  options: { id: string; text: string }[]
  correctOptionIds: string[]
  multiSelect?: boolean
}

function buildVerifyPrompt(questions: VerifiableMcq[]): string {
  return questions
    .map((q, index) => {
      const expected = uniqueSorted(q.correctOptionIds).length
      const instruction =
        q.multiSelect && expected > 1
          ? `Select exactly ${expected} options.`
          : "Select exactly one option."
      return [
        `Question ${index} (${instruction})`,
        q.scenario?.trim() ? `Scenario: ${q.scenario.trim()}` : "",
        q.prompt,
        "Options:",
        ...q.options.map((o) => `${o.id}) ${o.text}`),
      ]
        .filter(Boolean)
        .join("\n")
    })
    .join("\n\n")
}

/**
 * Blind-check a batch of generated MCQs. Returns the questions whose stored
 * answer key the checker independently reproduced, plus the rejected ones.
 * Unverifiable questions (checker skipped the index, call failed) pass —
 * fail-open by design.
 */
export async function verifyMcqBatch(
  questions: GeneratedMcqQuestion[],
  ctx: AiContext = {},
): Promise<{ passed: GeneratedMcqQuestion[]; rejected: GeneratedMcqQuestion[] }> {
  if (!accuracyGateEnabled() || questions.length === 0) {
    return { passed: questions, rejected: [] }
  }

  let result: BlindAnswers
  try {
    result = await callStructured<BlindAnswers>(
      "verify",
      ctx,
      VERIFY_SYSTEM_PROMPT,
      buildVerifyPrompt(questions),
      blindAnswersSchema,
      "blind_answers",
    )
  } catch (err) {
    console.warn("[accuracy-gate] verify call failed — passing batch through:", err)
    return { passed: questions, rejected: [] }
  }

  const byIndex = new Map(result.answers.map((a) => [a.index, a.optionIds]))
  const passed: GeneratedMcqQuestion[] = []
  const rejected: GeneratedMcqQuestion[] = []

  questions.forEach((q, index) => {
    const blind = byIndex.get(index)
    if (!blind || blind.length === 0) {
      // Checker skipped it — can't verify, don't punish the question.
      passed.push(q)
      return
    }
    if (sameAnswerSet(blind, q.correctOptionIds)) {
      passed.push(q)
    } else {
      console.warn(
        `[accuracy-gate] rejected "${q.topic}" — key ${uniqueSorted(q.correctOptionIds).join(",")} vs blind ${uniqueSorted(blind).join(",")}`,
      )
      rejected.push(q)
    }
  })

  return { passed, rejected }
}

export type ReportVerdict = "agrees" | "disagrees" | "unverified"

/**
 * Blind-check one stored question (used when a learner reports it). "agrees"
 * means the checker independently reproduced the stored key — the report is
 * probably about wording, not correctness. "disagrees" means the key itself
 * is suspect.
 */
export async function verifyStoredMcq(
  question: VerifiableMcq,
  ctx: AiContext = {},
): Promise<ReportVerdict> {
  if (
    !accuracyGateEnabled() ||
    question.options.length === 0 ||
    question.correctOptionIds.length === 0
  ) {
    return "unverified"
  }

  try {
    const result = await callStructured<BlindAnswers>(
      "verify",
      ctx,
      VERIFY_SYSTEM_PROMPT,
      buildVerifyPrompt([question]),
      blindAnswersSchema,
      "blind_answers",
    )
    const blind = result.answers[0]?.optionIds
    if (!blind || blind.length === 0) return "unverified"
    return sameAnswerSet(blind, question.correctOptionIds)
      ? "agrees"
      : "disagrees"
  } catch (err) {
    console.warn("[accuracy-gate] stored-question verify failed:", err)
    return "unverified"
  }
}
