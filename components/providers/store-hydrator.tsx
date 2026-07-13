"use client"

import { useEffect } from "react"
import { usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import { LoadingScreen } from "@/components/ui/loading-screen"
import { USE_MOCKS } from "@/lib/api/client"
import { createClient } from "@/lib/supabase/client"
import { useSessionStore } from "@/lib/store/use-session-store"

// Public pages that don't read the session store. They must render their
// server content immediately (no loading gate) so the landing and legal pages
// are visible without JS — important for SEO and payment-provider review.
const PUBLIC_PATHS = new Set([
  "/",
  "/login",
  "/signup",
  "/about",
  "/terms",
  "/privacy",
  "/refund",
])

// Whole public sections, matched with their children (/exams/saa-c03, /blog/x).
// Crawlers must get the prerendered guide, not a loading spinner.
const PUBLIC_PREFIXES = ["/exams", "/blog"]

function isPublicPath(pathname: string): boolean {
  if (PUBLIC_PATHS.has(pathname)) return true
  return PUBLIC_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  )
}

function HydrationErrorScreen({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-4 px-6 text-center">
      <div className="flex flex-col gap-1">
        <h1 className="text-lg font-semibold">Couldn&apos;t load your data</h1>
        <p className="text-sm text-muted-foreground text-pretty">
          You&apos;re still signed in — we just couldn&apos;t reach the server.
        </p>
      </div>
      <Button onClick={onRetry}>Try again</Button>
    </div>
  )
}

export function StoreHydrator({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const hydrate = useSessionStore((s) => s.hydrate)
  const hydrated = useSessionStore((s) => s.hydrated)
  const hydrationError = useSessionStore((s) => s.hydrationError)
  const retryHydration = useSessionStore((s) => s.retryHydration)
  const applySignedOut = useSessionStore((s) => s.applySignedOut)

  useEffect(() => {
    void hydrate()
  }, [hydrate])

  // Server-rendered pages authenticate by cookie while every /api/* call
  // authenticates by bearer token. Without this listener the two can drift:
  // the shell renders as signed in while the store stays anonymous, or the
  // reverse, until a manual reload.
  useEffect(() => {
    if (USE_MOCKS) return
    const supabase = createClient()
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event) => {
      // The client replaying storage on mount — the effect above covers it.
      if (event === "INITIAL_SESSION") return

      if (event === "SIGNED_OUT") {
        applySignedOut()
        return
      }

      if (event === "SIGNED_IN" || event === "TOKEN_REFRESHED") {
        // Refetch only when the store disagrees with Supabase. These events
        // also fire on tab focus and hourly refreshes, and a full re-hydrate
        // on every one of those would be a needless burst of requests.
        const { hydrated, profile } = useSessionStore.getState()
        void hydrate({ force: !hydrated || profile.isAnonymous })
      }
    })
    return () => subscription.unsubscribe()
  }, [hydrate, applySignedOut])

  if (USE_MOCKS || isPublicPath(pathname)) return children

  if (hydrationError) {
    return <HydrationErrorScreen onRetry={() => void retryHydration()} />
  }

  if (!hydrated) {
    return <LoadingScreen message="Loading your data…" />
  }

  return children
}
