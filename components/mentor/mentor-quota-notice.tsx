"use client"

import Link from "next/link"
import { Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"
import { TIER_LIMITS, TIER_NAMES, type Tier, isTier } from "@/lib/config/tiers"

interface MentorQuotaNoticeProps {
  /** Tier that lifts the limit, from the 402 QUOTA_LIMIT response. */
  upgradeTier?: string
  message?: string
}

/**
 * Shown when Mentor's message quota runs out. A bare error toast here is a churn
 * moment — the whole point of metering is that the wall sells the upgrade.
 */
export function MentorQuotaNotice({
  upgradeTier,
  message,
}: MentorQuotaNoticeProps) {
  const tier: Tier = isTier(upgradeTier) ? upgradeTier : "pro"
  const limits = TIER_LIMITS[tier]
  const allowance =
    limits.mentorMessages === null
      ? "unlimited Mentor messages"
      : `${limits.mentorMessages} Mentor messages ${
          limits.mentorWindow === "daily" ? "a day" : "to start"
        }`

  return (
    <div className="flex flex-col items-start gap-3 rounded-2xl border border-primary/30 bg-primary/5 p-4">
      <p className="text-sm font-medium">
        {message ?? "You've used all your Mentor messages."}
      </p>
      <p className="text-sm text-muted-foreground text-pretty">
        {TIER_NAMES[tier]} includes {allowance}, grounded in your syllabus and
        your weakest domains.
      </p>
      <Button asChild size="sm">
        <Link href="/upgrade">
          <Sparkles data-icon="inline-start" />
          Upgrade to {TIER_NAMES[tier]}
        </Link>
      </Button>
    </div>
  )
}
