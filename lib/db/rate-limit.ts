import { createAdminClient } from "@/lib/supabase/admin"

/**
 * Shared fixed-window rate limit, backed by Postgres so it holds across
 * serverless instances (unlike a per-process in-memory map). Returns true when
 * the hit is allowed, false when the limit for the window is exceeded.
 *
 * Fails open: if the rate-limit store is unreachable we allow the request
 * rather than hard-blocking a user on an infrastructure hiccup.
 */
export async function checkRateLimit(
  key: string,
  limit = 10,
  windowMs = 60_000,
): Promise<boolean> {
  try {
    const admin = createAdminClient()
    const { data, error } = await admin.rpc("check_rate_limit", {
      p_key: key,
      p_limit: limit,
      p_window_ms: windowMs,
    })
    if (error) {
      console.warn("[rate-limit] check failed, allowing:", error.message)
      return true
    }
    return data === true
  } catch (err) {
    console.warn("[rate-limit] check threw, allowing:", err)
    return true
  }
}
