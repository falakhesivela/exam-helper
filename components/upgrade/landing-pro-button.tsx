"use client"

import { useCheckout, type CheckoutTier } from "./use-checkout"

const ACCENT = "#1E5C44"

/** Paid-tier CTA for the landing pricing cards — starts checkout directly (no
 * detour through a second pricing page). Styled to match the landing design. */
export function LandingProButton({
  tier = "pro",
  label,
  filled = true,
}: {
  tier?: CheckoutTier
  label: string
  filled?: boolean
}) {
  const { startCheckout, loading } = useCheckout(tier)

  return (
    <button
      type="button"
      onClick={startCheckout}
      disabled={loading}
      style={{
        display: "block",
        width: "100%",
        textAlign: "center",
        background: filled ? ACCENT : "#F4F0E8",
        color: filled ? "#fff" : "#3D403A",
        fontWeight: 600,
        fontSize: "15px",
        padding: "13px",
        borderRadius: "11px",
        border: filled ? "none" : "1px solid #E1DACB",
        cursor: loading ? "default" : "pointer",
        opacity: loading ? 0.7 : 1,
        fontFamily: "inherit",
      }}
    >
      {loading ? "Starting…" : label}
    </button>
  )
}
