"use client"

import { useProCheckout } from "./use-pro-checkout"

const ACCENT = "#1E5C44"

/** Pro CTA for the landing pricing card — starts checkout directly (no detour
 * through a second pricing page). Styled to match the landing design. */
export function LandingProButton() {
  const { startCheckout, loading } = useProCheckout()

  return (
    <button
      type="button"
      onClick={startCheckout}
      disabled={loading}
      style={{
        display: "block",
        width: "100%",
        textAlign: "center",
        background: ACCENT,
        color: "#fff",
        fontWeight: 600,
        fontSize: "15px",
        padding: "13px",
        borderRadius: "11px",
        border: "none",
        cursor: loading ? "default" : "pointer",
        opacity: loading ? 0.7 : 1,
        fontFamily: "inherit",
      }}
    >
      {loading ? "Starting…" : "Upgrade to Pro"}
    </button>
  )
}
