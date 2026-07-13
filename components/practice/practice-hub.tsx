"use client"

import { motion } from "motion/react"
import { StudyFastPath } from "@/components/study/study-fast-path"
import { StudyMomentum } from "@/components/study/study-momentum"

/** Focused home for starting, resuming, and reviewing practice work. */
export function PracticeHub() {
  return (
    <div className="flex flex-col gap-6">
      <motion.header
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="flex flex-col gap-1"
      >
        <h1 className="text-2xl font-semibold tracking-tight">Practice</h1>
        <p className="text-sm text-muted-foreground text-pretty">
          Build exam confidence with tailored questions and focused review.
        </p>
      </motion.header>

      <StudyMomentum />
      <StudyFastPath showHeading={false} />
    </div>
  )
}
