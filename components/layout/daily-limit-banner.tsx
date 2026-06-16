"use client"

import { Sparkles, Zap } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { useSessionStore } from "@/lib/store/use-session-store"

/**
 * Freemium indicator. Shows the free-tier user's remaining daily questions
 * and an upgrade prompt. Renders nothing for Pro users.
 */
export function DailyLimitBanner() {
  const profile = useSessionStore((s) => s.profile)

  if (profile.plan === "pro") return null

  const used = profile.questionsUsedToday
  const limit = profile.dailyLimit
  const remaining = Math.max(0, limit - used)
  const pct = Math.min(100, (used / limit) * 100)

  return (
    <Alert className="border-primary/30 bg-primary/5">
      <Zap className="text-primary" />
      <AlertTitle className="flex items-center justify-between gap-2">
        <span>Free plan — {remaining} questions left today</span>
      </AlertTitle>
      <AlertDescription className="flex w-full flex-col gap-3">
        <span>
          You&apos;ve used {used} of {limit} daily questions. Resets at midnight.
        </span>
        <Progress value={pct} className="h-1.5" />
        <Button size="sm" className="w-full sm:w-auto">
          <Sparkles data-icon="inline-start" />
          Upgrade to Pro for unlimited
        </Button>
      </AlertDescription>
    </Alert>
  )
}
