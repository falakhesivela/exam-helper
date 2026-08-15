"use client"

import { useCheckout, type CheckoutTier } from "./use-checkout"

const ACCENT = "#1E5C44"

/** Paid-tier CTA for the landing pricing columns — starts checkout directly (no
 * detour through a second pricing page). Matches the landing's flat, ruled
 * button system: square corners, hairline border, no shadow. */
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
        background: filled ? ACCENT : "transparent",
        color: filled ? "#fff" : "#1A1C18",
        fontWeight: 600,
        fontSize: "15px",
        padding: "14px 24px",
        borderRadius: "2px",
        border: `1px solid ${filled ? ACCENT : "#CFC7B4"}`,
        cursor: loading ? "default" : "pointer",
        opacity: loading ? 0.7 : 1,
        fontFamily: "inherit",
      }}
    >
      {loading ? "Starting…" : label}
    </button>
  )
}
