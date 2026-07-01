"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { createClient } from "@/lib/supabase/client"
import { loadPaddle, onPaddleEvent, paddleConfigured } from "@/lib/paddle"
import { getProPriceId } from "@/lib/config/pricing"
import { useSessionStore } from "@/lib/store/use-session-store"

/**
 * Shared "subscribe to Pro" action used by the in-app paywall and the landing.
 *   1. Signed-out visitors are sent to sign-up first (then back to /upgrade).
 *   2. Signed-in users open Paddle checkout (custom_data tags the user + app so
 *      the webhook flips profiles.plan to "pro").
 *   3. On checkout.completed, poll the profile until Pro lands, then go to the
 *      dashboard.
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
    toast.message("Your Pro access is activating — refresh in a moment.")
    router.push("/dashboard")
  }

  async function startCheckout() {
    setLoading(true)
    try {
      const supabase = createClient()
      const { data } = await supabase.auth.getUser()
      const user = data.user

      // Sign-up is required to use the app and to subscribe.
      if (!user || !user.email) {
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

      onPaddleEvent((event) => {
        if (event.name === "checkout.completed") void confirmPro()
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
