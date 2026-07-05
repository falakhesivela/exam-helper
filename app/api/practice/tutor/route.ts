import { NextResponse } from "next/server"
import { z } from "zod"
import { requireUser } from "@/lib/api/auth"
import { apiError, handleRouteError } from "@/lib/api/route-utils"
import { checkRateLimit } from "@/lib/db/rate-limit"
import { tutorReply, tutorReplyStream } from "@/lib/ai/tutor"
import { createEventStream } from "@/lib/ai/sse"
import { dragTutorFields } from "@/lib/ai/drag-answer-text"
import { createAdminClient } from "@/lib/supabase/admin"
import { toQuestion, type DbQuestion } from "@/lib/db/mappers"

export const runtime = "nodejs"

const dragAnswerSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("drag_match"),
    mapping: z.record(z.string(), z.string()),
  }),
  z.object({
    type: z.literal("drag_order"),
    order: z.array(z.string()),
  }),
  z.object({
    type: z.literal("drag_categorize"),
    buckets: z.record(z.string(), z.array(z.string())),
  }),
  z.object({
    type: z.literal("select_grid"),
    selections: z.record(z.string(), z.string()),
  }),
])

const bodySchema = z.object({
  questionId: z.string().uuid(),
  selectedOptionIds: z.array(z.string()).default([]),
  dragAnswer: dragAnswerSchema.optional(),
  messages: z
    .array(
      z.object({
        role: z.enum(["user", "assistant"]),
        content: z.string().min(1).max(1000),
      }),
    )
    .max(20)
    .default([]),
})

export async function POST(request: Request) {
  try {
    const user = await requireUser()
    if (!(await checkRateLimit(`tutor:${user.id}`, 20, 60_000))) {
      return apiError("Slow down a moment and try again.", 429, {
        code: "RATE_LIMITED",
      })
    }
    const body = bodySchema.parse(await request.json())
    const admin = createAdminClient()

    const { data: question } = await admin
      .from("questions")
      .select("*")
      .eq("id", body.questionId)
      .single()

    if (!question) {
      return NextResponse.json({ error: "Question not found" }, { status: 404 })
    }

    const q = question as DbQuestion

    const { data: session } = await admin
      .from("sessions")
      .select("user_id")
      .eq("id", q.session_id)
      .eq("user_id", user.id)
      .single()

    if (!session) {
      return NextResponse.json({ error: "Question not found" }, { status: 404 })
    }

    const mapped = toQuestion(q)
    const dragFields = dragTutorFields(mapped, body.dragAnswer)

    const context = {
      prompt: mapped.prompt,
      scenario: mapped.scenario,
      options: mapped.options ?? [],
      correctOptionIds: mapped.correctOptionIds ?? [],
      userSelectedIds: body.selectedOptionIds,
      explanation: mapped.explanation,
      questionType: dragFields?.questionType,
      dragCorrectSummary: dragFields?.correctSummary,
      dragUserSummary: dragFields?.userSummary,
    }

    // Stream tokens over SSE when the client asks for it; plain JSON otherwise.
    if (request.headers.get("accept")?.includes("text/event-stream")) {
      return createEventStream(async (send) => {
        const reply = await tutorReplyStream(context, body.messages, (text) =>
          send("delta", { text }),
        )
        send("done", { reply })
      })
    }

    const reply = await tutorReply(context, body.messages)
    return NextResponse.json({ reply })
  } catch (err) {
    return handleRouteError(err)
  }
}
