"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { createClient } from "@/lib/supabase/client"
import { loadPaddle, onPaddleEvent, paddleConfigured } from "@/lib/paddle"
import { getProPriceId } from "@/lib/config/pricing"
import { useSessionStore } from "@/lib/store/use-session-store"

/**
 * Shared "subscribe to Pro" action used by both the in-app paywall and the
 * landing. Flow:
 *   1. Anonymous visitors are sent to sign-up first — Paddle needs an email and
 *      the buyer must be able to recover their purchase.
 *   2. Otherwise open Paddle checkout (custom_data tags the user + app so the
 *      webhook can flip profiles.plan to "pro").
 *   3. On checkout.completed, poll the profile until the webhook has applied
 *      Pro, then send the user to their dashboard.
 * Inert with a friendly message until Paddle is configured.
 */
export function useProCheckout() {
  const router = useRouter()
  const refreshProfile = useSessionStore((s) => s.refreshProfile)
  const [loading, setLoading] = useState(false)

  async function confirmPro() {
    toast.success("Payment received — activating Pro…")
    for (let i = 0; i < 8; i++) {
      await refreshProfile()
      if (useSessionStore.getState().profile.plan === "pro") {
        toast.success("You're on Pro 🎉")
        router.push("/dashboard")
        return
      }
      await new Promise((r) => setTimeout(r, 2000))
    }
    // Webhook is still catching up; it will apply Pro shortly.
    toast.message("Your Pro access is activating — refresh in a moment.")
    router.push("/dashboard")
  }

  async function startCheckout() {
    setLoading(true)
    try {
      const supabase = createClient()
      const { data } = await supabase.auth.getUser()
      const user = data.user

      if (!user || user.is_anonymous || !user.email) {
        toast.info("Create a free account first, then subscribe.")
        router.push("/signup?next=/upgrade")
        return
      }

      const priceId = getProPriceId()
      if (!paddleConfigured() || !priceId) {
        toast.info("Subscriptions are launching soon — hang tight!")
        return
      }

      const paddle = await loadPaddle()
      if (!paddle) {
        toast.error("Couldn't load checkout. Please try again.")
        return
      }

      onPaddleEvent((name) => {
        if (name === "checkout.completed") void confirmPro()
      })

      paddle.Checkout.open({
        items: [{ priceId, quantity: 1 }],
        customer: { email: user.email },
        customData: { user_id: user.id, app: "prepa" },
      })
    } catch {
      toast.error("Something went wrong starting checkout.")
    } finally {
      setLoading(false)
    }
  }

  return { startCheckout, loading }
}
