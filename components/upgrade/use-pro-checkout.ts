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
 * landing. Pay-first flow:
 *   1. Open Paddle checkout immediately — even for anonymous visitors. Paddle
 *      collects the email; custom_data tags the user + app so the webhook can
 *      flip profiles.plan to "pro" on the current (possibly anonymous) session.
 *   2. On checkout.completed, poll the profile until the webhook applies Pro.
 *   3. If the buyer is still anonymous, send them to "secure your account"
 *      (set a password, email pre-filled) so the paid account is recoverable.
 *      Otherwise go straight to the dashboard.
 * Inert with a friendly message until Paddle is configured.
 */
export function useProCheckout() {
  const router = useRouter()
  const refreshProfile = useSessionStore((s) => s.refreshProfile)
  const [loading, setLoading] = useState(false)

  async function confirmPro(paidEmail?: string) {
    toast.success("Payment received — activating Pro…")

    let isPro = false
    for (let i = 0; i < 8; i++) {
      await refreshProfile()
      if (useSessionStore.getState().profile.plan === "pro") {
        isPro = true
        break
      }
      await new Promise((r) => setTimeout(r, 2000))
    }

    // Is this still an anonymous (unrecoverable) account? If so, have them
    // secure it before sending them on.
    const supabase = createClient()
    const { data } = await supabase.auth.getUser()
    const anonymous = data.user?.is_anonymous ?? false

    if (anonymous) {
      const q = new URLSearchParams({ pro: "1", next: "/dashboard" })
      if (paidEmail) q.set("email", paidEmail)
      toast.success("You're Pro 🎉  Set a password to save your access.")
      router.push(`/signup?${q.toString()}`)
      return
    }

    toast.success(isPro ? "You're on Pro 🎉" : "Your Pro access is activating…")
    router.push("/dashboard")
  }

  async function startCheckout() {
    setLoading(true)
    try {
      const supabase = createClient()
      const { data } = await supabase.auth.getUser()
      const user = data.user
      if (!user) {
        toast.error("Please reload the page and try again.")
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
        if (event.name === "checkout.completed") {
          void confirmPro(event.data?.customer?.email)
        }
      })

      paddle.Checkout.open({
        items: [{ priceId, quantity: 1 }],
        // Pre-fill the email only when we already know it; otherwise Paddle
        // collects it during checkout (pay-first for anonymous visitors).
        ...(user.email ? { customer: { email: user.email } } : {}),
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
