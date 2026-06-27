import type { ExamProvider } from "@/lib/exams/types"
import { isOfficialUrl, type Reference } from "@/lib/ai/citations"

/** Per-request timeout for a link check. */
const HEAD_TIMEOUT_MS = 2500
/** Statuses that prove the page is gone → drop the reference. */
const DEAD_STATUSES = new Set([404, 410])

/**
 * Confirm a URL isn't a dead link. We only drop on a definitive "gone" status;
 * timeouts, 403s, and network errors are kept, since doc sites often block bots
 * or rate-limit HEAD requests and that's not proof the page is missing.
 */
async function isLikelyLive(url: string): Promise<boolean> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), HEAD_TIMEOUT_MS)
  try {
    const res = await fetch(url, {
      method: "HEAD",
      redirect: "follow",
      signal: controller.signal,
    })
    return !DEAD_STATUSES.has(res.status)
  } catch {
    return true // network error / timeout — not proof of death
  } finally {
    clearTimeout(timer)
  }
}

/**
 * Clean AI-produced references: keep only official-domain URLs that aren't
 * confirmed-dead. Runs the link checks in parallel. Returns [] when nothing
 * passes (better no citation than a hallucinated one).
 */
export async function verifyReferences(
  references: Reference[] | undefined,
  provider: ExamProvider,
): Promise<Reference[]> {
  if (!references || references.length === 0) return []

  const onOfficialDomain = references.filter(
    (r) => r?.url && r?.label && isOfficialUrl(r.url, provider),
  )

  const checks = await Promise.all(
    onOfficialDomain.map(async (ref) => ({
      ref,
      live: await isLikelyLive(ref.url),
    })),
  )

  // De-dupe by URL while preserving order.
  const seen = new Set<string>()
  const cleaned: Reference[] = []
  for (const { ref, live } of checks) {
    if (!live || seen.has(ref.url)) continue
    seen.add(ref.url)
    cleaned.push({ label: ref.label, url: ref.url })
  }
  return cleaned
}
