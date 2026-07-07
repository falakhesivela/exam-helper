"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { createClient } from "@/lib/supabase/client"
import { loadPaddle, onPaddleEvent, paddleConfigured } from "@/lib/paddle"
import { priceIdForTier } from "@/lib/config/pricing"
import { isPaidTier, TIER_NAMES, type Tier } from "@/lib/config/tiers"
import { useSessionStore } from "@/lib/store/use-session-store"

export type CheckoutTier = "pro" | "exam_pass"

/**
 * Checkout action for a paid tier, used by the paywall and landing.
 *   1. Signed-out visitors are sent to sign-up first (then back to /upgrade).
 *   2. Signed-in users open Paddle checkout (custom_data tags the user + app so
 *      the webhook can attribute the purchase). The tier is decided server-side
 *      from the price id — custom_data is not trusted for entitlement.
 *   3. On checkout.completed, poll the profile until a paid plan lands.
 * Inert with a friendly message until Paddle is configured.
 */
export function useCheckout(tier: CheckoutTier) {
  const router = useRouter()
  const refreshProfile = useSessionStore((s) => s.refreshProfile)
  const [loading, setLoading] = useState(false)

  async function confirmPurchase() {
    toast.success("Payment received — activating your plan…")
    for (let i = 0; i < 8; i++) {
      await refreshProfile()
      const plan = useSessionStore.getState().profile.plan as Tier
      // Success = the purchased tier landed, or any paid tier did (a webhook
      // race could have applied an upgrade first).
      if (plan === tier || isPaidTier(plan)) {
        toast.success(`You're on ${TIER_NAMES[plan]} 🎉`)
        router.push("/dashboard")
        return
      }
      await new Promise((r) => setTimeout(r, 2000))
    }
    toast.message("Your access is activating — refresh in a moment.")
    router.push("/dashboard")
  }

  async function startCheckout() {
    setLoading(true)
    try {
      const supabase = createClient()
      const { data } = await supabase.auth.getUser()
      const user = data.user

      // Sign-up is required to use the app and to purchase.
      if (!user || !user.email) {
        router.push("/signup?next=/upgrade")
        return
      }

      const priceId = priceIdForTier(tier)
      if (!paddleConfigured() || !priceId) {
        toast.info("Checkout is launching soon — hang tight!")
        return
      }

      const paddle = await loadPaddle()
      if (!paddle) {
        toast.error("Couldn't load checkout. Please try again.")
        return
      }

      onPaddleEvent((event) => {
        if (event.name === "checkout.completed") void confirmPurchase()
      })

      paddle.Checkout.open({
        items: [{ priceId, quantity: 1 }],
        customer: { email: user.email },
        customData: { user_id: user.id, app: "prepa", tier },
      })
    } catch {
      toast.error("Something went wrong starting checkout.")
    } finally {
      setLoading(false)
    }
  }

  return { startCheckout, loading }
}
