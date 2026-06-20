import { NextResponse } from "next/server"
import { z } from "zod"
import { requireUser } from "@/lib/api/auth"
import { handleRouteError } from "@/lib/api/route-utils"
import { explainWrongAnswer } from "@/lib/ai/tutor"
import { createAdminClient } from "@/lib/supabase/admin"
import { toQuestion, type DbQuestion } from "@/lib/db/mappers"

export const runtime = "nodejs"

const bodySchema = z.object({
  questionId: z.string().uuid(),
  selectedOptionIds: z.array(z.string()).default([]),
})

export async function POST(request: Request) {
  try {
    const user = await requireUser()
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

    const reply = await explainWrongAnswer({
      prompt: mapped.prompt,
      scenario: mapped.scenario,
      options: mapped.options ?? [],
      correctOptionIds: mapped.correctOptionIds ?? [],
      userSelectedIds: body.selectedOptionIds,
      explanation: mapped.explanation,
    })

    return NextResponse.json({ reply })
  } catch (err) {
    return handleRouteError(err)
  }
}
