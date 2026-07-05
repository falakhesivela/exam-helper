"use client"

import { motion, AnimatePresence } from "motion/react"
import { Flame } from "lucide-react"
import { cn } from "@/lib/utils"

interface SessionStreakProps {
  streak: number
}

/** In-session consecutive-correct streak with milestone pop. */
export function SessionStreak({ streak }: SessionStreakProps) {
  if (streak < 2) return null

  const milestone = streak === 3 || streak === 5 || (streak > 5 && streak % 5 === 0)

  return (
    <AnimatePresence mode="wait">
      <motion.span
        key={streak}
        initial={{ scale: 0.6, opacity: 0 }}
        animate={{ scale: milestone ? [1, 1.25, 1] : 1, opacity: 1 }}
        exit={{ scale: 0.6, opacity: 0 }}
        transition={{ type: "spring", stiffness: 400, damping: 18 }}
        className={cn(
          "flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold tabular-nums",
          milestone
            ? "bg-warning/15 text-warning"
            : "bg-primary/10 text-primary",
        )}
      >
        <Flame className="size-3.5" />
        {streak}
      </motion.span>
    </AnimatePresence>
  )
}
