import { z } from "zod"
import { runGenerateSessionStream } from "@/lib/ai/generate-session-stream"
import { createEventStream } from "@/lib/ai/sse"
import { requireUser } from "@/lib/api/auth"
import { apiError, getTimezone, handleRouteError, rateLimit } from "@/lib/api/route-utils"
import { createAdminClient } from "@/lib/supabase/admin"
import { enforceFreemium } from "@/lib/db/usage"

export const runtime = "nodejs"

const bodySchema = z.object({
  description: z.string().min(15),
  clarifications: z.record(z.string(), z.string()).optional(),
  fileId: z.string().uuid().optional(),
  count: z.number().int().min(1).max(20).optional(),
})

export async function POST(request: Request) {
  try {
    const user = await requireUser()
    if (!rateLimit(`generate:${user.id}`, 10)) {
      return apiError("Rate limit exceeded", 429)
    }

    const body = bodySchema.parse(await request.json())
    const count = body.count ?? 5
    const admin = createAdminClient()

    const check = await enforceFreemium(admin, user.id, count)

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

    const { data: profile } = await admin
      .from("profiles")
      .select("timezone")
      .eq("id", user.id)
      .single()

    const timezone = profile?.timezone ?? getTimezone(request)
    const remainingFreeQuestions =
      check.remaining === Infinity
        ? Infinity
        : Math.max(0, check.remaining - count)

    return createEventStream(async (send) => {
      await runGenerateSessionStream(
        admin,
        user.id,
        {
          description: body.description,
          clarifications: body.clarifications,
          count,
          groundingText,
          mode: "practice",
        },
        send,
        { timezone, remainingFreeQuestions },
      )
    })
  } catch (err) {
    return handleRouteError(err)
  }
}
