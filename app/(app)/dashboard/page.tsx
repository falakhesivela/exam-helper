"use client"

import { useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { motion } from "motion/react"
import { CalendarPlus, Target } from "lucide-react"
import { ConsistencyHeatmap } from "@/components/dashboard/consistency-heatmap"
import { DomainMastery } from "@/components/dashboard/domain-mastery"
import { MomentumStrip } from "@/components/dashboard/momentum-strip"
import { NextActionCard } from "@/components/dashboard/next-action-card"
import { QuickActions } from "@/components/dashboard/quick-actions"
import { ReadinessCard } from "@/components/dashboard/readiness-card"
import { RecentActivity } from "@/components/dashboard/recent-activity"
import { PlanTodayCard } from "@/components/dashboard/plan-today-card"
import { useDueReviewCount } from "@/components/dashboard/use-due-reviews"
import { computePlanPace } from "@/lib/plan/pace"
import { useSessionStore } from "@/lib/store/use-session-store"

function todayIso(): string {
  return new Date().toISOString().slice(0, 10)
}

export default function DashboardPage() {
  const router = useRouter()
  const profile = useSessionStore((s) => s.profile)
  const hydrated = useSessionStore((s) => s.hydrated)
  const sessions = useSessionStore((s) => s.sessions)
  const plan = useSessionStore((s) => s.plan)
  const dueCount = useDueReviewCount()

  // New accounts arriving via OAuth or email confirmation skip the signup
  // redirect — send them to onboarding once. `=== null` is deliberate: an
  // older backend that doesn't send the field (undefined) must never trigger
  // this, and neither may the pre-hydration empty profile.
  useEffect(() => {
    if (
      hydrated &&
      !profile.isAnonymous &&
      profile.email &&
      profile.onboardedAt === null
    ) {
      router.replace("/onboarding")
    }
  }, [hydrated, profile.isAnonymous, profile.email, profile.onboardedAt, router])

  const greeting = (() => {
    const h = new Date().getHours()
    if (h < 12) return "Good morning"
    if (h < 18) return "Good afternoon"
    return "Good evening"
  })()

  const pace = plan ? computePlanPace(plan, todayIso()) : null

  const paceSentence = (() => {
    if (!plan || !pace) return null
    if (pace.status === "complete")
      return "Your plan is complete — you're ready for exam day."
    if (pace.status === "behind")
      return (
        <>
          <span className="font-medium text-warning">
            {pace.behindBy} task{pace.behindBy === 1 ? "" : "s"} behind schedule
          </span>{" "}
          — catch up today to stay on track for {plan.examCode}.
        </>
      )
    return (
      <>
        You&apos;re{" "}
        <span className="font-medium text-primary">
          {pace.status === "ahead" ? "ahead of schedule" : "on track"}
        </span>{" "}
        for {plan.examCode}.
      </>
    )
  })()

  return (
    <div className="flex flex-col gap-6">
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="flex flex-wrap items-start justify-between gap-3"
      >
        <div className="flex flex-col gap-1">
          <p className="text-sm text-muted-foreground">{greeting},</p>
          <h1 className="text-2xl font-semibold tracking-tight text-balance">
            {profile.name
              ? `${profile.name.split(" ")[0]} — ready to forge ahead?`
              : "Ready to forge ahead?"}
          </h1>
          {paceSentence && (
            <p className="text-sm text-muted-foreground">{paceSentence}</p>
          )}
        </div>

        {plan && pace ? (
          <Link
            href="/plan"
            className="inline-flex items-center gap-1.5 rounded-full border border-primary/35 bg-primary/10 px-3 py-1.5 text-sm font-medium transition-colors hover:bg-primary/15"
          >
            <Target className="size-4 text-primary" />
            {plan.examCode} ·{" "}
            <span className="font-semibold text-primary tabular-nums">
              {pace.daysRemaining === 0
                ? "exam day"
                : `${pace.daysRemaining} day${pace.daysRemaining === 1 ? "" : "s"} left`}
            </span>
          </Link>
        ) : (
          <Link
            href="/plan"
            className="inline-flex items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:border-primary/35 hover:text-foreground"
          >
            <CalendarPlus className="size-4 text-primary" />
            Set your exam date
          </Link>
        )}
      </motion.div>

      <div className="grid gap-6 lg:grid-cols-5">
        <div className="lg:col-span-3">
          <ReadinessCard />
        </div>
        <div className="lg:col-span-2">
          <NextActionCard dueCount={dueCount} />
        </div>
      </div>

      <MomentumStrip dueCount={dueCount} />

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="flex flex-col gap-6">
          <DomainMastery />
          <PlanTodayCard />
        </div>
        <div className="flex flex-col gap-6">
          <ConsistencyHeatmap />
          <RecentActivity sessions={sessions} />
        </div>
      </div>

      <QuickActions />
    </div>
  )
}
