"use client"

import { motion } from "motion/react"
import { CheckCircle2, Clock, XCircle } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { ProgressRing } from "@/components/ui/progress-ring"
import { formatClock } from "@/hooks/use-countdown"
import { cn } from "@/lib/utils"

interface ScoreHeroProps {
  examCode: string
  pct: number
  correct: number
  total: number
  passMark: number
  timeUsedSec: number
  durationSec?: number
}

/** Verdict + score ring with the pass mark tick and explicit pass margin. */
export function ScoreHero({
  examCode,
  pct,
  correct,
  total,
  passMark,
  timeUsedSec,
  durationSec,
}: ScoreHeroProps) {
  const passed = pct >= passMark
  const margin = pct - passMark

  return (
    <div className="flex flex-col gap-5">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 200, damping: 18 }}
        className="flex flex-col items-center gap-3 pt-4 text-center motion-reduce:transition-none"
      >
        <span
          className={cn(
            "flex size-14 items-center justify-center rounded-2xl",
            passed
              ? "bg-success/15 text-success"
              : "bg-destructive/15 text-destructive",
          )}
        >
          {passed ? (
            <CheckCircle2 className="size-7" />
          ) : (
            <XCircle className="size-7" />
          )}
        </span>
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-semibold tracking-tight">
            {passed ? "You passed!" : "Not this time — now you know why"}
          </h1>
          <p className="text-sm text-muted-foreground">
            {examCode} exam simulation
          </p>
        </div>
      </motion.div>

      <Card>
        <CardContent className="flex flex-col items-center gap-4 p-6 sm:flex-row sm:justify-center sm:gap-8">
          <ProgressRing
            value={pct}
            size={148}
            tickAt={passMark}
            color={passed ? "var(--success)" : "var(--destructive)"}
          >
            <div className="flex flex-col items-center">
              <span className="text-3xl font-semibold tracking-tight">
                {pct}%
              </span>
              <span className="text-xs text-muted-foreground">
                pass {passMark}%
              </span>
            </div>
          </ProgressRing>

          <div className="flex flex-col items-center gap-2 sm:items-start">
            <Badge variant={passed ? "default" : "destructive"}>
              {passed ? "Pass" : "Fail"}
            </Badge>
            <p
              className={cn(
                "text-sm font-medium",
                passed ? "text-success" : "text-destructive",
              )}
            >
              {margin >= 0
                ? `${margin} pts above the pass mark`
                : `${Math.abs(margin)} pts short of the pass mark`}
            </p>
            <p className="text-sm text-muted-foreground">
              {correct} of {total} correct
            </p>
            <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
              <Clock className="size-4" />
              {formatClock(Math.max(0, Math.round(timeUsedSec)))} used
              {durationSec ? ` of ${formatClock(durationSec)}` : ""}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
