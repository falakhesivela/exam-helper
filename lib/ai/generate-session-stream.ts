import type { SupabaseClient } from "@supabase/supabase-js"
import { streamGenerateDragQuestions, streamGenerateQuestions } from "@/lib/ai/stream"
import type { SseSend } from "@/lib/ai/sse"
import type { GeneratedQuestion } from "@/lib/ai/schemas"
import type { Question } from "@/types"
import {
  examDomainBatchPrompt,
  examDragBatchPrompt,
  examDragSystemPrompt,
  examSimulationSystemPrompt,
} from "@/lib/ai/prompts"
import {
  allocateDragByDomain,
  allocateQuestionTypes,
  allocateQuestionsByDomain,
  domainGroundingText,
  type ExamBlueprint,
  type ExamBlueprintDomain,
} from "@/lib/exams"
import {
  appendQuestion,
  createSessionShell,
  finalizeSessionGeneration,
  loadSession,
} from "@/lib/db/sessions"
import { toQuestion, generatedQuestionToDb, type DbQuestion } from "@/lib/db/mappers"
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
  /** When set for exam mode, questions are generated per domain by weight. */
  blueprint?: ExamBlueprint
  /** When set, generation is limited to these blueprint domain ids (weak-area exams). */
  focusDomainIds?: string[]
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
    const row = generatedQuestionToDb(question)
    const { data: updated, error } = await admin
      .from("questions")
      .update(row)
      .eq("id", existing.id)
      .select()
      .single()

    if (error || !updated) throw error ?? new Error("Failed to update question")
    return toQuestion(updated as DbQuestion)
  }

  return appendQuestion(admin, sessionId, question, position)
}

interface GenerationCallbacks {
  onMetadata?: (meta: {
    exam?: string
    examCode?: string
    focusTopics?: string[]
  }) => void
  onQuestionPreview?: (
    index: number,
    preview: { topic?: string; difficulty?: string },
  ) => void
  onQuestion?: (index: number, question: GeneratedQuestion) => void
}

async function generateAllQuestions(
  params: GenerateSessionStreamParams,
  total: number,
  callbacks: GenerationCallbacks,
): Promise<{
  exam: string
  examCode: string
  focusTopics: string[]
  questions: GeneratedQuestion[]
}> {
  if (
    params.blueprint &&
    (params.mode === "exam" || (params.focusDomainIds?.length ?? 0) > 0)
  ) {
    return generateBlueprintExamQuestions(
      params.blueprint,
      total,
      callbacks,
      params.focusDomainIds,
      params.groundingText,
      { includeDrag: true },
    )
  }

  return streamGenerateQuestions(
    {
      description: params.description,
      clarifications: params.clarifications,
      count: total,
      groundingText: params.groundingText,
    },
    callbacks,
  )
}

function tagForDomain(
  question: GeneratedQuestion,
  domain: ExamBlueprintDomain,
): GeneratedQuestion {
  return { ...question, topic: domain.name, domainId: domain.id }
}

function syllabusGroundingBlock(groundingText?: string): string[] {
  if (!groundingText?.trim()) return []
  return [
    "",
    "Syllabus excerpt (use for topic grounding):",
    groundingText.trim().slice(0, 8000),
  ]
}

async function generateBlueprintExamQuestions(
  blueprint: ExamBlueprint,
  total: number,
  callbacks: GenerationCallbacks,
  focusDomainIds?: string[],
  groundingText?: string,
  options?: { includeDrag?: boolean },
): Promise<{
  exam: string
  examCode: string
  focusTopics: string[]
  questions: GeneratedQuestion[]
}> {
  const domainFilter =
    focusDomainIds && focusDomainIds.length > 0
      ? blueprint.domains.filter((d) => focusDomainIds.includes(d.id))
      : blueprint.domains
  const domains =
    domainFilter.length > 0 ? domainFilter : blueprint.domains

  const typeAlloc = allocateQuestionTypes(
    total,
    options?.includeDrag === false ? undefined : blueprint.questionTypeMix,
  )
  const mcqTotal = typeAlloc.find((t) => t.type === "mcq")?.count ?? total
  const dragAlloc = typeAlloc.filter((t) => t.type !== "mcq")

  const allocations = allocateQuestionsByDomain(mcqTotal, domains)
  const systemPrompt = examSimulationSystemPrompt(blueprint)
  const dragSystemPrompt = examDragSystemPrompt(blueprint)
  const mcqQuestions: GeneratedQuestion[] = []
  let globalIndex = 0

  callbacks.onMetadata?.({
    exam: blueprint.exam,
    examCode: blueprint.examCode,
    focusTopics: domains.map((d) => d.name),
  })

  for (const { domain, count } of allocations) {
    if (count <= 0) continue
    const userPrompt = [
      examDomainBatchPrompt(blueprint, domain, count),
      "",
      domainGroundingText(domain),
      ...syllabusGroundingBlock(groundingText),
    ].join("\n")

    const batch = await streamGenerateQuestions(
      {
        description: `${blueprint.exam} (${blueprint.examCode}) — ${domain.name}`,
        count,
        systemPrompt,
        userPrompt,
        fixedExam: {
          exam: blueprint.exam,
          examCode: blueprint.examCode,
          focusTopics: [domain.name],
        },
      },
      {
        onQuestionPreview: (localIndex, preview) =>
          callbacks.onQuestionPreview?.(globalIndex + localIndex, preview),
        onQuestion: (localIndex, question) => {
          callbacks.onQuestion?.(
            globalIndex + localIndex,
            tagForDomain(question, domain),
          )
        },
      },
    )

    for (const question of batch.questions) {
      mcqQuestions.push(tagForDomain(question, domain))
    }
    globalIndex += batch.questions.length
  }

  const dragQuestions: GeneratedQuestion[] = []
  const dragTotal = dragAlloc.reduce((sum, row) => sum + row.count, 0)
  if (dragTotal > 0) {
    const dragByDomain = allocateDragByDomain(
      dragTotal,
      domains.map((d) => ({ domainId: d.id, weight: d.weightPercent })),
    )

    for (const { type, count } of dragAlloc) {
      if (count <= 0 || type === "mcq") continue
      const dragType = type
      let remaining = count
      for (const domain of domains) {
        const domainShare = dragByDomain.get(domain.id) ?? 0
        const typeShare =
          dragTotal > 0
            ? Math.max(0, Math.round((count * domainShare) / dragTotal))
            : 0
        const batchCount = Math.min(remaining, typeShare || (remaining > 0 ? 1 : 0))
        if (batchCount <= 0) continue

        const userPrompt = [
          examDragBatchPrompt(blueprint, domain, batchCount, dragType),
          "",
          domainGroundingText(domain),
          ...syllabusGroundingBlock(groundingText),
        ].join("\n")

        const batch = await streamGenerateDragQuestions(
          {
            description: `${blueprint.exam} drag — ${domain.name}`,
            count: batchCount,
            dragType: dragType,
            systemPrompt: dragSystemPrompt,
            userPrompt,
          },
          {
            onQuestionPreview: (localIndex, preview) =>
              callbacks.onQuestionPreview?.(
                mcqQuestions.length + dragQuestions.length + localIndex,
                preview,
              ),
            onQuestion: (localIndex, question) => {
              callbacks.onQuestion?.(
                mcqQuestions.length + dragQuestions.length + localIndex,
                tagForDomain(question, domain),
              )
            },
          },
        )

        for (const question of batch) {
          dragQuestions.push(tagForDomain(question, domain))
          remaining -= 1
          if (remaining <= 0) break
        }
        if (remaining <= 0) break
      }
    }
  }

  const merged = interleaveExamQuestions(mcqQuestions, dragQuestions, total)

  return {
    exam: blueprint.exam,
    examCode: blueprint.examCode,
    focusTopics: domains.map((d) => d.name),
    questions: merged,
  }
}

function interleaveExamQuestions(
  mcq: GeneratedQuestion[],
  drag: GeneratedQuestion[],
  total: number,
): GeneratedQuestion[] {
  if (drag.length === 0) return mcq.slice(0, total)

  const result: GeneratedQuestion[] = []
  const dragSlots = evenlySpacedIndices(drag.length, total)
  let mcqIdx = 0
  let dragIdx = 0

  for (let i = 0; i < total; i++) {
    if (dragSlots.has(i) && dragIdx < drag.length) {
      result.push(drag[dragIdx++])
    } else if (mcqIdx < mcq.length) {
      result.push(mcq[mcqIdx++])
    } else if (dragIdx < drag.length) {
      result.push(drag[dragIdx++])
    }
  }

  return result
}

function evenlySpacedIndices(count: number, total: number): Set<number> {
  const slots = new Set<number>()
  if (count <= 0 || total <= 0) return slots
  for (let i = 0; i < count; i++) {
    const index = Math.min(
      total - 1,
      Math.round(((i + 1) * total) / (count + 1)) - 1,
    )
    slots.add(Math.max(0, index))
  }
  return slots
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
  let shellMeta = {
    exam: params.exam ?? params.blueprint?.exam ?? "Certification Exam",
    examCode: params.examCode ?? params.blueprint?.examCode ?? "CUSTOM",
    focusTopics:
      params.focusTopics ??
      (params.focusDomainIds?.length
        ? params.blueprint?.domains
            .filter((d) => params.focusDomainIds!.includes(d.id))
            .map((d) => d.name)
        : params.blueprint?.domains.map((d) => d.name)) ??
      ["Mixed topics"],
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

    let saved: Question
    if ((existing ?? 0) === 0) {
      saved = await appendQuestion(admin, sessionId, question, index)
    } else {
      const session = await loadSession(admin, sessionId, userId)
      const existingQuestion = session?.questions[index]
      if (!existingQuestion) return
      saved = existingQuestion
    }

    safeSend(send, "question", {
      sessionId,
      index,
      question: saved,
      total: params.count,
    })

    if (!readySent) {
      const session = await loadSession(admin, sessionId, userId)
      if (session && session.questions.length > 0) {
        readySent = true
        safeSend(send, "ready", { sessionId, session })
      }
    }
  }

  try {
    const statusMessage =
      params.blueprint != null
        ? `Generating ${params.blueprint.examCode} mock exam…`
        : "Generating exam-style questions…"
    safeSend(send, "status", { message: statusMessage })

    const generated = await generateAllQuestions(params, params.count, {
      onMetadata: (meta) => {
        if (meta.exam) shellMeta.exam = meta.exam
        if (meta.examCode) shellMeta.examCode = meta.examCode
        if (meta.focusTopics?.length) shellMeta.focusTopics = meta.focusTopics
        safeSend(send, "metadata", meta)
      },
      onQuestionPreview: (index, preview) =>
        safeSend(send, "question_preview", {
          index,
          ...preview,
          total: params.count,
        }),
      onQuestion: (index, question) => {
        saveQueue.push(saveQuestion(index, question))
      },
    })

    await Promise.all(saveQueue)

    shellMeta = {
      exam: generated.exam,
      examCode: generated.examCode,
      focusTopics: generated.focusTopics,
    }

    await ensureShell()
    if (!sessionId) throw new Error("Failed to create session")

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
