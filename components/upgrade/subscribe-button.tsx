"use client"

import { Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"
import { useProCheckout } from "./use-pro-checkout"

/** In-app paywall CTA. See useProCheckout for the subscribe flow. */
export function SubscribeButton() {
  const { startCheckout, loading } = useProCheckout()

  return (
    <Button className="w-full" onClick={startCheckout} disabled={loading}>
      {loading ? <Spinner data-icon="inline-start" /> : <Sparkles data-icon="inline-start" />}
      Upgrade to Pro
    </Button>
  )
}
