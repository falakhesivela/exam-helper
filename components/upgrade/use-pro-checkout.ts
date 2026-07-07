"use client"

import { useCheckout } from "./use-checkout"

/** Back-compat wrapper: Pro checkout. New code should use useCheckout(tier). */
export function useProCheckout() {
  return useCheckout("pro")
}
