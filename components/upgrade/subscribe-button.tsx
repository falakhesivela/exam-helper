"use client"

import { Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"
import { useCheckout, type CheckoutTier } from "./use-checkout"
import { TIER_NAMES } from "@/lib/config/tiers"

/** In-app paywall CTA for a paid tier. See useCheckout for the flow. */
export function SubscribeButton({
  tier = "pro",
  variant = "default",
}: {
  tier?: CheckoutTier
  variant?: "default" | "outline"
}) {
  const { startCheckout, loading } = useCheckout(tier)

  return (
    <Button
      className="w-full"
      variant={variant}
      onClick={startCheckout}
      disabled={loading}
    >
      {loading ? (
        <Spinner data-icon="inline-start" />
      ) : (
        <Sparkles data-icon="inline-start" />
      )}
      Get {TIER_NAMES[tier]}
    </Button>
  )
}
