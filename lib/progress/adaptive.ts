import type { createAdminClient } from "@/lib/supabase/admin"
import { parseMasteryTopicKey } from "@/lib/exams/mastery-keys"

type AdminClient = ReturnType<typeof createAdminClient>

export interface AdaptiveDifficulty {
  /** Overall mastery (0-100) across the user's tracked topics. */
  overall: number
  /** Per-blueprint-domain mastery (0-100), keyed by domain id. */
  byDomain: Record<string, number>
}

/**
 * Load the user's mastery to drive adaptive difficulty. Returns null when there
 * isn't enough history yet (so generation falls back to a default mix).
 */
export async function loadAdaptiveDifficulty(
  admin: AdminClient,
  userId: string,
  examCode?: string,
): Promise<AdaptiveDifficulty | null> {
  const { data: rows } = await admin
    .from("topic_mastery")
    .select("topic, mastery, questions_answered")
    .eq("user_id", userId)

  if (!rows || rows.length === 0) return null

  let sum = 0
  let count = 0
  const byDomain: Record<string, number> = {}
  for (const row of rows) {
    // Ignore barely-attempted topics so a single answer doesn't skew difficulty.
    if ((row.questions_answered ?? 0) < 3) continue
    const mastery = Number(row.mastery)
    sum += mastery
    count += 1
    const parsed = parseMasteryTopicKey(row.topic)
    if (
      parsed &&
      (!examCode || parsed.examCode.toUpperCase() === examCode.toUpperCase())
    ) {
      byDomain[parsed.domainId] = mastery
    }
  }

  if (count === 0) return null
  return { overall: Math.round(sum / count), byDomain }
}
