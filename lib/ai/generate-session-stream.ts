import type { SupabaseClient } from "@supabase/supabase-js"
import { streamGenerateQuestions } from "@/lib/ai/stream"
import type { SseSend } from "@/lib/ai/sse"
import type { GeneratedQuestion } from "@/lib/ai/schemas"
import {
  appendQuestion,
  createSessionShell,
  finalizeSessionGeneration,
  loadSession,
} from "@/lib/db/sessions"
import { toQuestion, type DbQuestion } from "@/lib/db/mappers"
import { incrementUsage } from "@/lib/db/usage"
import type { PracticeSession } from "@/types"

export interface GenerateSessionStreamParams {
  description: string
  clarifications?: Record<string, string>
  count: number
  groundingText?: string
  mode: "practice" | "exam"
  exam?: string
  examCode?: string
  focusTopics?: string[]
  durationSec?: number
  passMark?: number
}

function safeSend(send: SseSend, event: string, data: unknown) {
  try {
    send(event, data)
  } catch {
    // Client disconnected — keep persisting to DB.
  }
}

async function upsertQuestionAtPosition(
  admin: SupabaseClient,
  sessionId: string,
  question: GeneratedQuestion,
  position: number,
) {
  const { data: existing } = await admin
    .from("questions")
    .select("id")
    .eq("session_id", sessionId)
    .eq("position", position)
    .maybeSingle()

  if (existing) {
    const { data: updated, error } = await admin
      .from("questions")
      .update({
        topic: question.topic,
        difficulty: question.difficulty,
        multi_select: question.multiSelect,
        prompt: question.prompt,
        options: question.options,
        correct_option_ids: question.correctOptionIds,
        explanation: question.explanation,
        references: question.references,
      })
      .eq("id", existing.id)
      .select()
      .single()

    if (error || !updated) throw error ?? new Error("Failed to update question")
    return toQuestion(updated as DbQuestion)
  }

  return appendQuestion(admin, sessionId, question, position)
}

export async function runGenerateSessionStream(
  admin: SupabaseClient,
  userId: string,
  params: GenerateSessionStreamParams,
  send: SseSend,
  options: {
    timezone: string
    remainingFreeQuestions?: number
  },
): Promise<PracticeSession & { remainingFreeQuestions?: number }> {
  let sessionId: string | null = null
  let readySent = false
  let savedCount = 0
  let shellMeta = {
    exam: params.exam ?? "Certification Exam",
    examCode: params.examCode ?? "CUSTOM",
    focusTopics: params.focusTopics ?? ["Mixed topics"],
  }

  const saveQueue: Promise<void>[] = []

  async function ensureShell() {
    if (sessionId) return sessionId
    const shell = await createSessionShell(admin, userId, {
      exam: shellMeta.exam,
      examCode: shellMeta.examCode,
      focusTopics: shellMeta.focusTopics,
      mode: params.mode,
      expectedQuestionCount: params.count,
      durationSec: params.durationSec,
      passMark: params.passMark,
    })
    sessionId = shell.id
    return sessionId
  }

  async function saveQuestion(index: number, question: GeneratedQuestion) {
    await ensureShell()
    if (!sessionId) throw new Error("Session shell missing after create")

    const { count: existing } = await admin
      .from("questions")
      .select("*", { count: "exact", head: true })
      .eq("session_id", sessionId)
      .eq("position", index)

    if ((existing ?? 0) === 0) {
      await appendQuestion(admin, sessionId, question, index)
    }

    savedCount = Math.max(savedCount, index + 1)
    safeSend(send, "question", { index, question, total: params.count })

    if (!readySent) {
      const session = await loadSession(admin, sessionId, userId)
      if (session && session.questions.length > 0) {
        readySent = true
        safeSend(send, "ready", { sessionId, session })
      }
    }
  }

  try {
    safeSend(send, "status", { message: "Generating exam-style questions…" })

    const generated = await streamGenerateQuestions(
      {
        description: params.description,
        clarifications: params.clarifications,
        count: params.count,
        groundingText: params.groundingText,
      },
      {
        onMetadata: (meta) => {
          if (meta.exam) shellMeta.exam = meta.exam
          if (meta.examCode) shellMeta.examCode = meta.examCode
          if (meta.focusTopics?.length) shellMeta.focusTopics = meta.focusTopics
          safeSend(send, "metadata", meta)
        },
        onQuestionPreview: (index, preview) =>
          safeSend(send, "question_preview", { index, ...preview, total: params.count }),
        onQuestion: (index, question) => {
          saveQueue.push(saveQuestion(index, question))
        },
      },
    )

    await Promise.all(saveQueue)

    shellMeta = {
      exam: generated.exam,
      examCode: generated.examCode,
      focusTopics: generated.focusTopics,
    }

    await ensureShell()
    if (!sessionId) throw new Error("Failed to create session")

    // Sync final validated set (handles regen attempts and partial stream saves)
    for (let i = 0; i < generated.questions.length; i++) {
      await upsertQuestionAtPosition(
        admin,
        sessionId,
        generated.questions[i],
        i,
      )
    }

    await finalizeSessionGeneration(admin, sessionId, "complete")
    await incrementUsage(admin, userId, options.timezone, params.count)

    const session = await loadSession(admin, sessionId, userId)
    if (!session) throw new Error("Failed to load session after generation")

    if (!readySent) {
      safeSend(send, "ready", { sessionId, session })
    }

    const result = {
      ...session,
      remainingFreeQuestions: options.remainingFreeQuestions,
    }

    safeSend(send, "done", result)
    return result
  } catch (err) {
    if (sessionId) {
      await finalizeSessionGeneration(admin, sessionId, "failed").catch(() => {})
    }
    throw err
  }
}
