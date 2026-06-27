import { z } from "zod"
import { runGenerateSessionStream } from "@/lib/ai/generate-session-stream"
import { loadAdaptiveDifficulty } from "@/lib/progress/adaptive"
import { createEventStream } from "@/lib/ai/sse"
import { requireUser } from "@/lib/api/auth"
import { apiError, getTimezone, handleRouteError, rateLimit } from "@/lib/api/route-utils"
import { getExamBlueprint, resolveExamBlueprint } from "@/lib/exams"
import { createAdminClient } from "@/lib/supabase/admin"
import { enforceFreemium } from "@/lib/db/usage"

export const runtime = "nodejs"

const bodySchema = z.object({
  questionCount: z.number().int().min(1).max(100),
  durationSec: z.number().int().min(60).max(14400),
  exam: z.string().optional(),
  examCode: z.string().optional(),
  /** Free-text exam context for custom exams (syllabus notes, weak areas). */
  description: z.string().optional(),
  /** Domain/topic names for custom exam weighting (comma or newline separated). */
  focusTopicsText: z.string().optional(),
  focusTopics: z.array(z.string()).optional(),
  /** Syllabus PDF upload id for custom exam grounding. */
  fileId: z.string().uuid().optional(),
  /** Blueprint domain ids to focus on (weak-area mock exams). */
  focusDomainIds: z.array(z.string()).optional(),
})

export async function POST(request: Request) {
  try {
    const user = await requireUser()
    if (!rateLimit(`exam:${user.id}`, 5)) {
      return apiError("Rate limit exceeded", 429)
    }

    const body = bodySchema.parse(await request.json())
    const admin = createAdminClient()
    const check = await enforceFreemium(admin, user.id, body.questionCount)

    const durationMin = Math.round(body.durationSec / 60)

    let blueprint = body.examCode ? getExamBlueprint(body.examCode) : null

    if (!blueprint) {
      blueprint = resolveExamBlueprint(body.exam, body.examCode, {
        focusTopics: body.focusTopics,
        focusTopicsText: body.focusTopicsText,
        questionCount: body.questionCount,
        durationMin,
        description: body.description,
      })
    }

    if (body.focusDomainIds?.length && blueprint) {
      const domainFilter = blueprint.domains.filter((d) =>
        body.focusDomainIds!.includes(d.id),
      )
      if (domainFilter.length > 0) {
        blueprint = { ...blueprint, domains: domainFilter }
      }
    }

    const exam = blueprint?.exam ?? body.exam
    const examCode = blueprint?.examCode ?? body.examCode
    const passMark = blueprint?.passMark ?? 72

    let groundingText: string | undefined
    if (body.fileId) {
      const { data: upload } = await admin
        .from("uploads")
        .select("extracted_text")
        .eq("id", body.fileId)
        .eq("user_id", user.id)
        .single()
      groundingText = upload?.extracted_text
    }

    const description =
      blueprint != null && body.focusDomainIds?.length
        ? `Focused weak-area mock exam for ${blueprint.exam} (${blueprint.examCode}). Target domains: ${body.focusDomainIds.join(", ")}.`
        : blueprint != null
          ? `Timed mock exam for ${blueprint.exam} (${blueprint.examCode}). Generate ${body.questionCount} questions weighted across exam domains.`
          : body.description?.trim()
            ? `Timed mock exam for ${exam ?? "certification prep"} (${examCode ?? "CUSTOM"}). ${body.description.trim()}`
            : exam && examCode
              ? `Timed mock exam for ${exam} (${examCode}). Generate ${body.questionCount} balanced questions across all major domains.`
              : `Timed certification mock exam with ${body.questionCount} questions covering mixed topics.`

    const focusTopics =
      body.focusDomainIds?.length && blueprint
        ? blueprint.domains
            .filter((d) => body.focusDomainIds!.includes(d.id))
            .map((d) => d.name)
        : blueprint?.domains.map((d) => d.name) ?? ["Full exam simulation"]

    const { data: profile } = await admin
      .from("profiles")
      .select("timezone")
      .eq("id", user.id)
      .single()

    const adaptiveDifficulty = await loadAdaptiveDifficulty(
      admin,
      user.id,
      examCode ?? undefined,
    )

    const timezone = profile?.timezone ?? getTimezone(request)
    const remainingFreeQuestions =
      check.remaining === Infinity
        ? Infinity
        : Math.max(0, check.remaining - body.questionCount)

    return createEventStream(async (send) => {
      await runGenerateSessionStream(
        admin,
        user.id,
        {
          description,
          count: body.questionCount,
          groundingText,
          mode: "exam",
          exam,
          examCode,
          focusTopics,
          durationSec: body.durationSec,
          passMark,
          blueprint: blueprint ?? undefined,
          focusDomainIds: body.focusDomainIds,
          adaptiveDifficulty: adaptiveDifficulty ?? undefined,
        },
        send,
        { timezone, remainingFreeQuestions },
      )
    })
  } catch (err) {
    return handleRouteError(err)
  }
}
