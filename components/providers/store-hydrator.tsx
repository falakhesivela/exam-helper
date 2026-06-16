"use client"

import { useEffect } from "react"
import { LoadingScreen } from "@/components/ui/loading-screen"
import { USE_MOCKS } from "@/lib/api/client"
import { useSessionStore } from "@/lib/store/use-session-store"

export function StoreHydrator({ children }: { children: React.ReactNode }) {
  const hydrate = useSessionStore((s) => s.hydrate)
  const hydrated = useSessionStore((s) => s.hydrated)

  useEffect(() => {
    void hydrate()
  }, [hydrate])

  if (!hydrated && !USE_MOCKS) {
    return <LoadingScreen message="Loading your data…" />
  }

  return children
}
