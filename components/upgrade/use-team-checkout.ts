"use client"

import { useRef, useState } from "react"
import { toast } from "sonner"
import { createClient } from "@/lib/supabase/client"
import { api } from "@/lib/api/client"
import { loadPaddle, onPaddleEvent, paddleConfigured, type PaddleEvent } from "@/lib/paddle"
import { getTeamPriceId } from "@/lib/config/pricing"

/**
 * Seat-based Team plan checkout, opened from the team settings panel by the
 * org owner. Mirrors useCheckout, with two differences: the Paddle item
 * carries a seat quantity, and custom_data tags the org (kind: "team") so the
 * webhook/confirm entitle the organization instead of the buyer's profile.
 * Success = /api/team reports plan "team" (polled; webhook or confirm wins).
 */
export function useTeamCheckout(orgId: string, onActivated?: () => void) {
  const [loading, setLoading] = useState(false)
  const confirmingRef = useRef(false)

  async function confirmPurchase(event: PaddleEvent) {
    if (confirmingRef.current) return
    confirmingRef.current = true

    toast.success("Payment received — activating your team plan…")

    const transactionId = event.data?.transaction_id
    if (transactionId) {
      try {
        await api.confirmCheckout(transactionId)
      } catch (err) {
        // Webhook may still land; keep polling. Surface a soft warning only.
        console.warn("[team checkout] confirm failed", err)
      }
    }

    for (let i = 0; i < 12; i++) {
      try {
        const team = await api.team()
        if (team?.plan === "team") {
          toast.success("Your team plan is active 🎉")
          onActivated?.()
          return
        }
      } catch {
        // transient — keep polling
      }
      await new Promise((r) => setTimeout(r, 1500))
    }
    toast.message("Your team plan is activating — refresh in a moment.")
    onActivated?.()
  }

  async function startCheckout(seats: number) {
    setLoading(true)
    try {
      const supabase = createClient()
      const { data } = await supabase.auth.getUser()
      const user = data.user
      if (!user || !user.email) {
        toast.error("Sign in to purchase a team plan.")
        return
      }

      const priceId = getTeamPriceId()
      if (!paddleConfigured() || !priceId) {
        toast.info("Team billing is launching soon — hang tight!")
        return
      }

      const paddle = await loadPaddle()
      if (!paddle) {
        toast.error("Couldn't load checkout. Please try again.")
        return
      }

      confirmingRef.current = false
      onPaddleEvent((event) => {
        if (event.name === "checkout.completed") void confirmPurchase(event)
      })

      paddle.Checkout.open({
        items: [{ priceId, quantity: seats }],
        customer: { email: user.email },
        customData: { user_id: user.id, org_id: orgId, app: "prepa", kind: "team" },
      })
    } catch {
      toast.error("Something went wrong starting checkout.")
    } finally {
      setLoading(false)
    }
  }

  return { startCheckout, loading }
}
