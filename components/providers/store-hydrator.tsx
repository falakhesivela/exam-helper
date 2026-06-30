"use client"

import { useEffect } from "react"
import { usePathname } from "next/navigation"
import { LoadingScreen } from "@/components/ui/loading-screen"
import { USE_MOCKS } from "@/lib/api/client"
import { useSessionStore } from "@/lib/store/use-session-store"

// Public pages that don't read the session store. They must render their
// server content immediately (no loading gate) so the landing and legal pages
// are visible without JS — important for SEO and payment-provider review.
const PUBLIC_PATHS = new Set([
  "/",
  "/login",
  "/signup",
  "/terms",
  "/privacy",
  "/refund",
])

export function StoreHydrator({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const hydrate = useSessionStore((s) => s.hydrate)
  const hydrated = useSessionStore((s) => s.hydrated)

  useEffect(() => {
    void hydrate()
  }, [hydrate])

  if (!hydrated && !USE_MOCKS && !PUBLIC_PATHS.has(pathname)) {
    return <LoadingScreen message="Loading your data…" />
  }

  return children
}
