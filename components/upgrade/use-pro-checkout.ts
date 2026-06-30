"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { createClient } from "@/lib/supabase/client"
import { loadPaddle, paddleConfigured } from "@/lib/paddle"
import { getProPriceId } from "@/lib/config/pricing"

/**
 * Shared "subscribe to Pro" action. Anonymous visitors are sent to sign-up
 * first (Paddle needs an email and the buyer must be able to recover their
 * purchase); otherwise it opens Paddle checkout. Inert with a friendly message
 * until Paddle is configured. Used by both the in-app paywall and the landing.
 */
export function useProCheckout() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

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
