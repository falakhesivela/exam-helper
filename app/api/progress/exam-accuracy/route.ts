import { NextResponse } from "next/server"
import { requireUser } from "@/lib/api/auth"
import { handleRouteError } from "@/lib/api/route-utils"
import { createAdminClient } from "@/lib/supabase/admin"
import { computeRecentExamAccuracy } from "@/lib/progress/exam-accuracy"

export const runtime = "nodejs"

/**
 * Recent full mock-exam accuracy, grouped by exam code. The dashboard blends
 * this realistic signal into the (client-computed) readiness score.
 * Shape: { [examCode]: { accuracy: 0-100, questions } }.
 */
export async function GET() {
  try {
    const user = await requireUser()
    const admin = createAdminClient()
    const result = await computeRecentExamAccuracy(admin, user.id)
    return NextResponse.json(result)
  } catch (err) {
    return handleRouteError(err)
  }
}
