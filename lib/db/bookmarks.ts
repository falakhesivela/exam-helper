import type { SupabaseClient } from "@supabase/supabase-js"
import type { Question } from "@/types"
import { toQuestion, type DbQuestion } from "./mappers"

export interface BookmarkItem {
  questionId: string
  exam: string
  examCode: string
  note?: string
  createdAt: string
  question: Question
}

/** Just the bookmarked question ids — used to light up the save toggle. */
export async function loadBookmarkIds(
  admin: SupabaseClient,
  userId: string,
): Promise<string[]> {
  const { data } = await admin
    .from("question_bookmarks")
    .select("question_id")
    .eq("user_id", userId)
  return (data ?? []).map((r) => r.question_id)
}

/** Full bookmarked questions (with answers + explanation) for the saved list. */
export async function loadBookmarks(
  admin: SupabaseClient,
  userId: string,
): Promise<BookmarkItem[]> {
  const { data: rows } = await admin
    .from("question_bookmarks")
    .select("question_id, note, created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })

  if (!rows?.length) return []

  const ids = rows.map((r) => r.question_id)
  const { data: questions } = await admin
    .from("questions")
    .select("*")
    .in("id", ids)

  const questionMap = new Map(
    (questions ?? []).map((q) => [q.id, q as DbQuestion]),
  )

  const sessionIds = [
    ...new Set((questions ?? []).map((q) => (q as DbQuestion).session_id)),
  ]
  const { data: sessions } = await admin
    .from("sessions")
    .select("id, exam, exam_code")
    .in("id", sessionIds)
  const sessionMap = new Map(
    (sessions ?? []).map((s) => [s.id, s as { exam: string; exam_code: string }]),
  )

  const items: BookmarkItem[] = []
  for (const row of rows) {
    const dbq = questionMap.get(row.question_id)
    if (!dbq) continue
    const sess = sessionMap.get(dbq.session_id)
    items.push({
      questionId: row.question_id,
      exam: sess?.exam ?? "",
      examCode: sess?.exam_code ?? "",
      note: row.note ?? undefined,
      createdAt: row.created_at,
      question: toQuestion(dbq),
    })
  }
  return items
}
