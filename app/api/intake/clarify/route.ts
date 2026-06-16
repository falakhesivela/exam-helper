import { z } from "zod"
import { streamClarify } from "@/lib/ai/stream"
import { createEventStream } from "@/lib/ai/sse"
import { requireUser } from "@/lib/api/auth"
import { apiError, handleRouteError, rateLimit } from "@/lib/api/route-utils"

export const runtime = "nodejs"

const bodySchema = z.object({
  description: z.string().min(15),
})

export async function POST(request: Request) {
  try {
    const user = await requireUser()
    if (!rateLimit(`clarify:${user.id}`, 20)) {
      return apiError("Rate limit exceeded", 429)
    }

    const body = bodySchema.parse(await request.json())

    return createEventStream(async (send) => {
      send("status", { message: "Analyzing your exam goals…" })

      const result = await streamClarify(body.description, {
        onQuestion: (index, question) => {
          send("question", { index, question })
        },
        onDelta: (partial) => {
          if (partial.needsClarification !== undefined) {
            send("delta", { needsClarification: partial.needsClarification })
          }
        },
      })

      send("done", result)
    })
  } catch (err) {
    return handleRouteError(err)
  }
}
