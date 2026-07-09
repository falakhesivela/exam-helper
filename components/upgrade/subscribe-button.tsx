"use client"

import { Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"
import { useCheckout, type CheckoutTier } from "./use-checkout"
import { TIER_NAMES } from "@/lib/config/tiers"

function defaultLabel(sku: CheckoutTier): string {
  if (sku === "pro_annual") return "Get Pro — annual"
  return `Get ${TIER_NAMES[sku]}`
}

/** In-app paywall CTA for a paid checkout SKU. See useCheckout for the flow. */
export function SubscribeButton({
  tier = "pro",
  variant = "default",
  label,
}: {
  tier?: CheckoutTier
  variant?: "default" | "outline" | "ghost"
  label?: string
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
      {label ?? defaultLabel(tier)}
    </Button>
  )
}
