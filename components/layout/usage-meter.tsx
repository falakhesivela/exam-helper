"use client"

import Link from "next/link"
import { Sparkles } from "lucide-react"
import { useSessionStore } from "@/lib/store/use-session-store"
import { isPaidTier } from "@/lib/config/tiers"
import { cn } from "@/lib/utils"

/**
 * Slim free-tier usage meter for the top bar. Replaces the old full-width
 * dashboard banner — the hard upgrade sell now happens at limit-hit instead.
 * Renders nothing for Pro users.
 */
export function UsageMeter() {
  const profile = useSessionStore((s) => s.profile)

  // Only the free trial gets the meter; null limit = unlimited.
  if (isPaidTier(profile.plan) || profile.dailyLimit === null) return null

  const used = profile.questionsUsedToday
  const limit = Math.max(1, profile.dailyLimit)
  const remaining = Math.max(0, limit - used)
  const pct = Math.min(100, Math.round((used / limit) * 100))
  const exhausted = remaining === 0

  return (
    <Link
      href="/upgrade"
      aria-label={`Free trial: ${remaining} of ${limit} questions left. Upgrade to Pro for more.`}
      className="group flex w-28 shrink-0 flex-col gap-1 sm:w-32"
    >
      <span className="flex items-baseline justify-between text-[11px] leading-none">
        <span className={cn("tabular-nums", exhausted ? "font-medium text-warning" : "text-muted-foreground")}>
          {exhausted ? "0 left" : `${remaining} left`}
        </span>
        <span className="flex items-center gap-0.5 font-medium text-primary group-hover:underline">
          <Sparkles className="size-3" />
          Go Pro
        </span>
      </span>
      <span className="h-1 overflow-hidden rounded-full bg-muted">
        <span
          className={cn("block h-full rounded-full", exhausted ? "bg-warning" : "bg-primary")}
          style={{ width: `${pct}%` }}
        />
      </span>
    </Link>
  )
}
