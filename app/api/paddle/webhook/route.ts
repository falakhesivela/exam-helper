import { createHmac, timingSafeEqual } from "node:crypto"
import { createAdminClient } from "@/lib/supabase/admin"

export const runtime = "nodejs"

// Paddle Billing webhook. Keeps profiles.plan in sync with the Pro
// subscription. Point a Paddle notification destination at /api/paddle/webhook
// and set PADDLE_WEBHOOK_SECRET to its signing secret.
//
// This Paddle account is shared with other products (e.g. Replai), so every
// handler must ignore events that aren't ours: checkout tags custom_data with
// { app: "prepa", user_id }, and we drop anything whose app tag isn't "prepa".

const ENTITLED = new Set(["active", "trialing"])

/** Verify Paddle's `ts=...;h1=...` signature against the raw body. */
function verifySignature(raw: string, header: string | null): boolean {
  const secret = process.env.PADDLE_WEBHOOK_SECRET
  if (!secret || !header) return false

  const parts = Object.fromEntries(
    header.split(";").map((kv) => kv.split("=") as [string, string]),
  )
  const ts = parts.ts
  const h1 = parts.h1
  if (!ts || !h1) return false

  const expected = createHmac("sha256", secret)
    .update(`${ts}:${raw}`)
    .digest("hex")

  const a = Buffer.from(h1)
  const b = Buffer.from(expected)
  return a.length === b.length && timingSafeEqual(a, b)
}

export async function POST(request: Request) {
  const raw = await request.text()
  if (!verifySignature(raw, request.headers.get("Paddle-Signature"))) {
    return new Response("invalid signature", { status: 403 })
  }

  let event: { event_type?: string; data?: Record<string, unknown> }
  try {
    event = JSON.parse(raw)
  } catch {
    return new Response("bad json", { status: 400 })
  }

  const eventType = event.event_type ?? ""
  if (!eventType.startsWith("subscription.")) {
    return new Response("ok", { status: 200 })
  }

  const data = (event.data ?? {}) as Record<string, unknown>
  const customData = (data.custom_data ?? {}) as Record<string, unknown>

  // Ignore events from other products on this shared Paddle account.
  if (customData.app !== "prepa") {
    return new Response("ok", { status: 200 })
  }

  const userId = typeof customData.user_id === "string" ? customData.user_id : null
  if (!userId) {
    return new Response("ok", { status: 200 })
  }

  const status = typeof data.status === "string" ? data.status : ""
  const plan = ENTITLED.has(status) ? "pro" : "free"

  const admin = createAdminClient()
  const { error } = await admin
    .from("profiles")
    .update({
      plan,
      subscription_status: status,
      paddle_subscription_id: typeof data.id === "string" ? data.id : null,
      paddle_customer_id:
        typeof data.customer_id === "string" ? data.customer_id : null,
    })
    .eq("id", userId)

  if (error) {
    console.error("[paddle webhook] update failed", error)
    // 200 so Paddle doesn't retry forever on a persistent DB issue; logged above.
    return new Response("ok", { status: 200 })
  }

  return new Response("ok", { status: 200 })
}
