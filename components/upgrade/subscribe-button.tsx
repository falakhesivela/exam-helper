"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Sparkles } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"
import { createClient } from "@/lib/supabase/client"
import { loadPaddle, paddleConfigured } from "@/lib/paddle"
import { getProPriceId } from "@/lib/config/pricing"

/**
 * Opens Paddle checkout for the Pro plan. Anonymous visitors are sent to
 * sign-up first (Paddle needs an email and the buyer must be able to recover
 * their purchase). Inert with a friendly message until Paddle is configured.
 */
export function SubscribeButton() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  async function handleSubscribe() {
    setLoading(true)
    try {
      const supabase = createClient()
      const { data } = await supabase.auth.getUser()
      const user = data.user

      // No real account yet → create one before charging.
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

  return (
    <Button className="w-full" onClick={handleSubscribe} disabled={loading}>
      {loading ? <Spinner data-icon="inline-start" /> : <Sparkles data-icon="inline-start" />}
      Upgrade to Pro
    </Button>
  )
}
