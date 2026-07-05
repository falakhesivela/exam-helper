import type { Metadata } from "next"
import type { ReactNode } from "react"

// Payment-recovery landing for Paddle links — not meant for search results.
export const metadata: Metadata = {
  title: "Checkout",
  robots: { index: false, follow: false },
}

export default function CheckoutLayout({ children }: { children: ReactNode }) {
  return children
}
