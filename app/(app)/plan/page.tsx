"use client"

import { motion } from "motion/react"
import { PlanSetupWizard } from "@/components/plan/plan-setup-wizard"
import { PlanOverview } from "@/components/plan/plan-overview"
import { CardSkeleton } from "@/components/ui/card-skeleton"
import { useSessionStore } from "@/lib/store/use-session-store"

export default function PlanPage() {
  const plan = useSessionStore((s) => s.plan)
  const dataReady = useSessionStore((s) => s.dataReady)

  return (
    <div className="flex flex-col gap-6">
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="flex flex-col gap-1"
      >
        <h1 className="text-2xl font-semibold tracking-tight">Study plan</h1>
        <p className="text-sm text-muted-foreground">
          A day-by-day path to your pass mark that adapts as you go.
        </p>
      </motion.div>

      {plan ? (
        <PlanOverview plan={plan} />
      ) : dataReady ? (
        <PlanSetupWizard />
      ) : (
        // Plan still streaming in — don't flash the setup wizard.
        <CardSkeleton rows={5} />
      )}
    </div>
  )
}
