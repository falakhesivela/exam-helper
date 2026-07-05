"use client"

import { Sparkles } from "lucide-react"
import { Spinner } from "@/components/ui/spinner"
import { useGenerationStore } from "@/lib/generation/session-generation"

interface GenerationStatusBannerProps {
  sessionId: string
}

export function GenerationStatusBanner({ sessionId }: GenerationStatusBannerProps) {
  const active = useGenerationStore(
    (s) => (s.active?.sessionId === sessionId ? s.active : null),
  )

  if (!active || active.status !== "generating") return null

  return (
    <div
      role="status"
      aria-live="polite"
      className="border-b border-primary/20 bg-primary/10 px-4 py-2 text-center text-xs text-muted-foreground"
    >
      <span className="inline-flex items-center gap-2">
        <Spinner className="size-3.5" />
        <Sparkles className="size-3.5 text-primary" />
        Generating question {Math.min(active.completedCount + 1, active.expectedCount)}{" "}
        of {active.expectedCount}…
      </span>
    </div>
  )
}

/** Keeps generation module loaded in the app shell. */
export function GenerationTracker() {
  return null
}
