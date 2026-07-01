// Server-side Paddle Billing Management API client. Used to read live
// subscription state (next renewal, scheduled cancellation, payment-method
// portal link) and to cancel a subscription from the billing screen.
//
// Requires PADDLE_API_KEY. The base URL follows NEXT_PUBLIC_PADDLE_ENV so
// sandbox and production hit the right host. Client-side checkout lives in
// lib/paddle.ts; this module is server-only (it holds the secret API key) and
// must only be imported from node-runtime route handlers.

const API_BASE =
  process.env.NEXT_PUBLIC_PADDLE_ENV === "production"
    ? "https://api.paddle.com"
    : "https://sandbox-api.paddle.com"

export function paddleApiConfigured(): boolean {
  return !!process.env.PADDLE_API_KEY
}

/** Subset of the Paddle subscription object we consume. */
export interface PaddleSubscription {
  id: string
  status: string
  next_billed_at: string | null
  canceled_at: string | null
  scheduled_change: {
    action: "cancel" | "pause" | "resume"
    effective_at: string
  } | null
  management_urls: {
    update_payment_method?: string | null
    cancel?: string | null
  } | null
}

async function paddleFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const key = process.env.PADDLE_API_KEY
  if (!key) throw new Error("PADDLE_API_KEY is not configured")

  const res = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
      ...init?.headers,
    },
    // Billing data must never be served stale from a fetch cache.
    cache: "no-store",
  })

  const json = (await res.json()) as { data?: T; error?: { detail?: string } }
  if (!res.ok) {
    throw new Error(
      `Paddle API ${res.status}: ${json.error?.detail ?? "request failed"}`,
    )
  }
  return json.data as T
}

export function getSubscription(id: string): Promise<PaddleSubscription> {
  return paddleFetch<PaddleSubscription>(`/subscriptions/${id}`)
}

/**
 * Schedule cancellation at the end of the current billing period, so the user
 * keeps Pro access through the time they've already paid for. Paddle then
 * emits a subscription.updated/canceled webhook that flips profiles.plan.
 */
export function cancelSubscription(id: string): Promise<PaddleSubscription> {
  return paddleFetch<PaddleSubscription>(`/subscriptions/${id}/cancel`, {
    method: "POST",
    body: JSON.stringify({ effective_from: "next_billing_period" }),
  })
}
