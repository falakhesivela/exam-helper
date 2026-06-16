import { NextResponse } from "next/server"
import { requireUser } from "@/lib/api/auth"
import { handleRouteError } from "@/lib/api/route-utils"
import { createAdminClient } from "@/lib/supabase/admin"
import { gradeAnswer } from "@/lib/db/sessions"
import type { DbQuestion } from "@/lib/db/mappers"

export const runtime = "nodejs"

const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]

export async function GET() {
  try {
    const user = await requireUser()
    const admin = createAdminClient()

    const since = new Date()
    since.setDate(since.getDate() - 6)
    since.setHours(0, 0, 0, 0)

    const { data: sessions } = await admin
      .from("sessions")
      .select("id, created_at")
      .eq("user_id", user.id)
      .eq("status", "completed")
      .gte("created_at", since.toISOString())
      .order("created_at")

    const trend: { label: string; mastery: number }[] = []

    for (let i = 6; i >= 0; i--) {
      const d = new Date()
      d.setDate(d.getDate() - i)
      d.setHours(0, 0, 0, 0)
      const next = new Date(d)
      next.setDate(next.getDate() + 1)

      const daySessions = (sessions ?? []).filter((s) => {
        const created = new Date(s.created_at)
        return created >= d && created < next
      })

      let mastery = 0
      if (daySessions.length > 0) {
        let correct = 0
        let total = 0
        for (const sess of daySessions) {
          const { data: questions } = await admin
            .from("questions")
            .select("*")
            .eq("session_id", sess.id)
          const { data: answers } = await admin
            .from("answers")
            .select("*")
            .eq("session_id", sess.id)

          for (const q of (questions ?? []) as DbQuestion[]) {
            const a = answers?.find((ans) => ans.question_id === q.id)
            if (a && a.selected_option_ids.length > 0) {
              total += 1
              if (gradeAnswer(q.correct_option_ids, a.selected_option_ids)) {
                correct += 1
              }
            }
          }
        }
        mastery = total > 0 ? Math.round((correct / total) * 100) : 0
      } else {
        mastery = trend.length > 0 ? trend[trend.length - 1].mastery : 50
      }

      trend.push({ label: DAY_LABELS[d.getDay()], mastery })
    }

    return NextResponse.json(trend)
  } catch (err) {
    return handleRouteError(err)
  }
}
