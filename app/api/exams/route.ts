import { z } from "zod"
import { runGenerateSessionStream } from "@/lib/ai/generate-session-stream"
import { createEventStream } from "@/lib/ai/sse"
import { requireUser } from "@/lib/api/auth"
import { apiError, getTimezone, handleRouteError, rateLimit } from "@/lib/api/route-utils"
import { createAdminClient } from "@/lib/supabase/admin"
import { enforceFreemium } from "@/lib/db/usage"

export const runtime = "nodejs"

const bodySchema = z.object({
  questionCount: z.number().int().min(1).max(100),
  durationSec: z.number().int().min(60).max(14400),
  exam: z.string().optional(),
  examCode: z.string().optional(),
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

    const description =
      body.exam && body.examCode
        ? `Timed mock exam for ${body.exam} (${body.examCode}). Generate ${body.questionCount} balanced questions across all major domains.`
        : `Timed certification mock exam with ${body.questionCount} questions covering mixed topics.`

    const { data: profile } = await admin
      .from("profiles")
      .select("timezone")
      .eq("id", user.id)
      .single()

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
          mode: "exam",
          exam: body.exam,
          examCode: body.examCode,
          focusTopics: ["Full exam simulation"],
          durationSec: body.durationSec,
          passMark: 72,
        },
        send,
        { timezone, remainingFreeQuestions },
      )
    })
  } catch (err) {
    return handleRouteError(err)
  }
}
