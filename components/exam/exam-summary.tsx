"use client"

import Link from "next/link"
import { motion } from "motion/react"
import { CheckCircle2, Clock, Home, RotateCcw, XCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import type { PracticeSession } from "@/types"
import { scoreOf, topicBreakdown } from "@/lib/session-utils"
import { formatClock } from "@/hooks/use-countdown"
import { cn } from "@/lib/utils"

interface ExamSummaryProps {
  session: PracticeSession
  timeUsedSec: number
}

/** End-of-exam results: pass/fail verdict, score, time used and breakdown. */
export function ExamSummary({ session, timeUsedSec }: ExamSummaryProps) {
  const { correct, total, pct } = scoreOf(session)
  const breakdown = topicBreakdown(session)
  const passMark = session.passMark ?? 72
  const passed = pct >= passMark

  return (
    <div className="mx-auto flex w-full max-w-lg flex-col gap-5">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 200, damping: 18 }}
        className="flex flex-col items-center gap-3 pt-4 text-center"
      >
        <span
          className={cn(
            "flex size-16 items-center justify-center rounded-2xl",
            passed
              ? "bg-success/15 text-success"
              : "bg-destructive/15 text-destructive",
          )}
        >
          {passed ? (
            <CheckCircle2 className="size-8" />
          ) : (
            <XCircle className="size-8" />
          )}
        </span>
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-semibold tracking-tight">
            {passed ? "You passed!" : "Keep practicing"}
          </h1>
          <p className="text-sm text-muted-foreground">
            {session.examCode} exam simulation
          </p>
        </div>
      </motion.div>

      <Card>
        <CardContent className="flex flex-col items-center gap-2 p-6">
          <p className="text-5xl font-semibold tracking-tight">{pct}%</p>
          <p className="text-sm text-muted-foreground">
            {correct} of {total} correct · pass mark {passMark}%
          </p>
          <Progress value={pct} className="mt-2 h-2" />
          <div className="mt-3 flex items-center gap-4 text-sm text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <Clock className="size-4" />
              {formatClock(Math.max(0, Math.round(timeUsedSec)))} used
            </span>
            <Badge variant={passed ? "default" : "destructive"}>
              {passed ? "Pass" : "Fail"}
            </Badge>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="flex flex-col gap-4 p-5">
          <p className="text-sm font-medium">Topic breakdown</p>
          {breakdown.map((t) => (
            <div key={t.topic} className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between text-sm">
                <span>{t.topic}</span>
                <span className="text-muted-foreground">
                  {t.correct}/{t.total}
                </span>
              </div>
              <Progress value={t.pct} className="h-1.5" />
            </div>
          ))}
        </CardContent>
      </Card>

      <div className="flex flex-col gap-2.5 sm:flex-row">
        <Button asChild size="lg" className="flex-1">
          <Link href="/exam">
            <RotateCcw data-icon="inline-start" />
            New exam
          </Link>
        </Button>
        <Button asChild size="lg" variant="secondary" className="flex-1">
          <Link href={`/history/${session.id}`}>Review answers</Link>
        </Button>
        <Button asChild size="lg" variant="ghost" className="flex-1">
          <Link href="/dashboard">
            <Home data-icon="inline-start" />
            Dashboard
          </Link>
        </Button>
      </div>
    </div>
  )
}
