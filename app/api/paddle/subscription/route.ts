import { NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { requireUser } from "@/lib/api/auth"
import { handleRouteError, apiError } from "@/lib/api/route-utils"
import {
  cancelSubscription,
  getSubscription,
  paddleApiConfigured,
} from "@/lib/paddle-api"
import type { SubscriptionDetails } from "@/types"

export const runtime = "nodejs"

/** Look up the caller's Paddle subscription id from their profile. */
async function getSubscriptionId(userId: string): Promise<string | null> {
  const admin = createAdminClient()
  const { data } = await admin
    .from("profiles")
    .select("paddle_subscription_id")
    .eq("id", userId)
    .single()
  return data?.paddle_subscription_id ?? null
}

const NONE: SubscriptionDetails = {
  hasSubscription: false,
  status: null,
  nextBilledAt: null,
  cancelEffectiveAt: null,
  updatePaymentUrl: null,
}

// GET — live subscription detail for the billing screen.
export async function GET() {
  try {
    const user = await requireUser()
    const subId = await getSubscriptionId(user.id)
    if (!subId || !paddleApiConfigured()) {
      return NextResponse.json(NONE satisfies SubscriptionDetails)
    }

    const sub = await getSubscription(subId)
    const cancelEffectiveAt =
      sub.scheduled_change?.action === "cancel"
        ? sub.scheduled_change.effective_at
        : (sub.canceled_at ?? null)

    return NextResponse.json({
      hasSubscription: true,
      status: sub.status,
      nextBilledAt: sub.next_billed_at,
      cancelEffectiveAt,
      updatePaymentUrl: sub.management_urls?.update_payment_method ?? null,
    } satisfies SubscriptionDetails)
  } catch (err) {
    return handleRouteError(err)
  }
}

// POST — cancel the subscription at the end of the current billing period.
export async function POST() {
  try {
    const user = await requireUser()
    if (!paddleApiConfigured()) {
      return apiError("Billing is not configured", 503, {
        code: "BILLING_UNCONFIGURED",
      })
    }

    const subId = await getSubscriptionId(user.id)
    if (!subId) {
      return apiError("No active subscription to cancel", 404, {
        code: "NO_SUBSCRIPTION",
      })
    }

    const sub = await cancelSubscription(subId)
    const cancelEffectiveAt =
      sub.scheduled_change?.action === "cancel"
        ? sub.scheduled_change.effective_at
        : (sub.canceled_at ?? null)

    return NextResponse.json({
      hasSubscription: true,
      status: sub.status,
      nextBilledAt: sub.next_billed_at,
      cancelEffectiveAt,
      updatePaymentUrl: sub.management_urls?.update_payment_method ?? null,
    } satisfies SubscriptionDetails)
  } catch (err) {
    return handleRouteError(err)
  }
}
